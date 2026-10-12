import "server-only";
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { extractStructuredData, type SdNode } from "@/lib/tools/pageExtract/structuredData";
import type { ContentBlock, ContentBlockType, ImageRef, MetaTag, PageExtract } from "@/lib/tools/pageExtract/types";

/* ------------------------------ helpers ------------------------------ */

const MAX_META = 300;
const MAX_HEADINGS = 400;
const MAX_IMAGES = 300;
const MAX_TEXT = 400_000;

function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function abs(href: string | undefined | null, base: string): string | null {
  if (!href || !href.trim()) return null;
  try {
    return new URL(href.trim(), base).href;
  } catch {
    return null;
  }
}

function isElement(n: AnyNode): n is Element {
  return n.type === "tag" || n.type === "script" || n.type === "style";
}

function nodeText(n: AnyNode): string {
  if (n.type === "text") return (n as unknown as { data: string }).data;
  const kids = (n as { children?: AnyNode[] }).children;
  if (!kids) return "";
  let out = "";
  for (const k of kids) out += nodeText(k);
  return out;
}

/** Adapts a domhandler node (from cheerio) to the structured-data extractor's node interface. */
function chNode(n: AnyNode): SdNode {
  const el = isElement(n) ? n : null;
  return {
    tag: el ? el.name.toLowerCase() : n.type === "root" ? "#root" : "",
    attr: (name) => (el ? el.attribs[name] : undefined),
    children: () => ((n as { children?: AnyNode[] }).children ?? []).filter((c) => isElement(c) || c.type === "text").map(chNode),
    text: () => nodeText(n),
  };
}

export function countWords(text: string): number {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu)?.length ?? 0;
}

/* --------------------------- main content --------------------------- */

const SKIP_TAGS = new Set(["script", "style", "noscript", "template", "svg", "canvas", "iframe", "object", "embed", "form", "button", "input", "select", "textarea", "nav", "aside", "dialog", "head", "video", "audio", "map"]);
const BLOCK_TYPES: Record<string, ContentBlockType | null> = {
  h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", h6: "h6",
  p: "p", li: "li", blockquote: "blockquote", pre: "pre", td: "td", th: "td", caption: "caption", figcaption: "caption", dt: "p", dd: "p",
  div: null, section: null, article: null, main: null, header: null, footer: null, ul: null, ol: null, dl: null, table: null, tbody: null, thead: null, tr: null,
  figure: null, details: null, summary: null, address: null, hr: null, body: null, center: null,
};
const NOISE = /(^|[\s_-])(comments?|sidebar|side-bar|widget|footer|navbar|nav|menu|breadcrumbs?|share|sharing|social|related|recommended|promo|cookie|consent|banner|newsletter|subscribe|popup|modal|advert|ads|ad-slot|sponsor|outbrain|taboola|disqus|skip-link|pagination|pager|masthead|toolbar|byline-share)([\s_-]|$)/i;
const POSITIVE = /(^|[\s_-])(article|content|main|post|entry|story|body|text|blog|prose|markdown|recipe|product)([\s_-]|$)/i;

function collectBlocks(root: AnyNode): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let buf = "";
  let size = 0;
  const flush = (type: ContentBlockType) => {
    const t = clean(buf);
    buf = "";
    if (!t || size > MAX_TEXT) return;
    size += t.length;
    blocks.push({ type, text: t });
  };
  const rec = (node: AnyNode, type: ContentBlockType) => {
    for (const child of (node as { children?: AnyNode[] }).children ?? []) {
      if (child.type === "text") {
        buf += (child as unknown as { data: string }).data;
        continue;
      }
      if (!isElement(child)) continue;
      const tag = child.name.toLowerCase();
      if (SKIP_TAGS.has(tag)) continue;
      if (child.attribs.hidden !== undefined || child.attribs["aria-hidden"] === "true") continue;
      if (tag === "br") {
        buf += " ";
        continue;
      }
      if (tag in BLOCK_TYPES) {
        const own = BLOCK_TYPES[tag] ?? type;
        flush(type);
        rec(child, own);
        flush(own);
      } else rec(child, type);
    }
  };
  rec(root, "p");
  return blocks;
}

