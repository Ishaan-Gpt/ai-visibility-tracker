/**
 * Strict, dependency-free sitemap XML reader: a single-pass tokenizer that checks well-formedness
 * (with line/column), tracks namespace scope, and extracts <url>/<sitemap> entries. Then
 * `validateSitemapDoc` applies the sitemaps.org protocol and Google's documented limits.
 * Pure TypeScript, so it runs in the browser too.
 */
import type { IssueSeverity, ProtocolIssue } from "@/lib/crawl/types";
import { isW3cDatetime } from "@/lib/crawl/url";

export const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

export interface XmlError {
  line: number;
  col: number;
  message: string;
}

export interface ParsedUrl {
  loc: string;
  line: number;
  locCount: number;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images: number;
  hreflang: number;
}

export interface ParsedSitemapDoc {
  kind: "urlset" | "sitemapindex" | "unknown";
  rootName: string;
  rootNs: string;
  declaredEncoding?: string;
  wellFormed: XmlError | null;
  urls: ParsedUrl[];
  children: { loc: string; line: number; locCount: number; lastmod?: string }[];
  /** Prefixes used on elements without an xmlns declaration in scope (e.g. image: with no xmlns:image). */
  undeclaredPrefixes: string[];
  bytes: number;
}

const ENTITY_OK = /&(?:amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);/y;
const NAME = /[A-Za-z_][\w.\-]*(?::[A-Za-z_][\w.\-]*)?/y;
const WS = /\s*/y;

function decodeEntities(s: string): string {
  if (!s.includes("&")) return s;
  return s.replace(/&(amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);/g, (_, e: string) => {
    if (e === "amp") return "&";
    if (e === "lt") return "<";
    if (e === "gt") return ">";
    if (e === "quot") return '"';
    if (e === "apos") return "'";
    const code = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    try {
      return String.fromCodePoint(code);
    } catch {
      return "";
    }
  });
}

function lineIndex(s: string): (offset: number) => { line: number; col: number } {
  const starts = [0];
  for (let i = s.indexOf("\n"); i !== -1; i = s.indexOf("\n", i + 1)) starts.push(i + 1);
  return (offset: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: offset - starts[lo] + 1 };
  };
}

interface Frame {
  name: string;
  local: string;
  ns: string;
  scope: Map<string, string>;
}

