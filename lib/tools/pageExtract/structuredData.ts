import { parseJsonLocated } from "@/lib/tools/validation/jsonParse";
import type { JsonLdBlock, SdItem, StructuredData } from "@/lib/tools/pageExtract/types";

/**
 * Structured-data extraction (JSON-LD, microdata, RDFa Lite) over a tiny node interface,
 * so the same code runs on the server (cheerio/domhandler) and in the browser (DOMParser)
 * for the validator's "Paste code" mode. No DOM or cheerio import lives in this file.
 */

export interface SdNode {
  /** Lowercase tag name, or "" for text nodes. */
  tag: string;
  attr(name: string): string | undefined;
  children(): SdNode[];
  /** textContent */
  text(): string;
}

const MAX_BLOCK_CHARS = 250_000;
const MAX_ITEMS = 200;

const SCHEMA_PREFIX = /^https?:\/\/schema\.org\/?/i;

function walk(node: SdNode, visit: (n: SdNode) => boolean | void) {
  const stack: SdNode[] = [node];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.tag && visit(n) === false) continue;
    const kids = n.children();
    for (let i = kids.length - 1; i >= 0; i--) if (kids[i].tag) stack.push(kids[i]);
  }
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function absolutize(url: string, base: string | undefined): string {
  const u = url.trim();
  if (!base) return u;
  try {
    return new URL(u, base).href;
  } catch {
    return u;
  }
}

function shortType(t: string): string {
  return t.replace(SCHEMA_PREFIX, "");
}

function addValue(obj: SdItem, key: string, value: unknown) {
  if (!(key in obj)) obj[key] = value;
  else if (Array.isArray(obj[key])) (obj[key] as unknown[]).push(value);
  else obj[key] = [obj[key], value];
}

/* ------------------------------- JSON-LD ------------------------------- */

export function extractJsonLd(root: SdNode): JsonLdBlock[] {
  const out: JsonLdBlock[] = [];
  walk(root, (n) => {
    if (n.tag !== "script") return;
    const type = (n.attr("type") ?? "").toLowerCase().split(";")[0].trim();
    if (type !== "application/ld+json") return;
    const full = n.text();
    const truncated = full.length > MAX_BLOCK_CHARS;
    const raw = truncated ? full.slice(0, MAX_BLOCK_CHARS) : full;
    const parsed = parseJsonLocated(raw);
    const index = out.length;
    out.push(parsed.ok ? { index, raw, truncated, ok: true, data: parsed.value, notes: parsed.notes } : { index, raw, truncated, ok: false, error: parsed.error, notes: parsed.notes });
    return false;
  });
  return out;
}

/* ------------------------------ Microdata ------------------------------ */

function microdataValue(el: SdNode, base: string | undefined): string {
  const tag = el.tag;
  if (tag === "meta") return el.attr("content") ?? "";
  if (["audio", "embed", "iframe", "img", "source", "track", "video"].includes(tag)) return absolutize(el.attr("src") ?? "", base);
  if (["a", "area", "link"].includes(tag)) return absolutize(el.attr("href") ?? "", base);
  if (tag === "object") return absolutize(el.attr("data") ?? "", base);
  if (tag === "data" || tag === "meter") return el.attr("value") ?? clean(el.text());
  if (tag === "time") return el.attr("datetime") ?? clean(el.text());
  // Many sites put the machine value in `content` on non-meta elements (e.g. <span itemprop="price" content="9.99">). Google reads it.
  const content = el.attr("content");
  if (content !== undefined) return content;
  return clean(el.text());
}