function linkDensity($: cheerio.CheerioAPI, el: Element): number {
  const total = clean($(el).text()).length || 1;
  let linked = 0;
  $(el)
    .find("a")
    .each((_, a) => {
      linked += clean($(a).text()).length;
    });
  return linked / total;
}

function pickMain($: cheerio.CheerioAPI): { el: AnyNode; source: PageExtract["content"]["source"] } {
  const words = (el: Element) => countWords($(el).text());

  const body = $("body")[0] ?? $.root()[0];
  const articleBody = $('[itemprop="articleBody"]').toArray();
  if (articleBody.length) {
    const best = articleBody.sort((a, b) => words(b) - words(a))[0];
    if (words(best) >= 80) return { el: best, source: "article" };
  }
  const articles = $("article").toArray();
  if (articles.length) {
    const best = articles.sort((a, b) => words(b) - words(a))[0];
    // A listing page has many small <article> cards; only trust one that holds most of the page's text.
    if (words(best) >= 150 || (articles.length === 1 && words(best) >= 80)) return { el: best, source: "article" };
  }
  const main = $("main")[0];
  if (main && words(main) >= 80) return { el: main, source: "main" };
  const roleMain = $('[role="main"]')[0];
  if (roleMain && words(roleMain) >= 80) return { el: roleMain, source: "role-main" };

  // Readability-style density scoring: paragraphs vote for their parent (and half for the grandparent).
  const scores = new Map<Element, number>();
  $("p, pre, td, blockquote").each((_, p) => {
    const text = clean($(p).text());
    if (text.length < 25) return;
    const score = 1 + (text.match(/[,，、]/g)?.length ?? 0) + Math.min(Math.floor(text.length / 100), 3);
    const parent = p.parent && isElement(p.parent as AnyNode) ? (p.parent as Element) : null;
    if (!parent) return;
    scores.set(parent, (scores.get(parent) ?? 0) + score);
    const gp = parent.parent && isElement(parent.parent as AnyNode) ? (parent.parent as Element) : null;
    if (gp) scores.set(gp, (scores.get(gp) ?? 0) + score / 2);
  });
  let best: Element | null = null;
  let bestScore = 0;
  for (const [el, s] of scores) {
    const adjusted = s * (1 - linkDensity($, el));
    if (adjusted > bestScore) {
      bestScore = adjusted;
      best = el;
    }
  }
  if (best && words(best) >= 60) return { el: best, source: "density" };
  return { el: body, source: "body" };
}

/* ------------------------------ extract ------------------------------ */

export interface RawPage {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirects: string[];
  headers: Record<string, string>;
  body: string;
  elapsedMs: number;
  bytes: number;
  truncated: boolean;
}

function firstDate(node: unknown, key: "datePublished" | "dateModified", depth = 0): string | null {
  if (depth > 6 || !node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const d = firstDate(n, key, depth + 1);
      if (d) return d;
    }
    return null;
  }
  const o = node as Record<string, unknown>;
  if (typeof o[key] === "string") return o[key] as string;
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      const d = firstDate(v, key, depth + 1);
      if (d) return d;
    }
  }
  return null;
}