export function parseSitemapDoc(text: string): ParsedSitemapDoc {
  const s = text;
  const n = s.length;
  const pos = lineIndex(s);
  const doc: ParsedSitemapDoc = { kind: "unknown", rootName: "", rootNs: "", wellFormed: null, urls: [], children: [], undeclaredPrefixes: [], bytes: 0 };
  const undeclared = new Set<string>();
  const stack: Frame[] = [];
  let rootSeen = false;
  let rootClosed = false;

  // Entry under construction (depth 1) and field capture (depth 2).
  let entry: { kind: "url" | "sitemap"; line: number; loc?: string; locCount: number; lastmod?: string; changefreq?: string; priority?: string; images: number; hreflang: number } | null = null;
  let capture: { field: "loc" | "lastmod" | "changefreq" | "priority"; text: string } | null = null;

  const fail = (offset: number, message: string) => {
    if (!doc.wellFormed) doc.wellFormed = { ...pos(offset), message };
  };

  const checkText = (from: number, to: number): boolean => {
    let amp = s.indexOf("&", from);
    while (amp !== -1 && amp < to) {
      ENTITY_OK.lastIndex = amp;
      if (!ENTITY_OK.test(s)) {
        fail(amp, "Unescaped \"&\". Inside XML it must be written as &amp;");
        return false;
      }
      amp = s.indexOf("&", amp + 1);
    }
    return true;
  };

  let i = 0;
  while (i < n && !doc.wellFormed) {
    const lt = s.indexOf("<", i);
    const textEnd = lt === -1 ? n : lt;
    if (textEnd > i) {
      if (stack.length === 0) {
        if (s.slice(i, textEnd).trim()) {
          fail(i + (s.slice(i, textEnd).length - s.slice(i, textEnd).trimStart().length), rootClosed ? "Content after the closing root tag" : "Text before the root element");
          break;
        }
      } else {
        if (!checkText(i, textEnd)) break;
        if (capture) capture.text += s.slice(i, textEnd);
      }
    }
    if (lt === -1) break;

    if (s.startsWith("<?", lt)) {
      const end = s.indexOf("?>", lt + 2);
      if (end === -1) {
        fail(lt, "Unterminated processing instruction");
        break;
      }
      const body = s.slice(lt + 2, end);
      if (/^xml\s/i.test(body) || body === "xml") {
        if (lt !== 0) fail(lt, "The <?xml ?> declaration must be the very first thing in the file (no blank lines or spaces before it)");
        const enc = body.match(/encoding\s*=\s*["']([^"']+)["']/i);
        if (enc) doc.declaredEncoding = enc[1];
      }
      i = end + 2;
      continue;
    }
    if (s.startsWith("<!--", lt)) {
      const end = s.indexOf("-->", lt + 4);
      if (end === -1) {
        fail(lt, "Unterminated comment");
        break;
      }
      i = end + 3;
      continue;
    }
    if (s.startsWith("<![CDATA[", lt)) {
      const end = s.indexOf("]]>", lt + 9);
      if (end === -1 || stack.length === 0) {
        fail(lt, end === -1 ? "Unterminated CDATA section" : "CDATA outside the root element");
        break;
      }
      if (capture) capture.text += s.slice(lt + 9, end);
      i = end + 3;
      continue;
    }
    if (s.startsWith("<!", lt)) {
      // DOCTYPE (possibly with an internal subset)
      if (rootSeen) {
        fail(lt, "Unexpected <! declaration inside the document");
        break;
      }
      let depth = 0;
      let j = lt + 2;
      for (; j < n; j++) {
        const c = s[j];
        if (c === "[") depth++;
        else if (c === "]") depth--;
        else if (c === ">" && depth <= 0) break;
      }
      i = j + 1;
      continue;
    }

    if (s[lt + 1] === "/") {
      NAME.lastIndex = lt + 2;
      const m = NAME.exec(s);
      if (!m) {
        fail(lt, "Malformed closing tag");
        break;
      }
      let j = NAME.lastIndex;
      WS.lastIndex = j;
      WS.exec(s);
      j = WS.lastIndex;
      if (s[j] !== ">") {
        fail(j, `Malformed closing tag </${m[0]}`);
        break;
      }
      const top = stack.pop();
      if (!top) {
        fail(lt, `Closing tag </${m[0]}> without a matching opening tag`);
        break;
      }
      if (top.name !== m[0]) {
        fail(lt, `Expected </${top.name}> but found </${m[0]}>`);
        break;
      }
      // Close handlers
      const depth = stack.length; // depth of the closed element
      if (depth === 2 && capture && entry) {
        const v = decodeEntities(capture.text).trim();
        if (capture.field === "loc") {
          if (entry.loc === undefined) entry.loc = v;
        } else entry[capture.field] = v;
        capture = null;
      } else if (depth === 1 && entry) {
        if (entry.kind === "url") {
          doc.urls.push({ loc: entry.loc ?? "", line: entry.line, locCount: entry.locCount, lastmod: entry.lastmod, changefreq: entry.changefreq, priority: entry.priority, images: entry.images, hreflang: entry.hreflang });
        } else {
          doc.children.push({ loc: entry.loc ?? "", line: entry.line, locCount: entry.locCount, lastmod: entry.lastmod });
        }
        entry = null;
      }
      if (stack.length === 0) rootClosed = true;
      i = j + 1;
      continue;
    }

    // Start tag
    NAME.lastIndex = lt + 1;
    const nm = NAME.exec(s);
    if (!nm) {
      fail(lt, "A raw \"<\" in text. Escape it as &lt;");
      break;
    }
    if (rootClosed) {
      fail(lt, "A second root element. A sitemap has exactly one <urlset> or <sitemapindex>");
      break;
    }
    const name = nm[0];
    let j = NAME.lastIndex;
    const attrs = new Map<string, string>();
    let selfClose = false;
    let ok = false;
    while (j < n) {
      WS.lastIndex = j;
      WS.exec(s);
      const hadSpace = WS.lastIndex > j;
      j = WS.lastIndex;
      if (s[j] === ">") {
        ok = true;
        j++;
        break;
      }
      if (s[j] === "/" && s[j + 1] === ">") {
        ok = true;
        selfClose = true;
        j += 2;
        break;
      }
      if (!hadSpace) {
        fail(j, `Expected a space or ">" in <${name}>`);
        break;
      }
      NAME.lastIndex = j;
      const an = NAME.exec(s);
      if (!an) {
        fail(j, `Malformed attribute in <${name}>`);
        break;
      }
      j = NAME.lastIndex;
      WS.lastIndex = j;
      WS.exec(s);
      j = WS.lastIndex;
      if (s[j] !== "=") {
        fail(j, `Attribute "${an[0]}" in <${name}> has no value`);
        break;
      }
      j++;
      WS.lastIndex = j;
      WS.exec(s);
      j = WS.lastIndex;
      const q = s[j];
      if (q !== '"' && q !== "'") {
        fail(j, `Attribute values must be quoted in <${name}>`);
        break;
      }
      const close = s.indexOf(q, j + 1);
      if (close === -1) {
        fail(j, `Unterminated attribute value in <${name}>`);
        break;
      }
      const raw = s.slice(j + 1, close);
      if (raw.includes("<")) {
        fail(j, `Raw "<" inside an attribute value in <${name}>`);
        break;
      }
      if (!checkText(j + 1, close)) break;
      if (attrs.has(an[0])) {
        fail(j, `Duplicate attribute "${an[0]}" in <${name}>`);
        break;
      }
      attrs.set(an[0], decodeEntities(raw));
      j = close + 1;
    }
    if (!ok || doc.wellFormed) {
      if (!doc.wellFormed) fail(lt, `Unterminated tag <${name}`);
      break;
    }

    const parentScope = stack.length ? stack[stack.length - 1].scope : new Map<string, string>([["xml", "http://www.w3.org/XML/1998/namespace"]]);
    let scope = parentScope;
    for (const [k, v] of attrs) {
      if (k === "xmlns" || k.startsWith("xmlns:")) {
        if (scope === parentScope) scope = new Map(parentScope);
        scope.set(k === "xmlns" ? "" : k.slice(6), v);
      }
    }
    const colon = name.indexOf(":");
    const prefix = colon === -1 ? "" : name.slice(0, colon);
    const local = colon === -1 ? name : name.slice(colon + 1);
    const ns = scope.get(prefix) ?? "";
    if (prefix && !scope.has(prefix)) undeclared.add(prefix);

    const depth = stack.length; // depth of this element (root = 0)
    if (depth === 0) {
      rootSeen = true;
      doc.rootName = name;
      doc.rootNs = ns;
      doc.kind = local === "urlset" ? "urlset" : local === "sitemapindex" ? "sitemapindex" : "unknown";
    } else if (depth === 1 && ns === doc.rootNs) {
      if ((doc.kind === "urlset" && local === "url") || (doc.kind === "sitemapindex" && local === "sitemap")) {
        entry = { kind: local === "url" ? "url" : "sitemap", line: pos(lt).line, locCount: 0, images: 0, hreflang: 0 };
      }
    } else if (depth === 2 && entry) {
      if (ns === doc.rootNs && (local === "loc" || local === "lastmod" || local === "changefreq" || local === "priority")) {
        if (local === "loc") entry.locCount++;
        if (!selfClose) capture = { field: local, text: "" };
      } else if (local === "image" && (ns === IMAGE_NS || prefix === "image")) entry.images++;
      else if (local === "link" && (ns === XHTML_NS || prefix === "xhtml") && attrs.get("rel") === "alternate" && attrs.has("hreflang")) entry.hreflang++;
    }

    if (!selfClose) stack.push({ name, local, ns, scope });
    else if (depth === 0) rootClosed = true;
    i = j;
  }

  if (!doc.wellFormed) {
    if (!rootSeen) fail(0, "No XML root element found");
    else if (stack.length) fail(n, `<${stack[stack.length - 1].name}> is never closed (the file may be truncated)`);
  }
  doc.undeclaredPrefixes = [...undeclared];
  doc.bytes = n;
  return doc;
}

