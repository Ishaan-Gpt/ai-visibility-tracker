import type { CrawlPage } from "@/lib/crawl/types";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";

export interface HtmlFromCrawlOptions {
  /** How many leading path folders form a section: 1 = /blog/*, 2 = /blog/news/*. */
  depth: 1 | 2;
  label: "title" | "h1" | "url";
  /** Remove the repeated " | Brand" part shared by most titles. */
  stripSiteName: boolean;
  /** Sections smaller than this are merged into "Pages". */
  minSection: number;
}

export const DEFAULT_HTML_OPTIONS: HtmlFromCrawlOptions = { depth: 1, label: "title", stripSiteName: true, minSection: 2 };

const SEP = /\s+[|\-–—·:•»]\s+/;

const SEP_G = /\s+[|\-–—·:•»]\s+/g;

export interface SiteAffix {
  /** Clean brand text, e.g. "Next.js" (for the page heading). */
  suffix?: string;
  prefix?: string;
  /** Every repeated title tail to strip, separator included, e.g. " | Next.js by Vercel - The React Framework". */
  tails: string[];
}

/** Finds title tails (or a prefix) repeated across many pages: "Post title | Brand", "Docs | Brand - Tagline". */
export function detectSiteNameAffix(titles: string[]): SiteAffix {
  if (titles.length < 3) return { tails: [] };
  const threshold = Math.max(3, titles.length * 0.08);
  const tailCount = new Map<string, number>();
  const preCount = new Map<string, number>();
  for (const t of titles) {
    const seen = new Set<string>();
    for (const m of t.matchAll(SEP_G)) {
      const tail = t.slice(m.index ?? 0);
      if (!seen.has(tail)) {
        seen.add(tail);
        tailCount.set(tail, (tailCount.get(tail) ?? 0) + 1);
      }
    }
    const first = t.split(SEP)[0];
    if (first !== t) preCount.set(first.trim(), (preCount.get(first.trim()) ?? 0) + 1);
  }
  const tails = [...tailCount.entries()].filter(([, n]) => n >= threshold).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  if (tails.length) {
    const brand = tails[0][0].replace(SEP, "").split(SEP)[0].trim();
    // Less common variants of the same brand tail ("| Brand by X - Tagline") go too.
    const variants = [...tailCount.entries()].filter(([k, n]) => n >= 2 && k.replace(SEP, "").startsWith(brand)).map(([k]) => k);
    return { suffix: brand, tails: [...new Set([...tails.map(([k]) => k), ...variants])] };
  }
  const pre = [...preCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (pre && pre[1] >= Math.max(3, titles.length * 0.4)) return { prefix: pre[0], tails: [] };
  return { tails: [] };
}

function stripAffix(title: string, affix: SiteAffix): string {
  // Longest matching tail first, so "| Brand - Tagline" wins over "- Tagline".
  const tail = [...affix.tails].sort((a, b) => b.length - a.length).find((t) => title.endsWith(t) && title.length > t.length);
  if (tail) return title.slice(0, -tail.length).trim();
  if (affix.prefix && title.startsWith(affix.prefix)) {
    const rest = title.slice(affix.prefix.length).replace(/^\s*[|\-–—·:•»]\s+/, "").trim();
    if (rest) return rest;
  }
  return title;
}

const titleCase = (seg: string) =>
  decodeURIComponent(seg)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

function slugLabel(url: string): string {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    return segs.length ? titleCase(segs[segs.length - 1]) : "Home";
  } catch {
    return url;
  }
}

export function sectionKey(url: string, depth: 1 | 2): string | null {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    if (segs.length <= 1) return null; // top-level pages live in "Pages"
    return segs.slice(0, Math.min(depth, segs.length - 1)).map(titleCase).join(" / ");
  } catch {
    return null;
  }
}

/** Builds HTML sitemap rows from real crawled pages: sections from the URL folders, link text from page titles. */
export function crawlToHtmlEntries(pages: CrawlPage[], opts: HtmlFromCrawlOptions): HtmlSitemapEntry[] {
  const affix: SiteAffix = opts.stripSiteName ? detectSiteNameAffix(pages.map((p) => p.title ?? "").filter(Boolean)) : { tails: [] };
  const rows = pages.map((p) => {
    const raw = opts.label === "title" ? (p.title ?? p.h1) : opts.label === "h1" ? (p.h1 ?? p.title) : undefined;
    let label = raw ? stripAffix(raw, affix) : "";
    if (!label) label = slugLabel(p.url);
    return { url: p.url, label, section: sectionKey(p.url, opts.depth) ?? "Pages" };
  });
  const sizes = new Map<string, number>();
  for (const r of rows) sizes.set(r.section, (sizes.get(r.section) ?? 0) + 1);
  return rows.map((r) => (r.section !== "Pages" && (sizes.get(r.section) ?? 0) < opts.minSection ? { ...r, section: "Pages" } : r));
}