export function extractMicrodata(root: SdNode, base?: string): { items: SdItem[]; warnings: string[] } {
  const warnings: string[] = [];
  const byId = new Map<string, SdNode>();
  const topLevel: SdNode[] = [];
  const allScopes: SdNode[] = [];
  let strayProps = 0;

  // Index ids (for itemref), find top-level items, count itemprops that have no item to belong to.
  const visit = (n: SdNode, inScope: boolean) => {
    const id = n.attr("id");
    if (id && !byId.has(id)) byId.set(id, n);
    const scope = n.attr("itemscope") !== undefined;
    const prop = n.attr("itemprop");
    if (scope) {
      allScopes.push(n);
      if (prop === undefined) topLevel.push(n);
    } else if (prop !== undefined && !inScope) strayProps++;
    for (const c of n.children()) if (c.tag) visit(c, inScope || scope);
  };
  visit(root, false);

  const referenced = new Set<SdNode>();

  const buildItem = (el: SdNode, seen: Set<SdNode>): SdItem => {
    const item: SdItem = {};
    const types = (el.attr("itemtype") ?? "").split(/\s+/).filter(Boolean).map(shortType);
    if (types.length === 1) item["@type"] = types[0];
    else if (types.length > 1) item["@type"] = types;
    const itemid = el.attr("itemid");
    if (itemid) item["@id"] = absolutize(itemid, base);

    const propsEls: SdNode[] = [];
    const crawl = (n: SdNode) => {
      for (const c of n.children()) {
        if (!c.tag) continue;
        if (c.attr("itemprop") !== undefined) propsEls.push(c);
        // Do not descend into nested items: their properties belong to them.
        if (c.attr("itemscope") === undefined) crawl(c);
      }
    };
    crawl(el);
    for (const ref of (el.attr("itemref") ?? "").split(/\s+/).filter(Boolean)) {
      const target = byId.get(ref);
      if (!target) {
        warnings.push(`itemref="${ref}" points at an id that does not exist on the page.`);
        continue;
      }
      if (target.attr("itemprop") !== undefined) propsEls.push(target);
      if (target.attr("itemscope") === undefined) crawl(target);
      else referenced.add(target);
    }

    for (const p of propsEls) {
      const names = (p.attr("itemprop") ?? "").split(/\s+/).filter(Boolean).map(shortType);
      let value: unknown;
      if (p.attr("itemscope") !== undefined) {
        if (seen.has(p)) {
          warnings.push("A microdata item references itself through itemref; the loop was cut.");
          continue;
        }
        const next = new Set(seen);
        next.add(p);
        value = buildItem(p, next);
      } else value = microdataValue(p, base);
      for (const name of names) addValue(item, name, value);
    }
    return item;
  };

  const items: SdItem[] = [];
  for (const el of topLevel) {
    if (referenced.has(el)) continue;
    if (items.length >= MAX_ITEMS) break;
    items.push(buildItem(el, new Set([el])));
  }
  if (strayProps > 0) warnings.push(`${strayProps} microdata itemprop attribute${strayProps > 1 ? "s are" : " is"} outside any itemscope, so ${strayProps > 1 ? "they are" : "it is"} ignored.`);
  return { items, warnings };
}

/* ------------------------------- RDFa Lite ------------------------------ */

type RdfaCtx = { vocab: string | null; prefixes: Record<string, string> };