/* ------------------------------------------------------------------ */

class IssueBag {
  private map = new Map<string, ProtocolIssue>();
  add(code: string, severity: IssueSeverity, message: string, fix: string, example?: { line?: number; value?: string; file?: string }) {
    let it = this.map.get(code);
    if (!it) {
      it = { code, severity, message, fix, count: 0, examples: [] };
      this.map.set(code, it);
    }
    it.count++;
    if (example && it.examples.length < 5) it.examples.push(example);
  }
  list(): ProtocolIssue[] {
    const rank = { error: 0, warning: 1, info: 2 } as const;
    return [...this.map.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
  }
}

const CHANGEFREQ = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
export const MAX_URLS_PER_FILE = 50_000;
export const MAX_BYTES_PER_FILE = 50 * 1024 * 1024;

export interface ValidateContext {
  fileUrl: string;
  /** Raw byte size (uncompressed). */
  sizeBytes: number;
  /** This file was listed inside a sitemap index. */
  nestedInIndex?: boolean;
  /** The site hosts this sitemap may list (sitemap host, and www/apex twin). */
  allowedHosts?: string[];
  now?: number;
}

/** sitemaps.org protocol + Google Search Central rules for one parsed file. */
export function validateSitemapDoc(doc: ParsedSitemapDoc, ctx: ValidateContext): ProtocolIssue[] {
  const bag = new IssueBag();
  const file = ctx.fileUrl;
  const now = ctx.now ?? Date.now();
  let fileHost = "";
  let fileProto = "";
  try {
    const u = new URL(file);
    fileHost = u.hostname.toLowerCase();
    fileProto = u.protocol;
  } catch {
    /* ignore */
  }
  const allowed = new Set((ctx.allowedHosts ?? [fileHost]).map((h) => h.toLowerCase()));

  if (doc.wellFormed) {
    bag.add(
      "malformed",
      "error",
      "The XML is not well-formed, so search engines cannot read this sitemap at all",
      "Fix the error at the line shown. Most often it is an unescaped & in a URL (write &amp;) or a tag that was cut off.",
      { line: doc.wellFormed.line, value: `${doc.wellFormed.message} (line ${doc.wellFormed.line}, column ${doc.wellFormed.col})`, file },
    );
  }
  if (doc.declaredEncoding && !/^utf-?8$/i.test(doc.declaredEncoding)) {
    bag.add("encoding", "error", `The file declares encoding="${doc.declaredEncoding}". Sitemaps must be UTF-8`, "Save the file as UTF-8 and declare <?xml version=\"1.0\" encoding=\"UTF-8\"?>.", { value: doc.declaredEncoding, file });
  }
  if (doc.kind === "unknown" && doc.rootName) {
    bag.add("bad-root", "error", `The root element is <${doc.rootName}>, not <urlset> or <sitemapindex>`, "A sitemap must start with <urlset> (a list of pages) or <sitemapindex> (a list of sitemaps). RSS/Atom feeds are accepted by Google but are not sitemaps.", { value: doc.rootName, file });
  }
  if (doc.kind !== "unknown" && doc.rootNs !== SITEMAP_NS) {
    bag.add(
      "namespace",
      "error",
      doc.rootNs ? `Wrong sitemap namespace: ${doc.rootNs}` : "The sitemap namespace is missing",
      `Add xmlns="${SITEMAP_NS}" to the root element exactly as written (http, not https, and version 0.9).`,
      { value: doc.rootNs || "(none)", file },
    );
  }
  for (const p of doc.undeclaredPrefixes) {
    bag.add("undeclared-prefix", "error", `The "${p}:" prefix is used without declaring its namespace`, p === "image" ? `Add xmlns:image="${IMAGE_NS}" to <urlset>.` : p === "xhtml" ? `Add xmlns:xhtml="${XHTML_NS}" to <urlset>.` : `Declare xmlns:${p}="..." on the root element.`, { value: `${p}:`, file });
  }
  if (ctx.sizeBytes > MAX_BYTES_PER_FILE) {
    bag.add("too-large", "error", `The file is ${(ctx.sizeBytes / 1048576).toFixed(1)} MB uncompressed, over the 50 MB limit`, "Split it into several sitemaps of under 50 MB each and list them in a sitemap index.", { file });
  }
  if (doc.kind === "sitemapindex" && ctx.nestedInIndex) {
    bag.add("nested-index", "error", "A sitemap index lists another sitemap index", "Sitemap indexes cannot be nested. List the child sitemaps directly in one index.", { file });
  }

  const entries = doc.kind === "sitemapindex" ? doc.children : doc.urls;
  const limitWord = doc.kind === "sitemapindex" ? "sitemaps" : "URLs";
  if (doc.kind !== "unknown" && entries.length === 0 && !doc.wellFormed) {
    bag.add("empty", "warning", `This ${doc.kind === "sitemapindex" ? "index" : "sitemap"} lists no ${limitWord}`, "Remove it, or make sure your CMS is generating entries.", { file });
  }
  if (entries.length > MAX_URLS_PER_FILE) {
    bag.add("too-many", "error", `${entries.length.toLocaleString()} ${limitWord} in one file, over the 50,000 limit`, "Split it into files of up to 50,000 entries and reference them from a sitemap index.", { file });
  }

  const seen = new Set<string>();
  const lastmods = new Map<string, number>();
  let lastmodCount = 0;
  for (const e of entries) {
    if (e.locCount === 0 || !e.loc) {
      bag.add("missing-loc", "error", "An entry has no <loc>", "Every <url> (or <sitemap>) needs exactly one <loc> with the full URL.", { line: e.line, file });
      continue;
    }
    if (e.locCount > 1) bag.add("multi-loc", "error", "An entry has more than one <loc>", "Use one <url> element per URL.", { line: e.line, value: e.loc, file });
    let u: URL | null = null;
    try {
      u = new URL(e.loc);
    } catch {
      u = null;
    }
    if (!u || (u.protocol !== "http:" && u.protocol !== "https:")) {
      bag.add("relative-loc", "error", "A <loc> is not an absolute http(s) URL", "Write full URLs including https:// and the domain. Relative paths are not allowed.", { line: e.line, value: e.loc, file });
      continue;
    }
    if (e.loc.length > 2048) bag.add("loc-too-long", "error", "A URL is longer than 2,048 characters", "Shorten the URL or leave it out of the sitemap.", { line: e.line, value: `${e.loc.slice(0, 80)}…`, file });
    if (/\s/.test(e.loc) || /[^\x21-\x7e]/.test(e.loc)) {
      bag.add("unencoded", "warning", "A URL contains spaces or non-ASCII characters", "Percent-encode URLs (a space becomes %20, é becomes %C3%A9).", { line: e.line, value: e.loc, file });
    }
    if (fileHost && !allowed.has(u.hostname.toLowerCase())) {
      bag.add(
        "cross-host",
        "warning",
        `A URL is on a different host than the sitemap (${u.hostname})`,
        "The protocol only allows URLs on the sitemap's own host. Google accepts cross-host sitemaps only when you have verified both sites in Search Console; otherwise move this URL to that host's own sitemap.",
        { line: e.line, value: e.loc, file },
      );
    } else if (fileProto && u.protocol !== fileProto) {
      bag.add("protocol-mismatch", "warning", `A URL uses ${u.protocol.replace(":", "")} while the sitemap is served over ${fileProto.replace(":", "")}`, "List the URLs with the same protocol your site actually serves (normally https).", { line: e.line, value: e.loc, file });
    }
    if (seen.has(e.loc)) bag.add("duplicate", "warning", "The same URL is listed more than once", "List each URL once. Duplicates waste crawl budget and make reports noisy.", { line: e.line, value: e.loc, file });
    seen.add(e.loc);

    if (e.lastmod !== undefined) {
      lastmodCount++;
      if (!isW3cDatetime(e.lastmod)) {
        bag.add("lastmod-format", "warning", "A <lastmod> is not in W3C Datetime format", "Use YYYY-MM-DD, or a full timestamp with a timezone such as 2026-10-13T09:30:00+00:00. Google ignores lastmod values it cannot parse.", { line: e.line, value: e.lastmod, file });
      } else {
        const t = Date.parse(e.lastmod.length === 4 ? `${e.lastmod}-01-01` : e.lastmod.length === 7 ? `${e.lastmod}-01` : e.lastmod);
        if (!Number.isNaN(t) && t > now + 2 * 86_400_000) bag.add("lastmod-future", "warning", "A <lastmod> is in the future", "Use the date the content last changed. Future dates teach Google to distrust your lastmod values.", { line: e.line, value: e.lastmod, file });
        lastmods.set(e.lastmod, (lastmods.get(e.lastmod) ?? 0) + 1);
      }
    }
    const ext = e as { changefreq?: string; priority?: string };
    if (ext.changefreq !== undefined && !CHANGEFREQ.has(ext.changefreq)) {
      bag.add("changefreq", "warning", "Invalid <changefreq> value", "Use one of always, hourly, daily, weekly, monthly, yearly, never (lowercase). Google ignores changefreq anyway, so removing it is also fine.", { line: e.line, value: ext.changefreq, file });
    }
    if (ext.priority !== undefined) {
      const p = Number(ext.priority);
      if (!/^(0(\.\d+)?|1(\.0+)?)$/.test(ext.priority) || p < 0 || p > 1) bag.add("priority", "warning", "Invalid <priority> value", "Priority must be a number from 0.0 to 1.0. Google ignores it, so removing it is also fine.", { line: e.line, value: ext.priority, file });
    }
  }

  if (doc.kind === "urlset" && lastmodCount >= 20) {
    const [topValue, topCount] = [...lastmods.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    if (topCount / lastmodCount >= 0.9) {
      bag.add(
        "lastmod-uniform",
        "warning",
        `${Math.round((topCount / lastmodCount) * 100)}% of URLs share the same lastmod (${topValue})`,
        "This usually means the generator stamps the build or request time. Google only uses lastmod when it is consistently accurate, so set it to each page's real last content change.",
        { value: topValue, file },
      );
    }
  }
  if (doc.kind === "urlset" && entries.length > 0 && lastmodCount === 0) {
    bag.add("no-lastmod", "info", "No URL has a <lastmod>", "Accurate lastmod dates help Google recrawl changed pages sooner. Add them if your CMS knows when content changed.", { file });
  }
  return bag.list();
}

/** Merges per-file issues into one list for the whole sitemap set. */
export function mergeIssues(lists: ProtocolIssue[][]): ProtocolIssue[] {
  const map = new Map<string, ProtocolIssue>();
  for (const list of lists) {
    for (const it of list) {
      const cur = map.get(it.code);
      if (!cur) map.set(it.code, { ...it, examples: [...it.examples] });
      else {
        cur.count += it.count;
        for (const ex of it.examples) if (cur.examples.length < 5) cur.examples.push(ex);
      }
    }
  }
  const rank = { error: 0, warning: 1, info: 2 } as const;
  return [...map.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
}