export function extractPage(raw: RawPage): PageExtract {
  const contentType = raw.headers["content-type"] ?? "";
  const isHtml = /text\/html|application\/xhtml/i.test(contentType) || /<html|<!doctype html|<head|<body/i.test(raw.body.slice(0, 2000));
  const $ = cheerio.load(isHtml ? raw.body : "");
  const base = abs($("base[href]").attr("href"), raw.finalUrl) ?? raw.finalUrl;

  // ---- head
  const titles = $("title")
    .filter((_, el) => $(el).parents("svg").length === 0)
    .map((_, el) => clean($(el).text()))
    .get();

  const metaTags: MetaTag[] = [];
  const og: Record<string, string[]> = {};
  const twitter: Record<string, string[]> = {};
  const metaDescriptions: string[] = [];
  const robotsMeta: string[] = [];
  const googlebot: string[] = [];
  let charset: string | null = null;
  let viewport: string | null = null;
  let themeColor: string | null = null;
  let appName: string | null = null;
  let metaPublished: string | null = null;
  let metaModified: string | null = null;

  $("meta").each((_, el) => {
    const a = (el as Element).attribs;
    if (a.charset) {
      charset ??= a.charset;
      if (metaTags.length < MAX_META) metaTags.push({ key: "charset", attr: "charset", content: a.charset });
      return;
    }
    const content = a.content ?? "";
    const attr: MetaTag["attr"] | null = a.property !== undefined ? "property" : a.name !== undefined ? "name" : a["http-equiv"] !== undefined ? "http-equiv" : a.itemprop !== undefined ? "itemprop" : null;
    if (!attr) return;
    const key = (a[attr] ?? "").trim();
    const lower = key.toLowerCase();
    if (metaTags.length < MAX_META) metaTags.push({ key, attr, content });
    if (attr === "http-equiv" && lower === "content-type") charset ??= content.match(/charset=([\w-]+)/i)?.[1] ?? null;
    if (lower === "description" && attr === "name") metaDescriptions.push(content);
    else if (lower === "robots" && attr === "name") robotsMeta.push(content);
    else if (lower === "googlebot" && attr === "name") googlebot.push(content);
    else if (lower === "viewport") viewport ??= content;
    else if (lower === "theme-color") themeColor ??= content;
    else if (lower === "application-name") appName ??= content;
    if (/^(og|article|product|fb|profile|book|video|music|place|business):/.test(lower)) (og[lower] ??= []).push(content);
    else if (lower.startsWith("twitter:")) (twitter[lower] ??= []).push(content);
    if (!metaPublished && ["article:published_time", "datepublished", "date", "pubdate", "publish-date", "dc.date.issued", "sailthru.date"].includes(lower)) metaPublished = content;
    if (!metaModified && ["article:modified_time", "og:updated_time", "datemodified", "last-modified"].includes(lower)) metaModified = content;
  });

  const canonicals = $("link[rel]")
    .filter((_, el) => ((el as Element).attribs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((_, el) => abs((el as Element).attribs.href, base) ?? (el as Element).attribs.href ?? "")
    .get();

  let favicon: string | null = null;
  let appleTouchIcon: string | null = null;
  $("link[rel][href]").each((_, el) => {
    const a = (el as Element).attribs;
    const rels = a.rel.toLowerCase().split(/\s+/);
    if (rels.includes("icon") && !favicon) favicon = abs(a.href, base);
    if (rels.includes("apple-touch-icon") && !appleTouchIcon) appleTouchIcon = abs(a.href, base);
  });
  if (!favicon && isHtml) favicon = abs("/favicon.ico", raw.finalUrl);

  const hreflang = $('link[rel="alternate"][hreflang]')
    .map((_, el) => ({ lang: (el as Element).attribs.hreflang, href: abs((el as Element).attribs.href, base) ?? "" }))
    .get()
    .slice(0, 100);

  // ---- structured data (before any DOM mutation)
  const structuredData = isHtml ? extractStructuredData(chNode($.root()[0]), base) : { jsonLd: [], microdata: [], rdfa: [], warnings: [] };
  const ldValues = structuredData.jsonLd.filter((b) => b.ok).map((b) => (b as { data: unknown }).data);
  const ldSiteName = (() => {
    const find = (n: unknown, d = 0): string | null => {
      if (d > 5 || !n || typeof n !== "object") return null;
      if (Array.isArray(n)) {
        for (const x of n) {
          const r = find(x, d + 1);
          if (r) return r;
        }
        return null;
      }
      const o = n as Record<string, unknown>;
      if (o["@type"] === "WebSite" && typeof o.name === "string") return o.name;
      if (Array.isArray(o["@graph"])) return find(o["@graph"], d + 1);
      return null;
    };
    return find(ldValues);
  })();

  // ---- headings, links
  const headings: PageExtract["headings"] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    if (headings.length >= MAX_HEADINGS) return false;
    const text = clean($(el).text());
    if (text) headings.push({ level: Number((el as Element).name[1]), text: text.slice(0, 300) });
  });

  let internal = 0;
  let external = 0;
  const host = (() => {
    try {
      return new URL(raw.finalUrl).host.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  $("a[href]").each((_, el) => {
    const href = (el as Element).attribs.href;
    if (/^(#|javascript:|mailto:|tel:)/i.test(href)) return;
    const u = abs(href, base);
    if (!u) return;
    try {
      if (new URL(u).host.replace(/^www\./, "") === host) internal++;
      else external++;
    } catch {
      /* ignore */
    }
  });

  // ---- main content (mutates the DOM)
  let content: PageExtract["content"] = { source: "body", blocks: [], text: "", wordCount: 0, images: [] };
  if (isHtml) {
    $("script, style, noscript, template, svg, iframe, nav, aside, dialog, form, [role=navigation], [role=banner], [role=contentinfo], [role=complementary], [role=search], [role=dialog], [aria-hidden=true], [hidden]").remove();
    $("header, footer").each((_, el) => {
      if ($(el).parents("article, main, [role=main]").length === 0) $(el).remove();
    });
    $("div, section, ul, ol, span, p, table").each((_, el) => {
      const a = (el as Element).attribs;
      const sig = `${a.class ?? ""} ${a.id ?? ""}`;
      if (sig.trim() && NOISE.test(sig) && !POSITIVE.test(sig)) $(el).remove();
    });
    const { el, source } = pickMain($);
    const blocks = collectBlocks(el);
    const images: ImageRef[] = [];
    $(el)
      .find("img")
      .each((_, img) => {
        if (images.length >= MAX_IMAGES) return false;
        const a = (img as Element).attribs;
        const srcRaw = a.src && !a.src.startsWith("data:") ? a.src : (a["data-src"] ?? a["data-lazy-src"] ?? a["data-original"] ?? a.srcset?.split(",")[0]?.trim().split(/\s+/)[0]);
        const src = abs(srcRaw, base);
        if (!src) return;
        const w = Number(a.width);
        const h = Number(a.height);
        images.push({ src, alt: a.alt === undefined ? null : a.alt, ...(w ? { width: w } : {}), ...(h ? { height: h } : {}) });
      });
    const text = blocks.map((b) => b.text).join("\n\n");
    content = { source, blocks, text, wordCount: countWords(text), images };
  }

  return {
    requestedUrl: raw.requestedUrl,
    finalUrl: raw.finalUrl,
    status: raw.status,
    redirects: raw.redirects,
    contentType,
    isHtml,
    fetchedAt: Date.now(),
    elapsedMs: raw.elapsedMs,
    bytes: raw.bytes,
    truncated: raw.truncated,
    lang: clean($("html").attr("lang")) || null,
    charset,
    viewport,
    titles,
    metaDescriptions,
    canonicals,
    robots: { meta: robotsMeta, googlebot, xRobotsTag: raw.headers["x-robots-tag"] ?? null },
    og,
    twitter,
    metaTags,
    siteName: og["og:site_name"]?.[0] ?? ldSiteName ?? appName ?? null,
    favicon,
    appleTouchIcon,
    themeColor,
    hreflang,
    dates: {
      published: metaPublished ?? firstDate(ldValues, "datePublished"),
      modified: metaModified ?? firstDate(ldValues, "dateModified"),
    },
    headings,
    content,
    links: { internal, external },
    structuredData,
  };
}