function expandTerm(term: string, ctx: RdfaCtx): string {
  if (/^https?:\/\//i.test(term)) return shortType(term);
  const colon = term.indexOf(":");
  if (colon > 0) {
    const prefix = term.slice(0, colon);
    const iri = ctx.prefixes[prefix] ?? (prefix === "schema" ? "https://schema.org/" : null);
    if (iri) return shortType(iri + term.slice(colon + 1));
    return term;
  }
  if (ctx.vocab && !SCHEMA_PREFIX.test(ctx.vocab)) return ctx.vocab + term;
  return term;
}

function rdfaValue(el: SdNode, base: string | undefined): string {
  const content = el.attr("content");
  if (content !== undefined) return content;
  if (el.tag === "time" && el.attr("datetime")) return el.attr("datetime")!;
  const iri = el.attr("resource") ?? el.attr("href") ?? el.attr("src");
  if (iri !== undefined) return absolutize(iri, base);
  return clean(el.text());
}

export function extractRdfa(root: SdNode, base?: string): SdItem[] {
  const items: SdItem[] = [];

  const visit = (n: SdNode, ctx: RdfaCtx, current: SdItem | null) => {
    let next = ctx;
    const vocab = n.attr("vocab");
    const prefix = n.attr("prefix");
    if (vocab !== undefined || prefix !== undefined) {
      next = { vocab: vocab !== undefined ? vocab || null : ctx.vocab, prefixes: { ...ctx.prefixes } };
      if (prefix) {
        const parts = prefix.trim().split(/\s+/);
        for (let i = 0; i + 1 < parts.length; i += 2) next.prefixes[parts[i].replace(/:$/, "")] = parts[i + 1];
      }
    }
    const typeofAttr = n.attr("typeof");
    const property = n.attr("property");
    // Only collect when we know the vocabulary (otherwise random `property` attributes, like Open Graph meta tags, are picked up).
    const active = !!(next.vocab || Object.keys(next.prefixes).length || (property ?? "").startsWith("schema:") || (typeofAttr ?? "").startsWith("schema:"));

    let scope = current;
    if (typeofAttr !== undefined && active) {
      const item: SdItem = {};
      const types = typeofAttr.split(/\s+/).filter(Boolean).map((t) => expandTerm(t, next));
      if (types.length === 1) item["@type"] = types[0];
      else if (types.length > 1) item["@type"] = types;
      const res = n.attr("resource") ?? n.attr("about");
      if (res) item["@id"] = absolutize(res, base);
      if (property && current) for (const p of property.split(/\s+/).filter(Boolean)) addValue(current, expandTerm(p, next), item);
      else if (items.length < MAX_ITEMS) items.push(item);
      scope = item;
    } else if (property && current && active) {
      const value = rdfaValue(n, base);
      for (const p of property.split(/\s+/).filter(Boolean)) addValue(current, expandTerm(p, next), value);
    }
    for (const c of n.children()) if (c.tag) visit(c, next, scope);
  };

  visit(root, { vocab: null, prefixes: {} }, null);
  return items.filter((i) => Object.keys(i).length > 0);
}

/* ------------------------------- All of it ------------------------------ */

export function extractStructuredData(root: SdNode, base?: string): StructuredData {
  const jsonLd = extractJsonLd(root);
  const micro = extractMicrodata(root, base);
  const rdfa = extractRdfa(root, base);
  return { jsonLd, microdata: micro.items, rdfa, warnings: micro.warnings };
}

/* ---------------------------- Browser adapter --------------------------- */

/** Wraps a browser DOM node (from DOMParser) as an SdNode. Client-only. */
export function domNode(node: Node): SdNode {
  const isEl = node.nodeType === 1;
  const el = node as Element;
  return {
    tag: isEl ? el.tagName.toLowerCase() : "",
    attr: (name) => (isEl ? (el.getAttribute(name) ?? undefined) : undefined),
    children: () => Array.from(node.childNodes).filter((c) => c.nodeType === 1 || c.nodeType === 3).map(domNode),
    text: () => node.textContent ?? "",
  };
}

/**
 * For the validator's paste mode: accepts either raw JSON(-LD) or an HTML snippet / full page.
 * Runs entirely in the browser.
 */
export function extractFromPastedCode(code: string, base?: string): StructuredData {
  const trimmed = code.trim();
  if (!trimmed) return { jsonLd: [], microdata: [], rdfa: [], warnings: [] };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = parseJsonLocated(trimmed);
    const block: JsonLdBlock = parsed.ok
      ? { index: 0, raw: trimmed, truncated: false, ok: true, data: parsed.value, notes: parsed.notes }
      : { index: 0, raw: trimmed, truncated: false, ok: false, error: parsed.error, notes: parsed.notes };
    return { jsonLd: [block], microdata: [], rdfa: [], warnings: [] };
  }
  const doc = new DOMParser().parseFromString(code, "text/html");
  return extractStructuredData(domNode(doc.documentElement), base);
}
