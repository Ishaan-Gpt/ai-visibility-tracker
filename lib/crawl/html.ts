import "server-only";
import * as cheerio from "cheerio";
import type { Hreflang } from "@/lib/crawl/types";

export interface PageFacts {
  title?: string;
  h1?: string;
  /** Lower-cased content of meta robots / googlebot. */
  metaRobots: string;
  canonical?: string;
  /** Absolute URLs (unnormalised) of followable links, de-duplicated. */
  links: string[];
  /** Every link on the page with its anchor text (capped at 1,000), including nofollow ones. */
  anchors: { href: string; text: string; nofollow: boolean }[];
  nofollowPage: boolean;
  images: string[];
  hreflang: Hreflang[];
  modified?: string;
  refresh?: string;
}

const clean = (s: string | undefined, max = 200) => {
  const v = (s ?? "").replace(/\s+/g, " ").trim();
  return v ? v.slice(0, max) : undefined;
};

function abs(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href.trim(), base).href;
  } catch {
    return undefined;
  }
}

/** Extracts what the sitemap needs from one HTML page. Uses htmlparser2 mode (about 4x faster than parse5). */
export function extractPage(html: string, pageUrl: string): PageFacts {
  const $ = cheerio.load(html, { xml: { xmlMode: false, decodeEntities: true } });
  const base = abs($("base[href]").first().attr("href"), pageUrl) ?? pageUrl;

  const metaRobots = $('meta[name="robots" i], meta[name="googlebot" i]')
    .map((_, el) => ($(el).attr("content") ?? "").toLowerCase())
    .get()
    .join(",");
  const nofollowPage = /(^|[\s,])(nofollow|none)([\s,]|$)/.test(metaRobots);

  const links = new Set<string>();
  const anchors: PageFacts["anchors"] = [];
  $("a[href], area[href]").each((_, el) => {
    const $el = $(el);
    const href = ($el.attr("href") ?? "").trim();
    if (!href || href.startsWith("#")) return;
    const a = abs(href, base);
    if (!a) return;
    const nofollow = nofollowPage || /\bnofollow\b/i.test($el.attr("rel") ?? "");
    if (anchors.length < 1000) {
      const text = clean($el.text(), 160) ?? clean($el.attr("aria-label"), 160) ?? clean($el.find("img[alt]").first().attr("alt"), 160) ?? "";
      anchors.push({ href: a, text, nofollow });
    }
    if (!nofollow && $el.attr("download") === undefined) links.add(a);
  });

  const images = new Set<string>();
  $("img").each((_, el) => {
    if (images.size >= 20) return false;
    const $el = $(el);
    const src = $el.attr("src")?.trim();
    const lazy = $el.attr("data-src") ?? $el.attr("data-lazy-src") ?? $el.attr("data-original");
    const cand = src && !src.startsWith("data:") ? src : lazy;
    if (!cand || cand.startsWith("data:")) return;
    // Skip tracking pixels and spacer gifs.
    const w = Number($el.attr("width"));
    const h = Number($el.attr("height"));
    if ((w > 0 && w <= 2) || (h > 0 && h <= 2)) return;
    const a = abs(cand, base);
    if (a && /^https?:/.test(a)) images.add(a);
  });

  const hreflang: Hreflang[] = [];
  $('link[rel="alternate" i][hreflang]').each((_, el) => {
    if (hreflang.length >= 50) return false;
    const lang = ($(el).attr("hreflang") ?? "").trim();
    const href = abs($(el).attr("href"), base);
    if (lang && href) hreflang.push({ lang, href });
  });

  const modifiedRaw =
    $('meta[property="article:modified_time"]').attr("content") ??
    $('meta[property="og:updated_time"]').attr("content") ??
    $('meta[itemprop="dateModified"]').attr("content") ??
    $('meta[name="last-modified" i]').attr("content") ??
    html.match(/"dateModified"\s*:\s*"([^"]{8,40})"/)?.[1];

  let refresh: string | undefined;
  const refreshContent = $('meta[http-equiv="refresh" i]').attr("content");
  if (refreshContent) {
    const m = refreshContent.match(/^\s*(\d+)\s*[;,]\s*url\s*=\s*['"]?([^'"]+)/i);
    if (m && Number(m[1]) <= 5) refresh = abs(m[2], base);
  }

  return {
    title: clean($("title").first().text()),
    h1: clean($("h1").first().text()),
    metaRobots,
    canonical: abs($('link[rel="canonical" i]').first().attr("href"), base),
    links: [...links],
    anchors,
    nofollowPage,
    images: [...images],
    hreflang,
    modified: modifiedRaw,
    refresh,
  };
}

/** X-Robots-Tag can carry a user-agent prefix ("googlebot: noindex"). Only generic and Googlebot directives count. */
export function headerNoindex(xRobots: string | undefined): boolean {
  if (!xRobots) return false;
  return xRobots
    .toLowerCase()
    .split(/,(?![^:,]*:)/)
    .some((part) => {
      const m = part.match(/^\s*([a-z0-9_-]+)\s*:\s*(.+)$/);
      const directives = m && !/^(noindex|none|unavailable_after|max-|noarchive|nosnippet|notranslate|noimageindex|index|follow|nofollow|all)/.test(m[1]) ? (m[1] === "googlebot" ? m[2] : "") : part;
      return /(^|[\s,])(noindex|none)([\s,]|$)/.test(directives);
    });
}

export function metaNoindex(metaRobots: string): boolean {
  return /(^|[\s,])(noindex|none)([\s,]|$)/.test(metaRobots);
}

/** Canonical from a `Link: <url>; rel="canonical"` response header. */
export function headerCanonical(link: string | undefined, base: string): string | undefined {
  if (!link) return undefined;
  for (const part of link.split(/,(?=\s*<)/)) {
    const m = part.match(/<([^>]+)>\s*;(.*)$/);
    if (m && /rel\s*=\s*"?canonical"?/i.test(m[2])) return abs(m[1], base);
  }
  return undefined;
}

export function looksSoft404(title?: string, h1?: string): boolean {
  const t = `${title ?? ""} | ${h1 ?? ""}`.toLowerCase();
  return /\b(404|page not found|not found|page doesn.t exist|page does not exist|no longer available|nothing (was )?found)\b/.test(t);
}
