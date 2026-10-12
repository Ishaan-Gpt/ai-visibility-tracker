import type { CrawlPage } from "@/lib/crawl/types";
import type { ChangeFreq, SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";

export interface XmlFromCrawlOptions {
  lastmod: boolean;
  /** Suggest priority from click depth. Off by default: Google ignores priority. */
  priority: boolean;
  /** One changefreq for every URL, or "" to omit. Google ignores changefreq too. */
  changefreq: ChangeFreq;
  images: boolean;
  hreflang: boolean;
}

export const DEFAULT_XML_OPTIONS: XmlFromCrawlOptions = { lastmod: true, priority: false, changefreq: "", images: false, hreflang: false };

/** Home 1.0, one click 0.8, two 0.6, three 0.5, deeper (or only in the sitemap) 0.4. */
export function priorityForDepth(depth: number | null): string {
  if (depth === null) return "0.4";
  if (depth <= 0) return "1.0";
  if (depth === 1) return "0.8";
  if (depth === 2) return "0.6";
  if (depth === 3) return "0.5";
  return "0.4";
}

export function crawlToEntries(pages: CrawlPage[], opts: XmlFromCrawlOptions): SitemapUrlEntry[] {
  return [...pages]
    .sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || a.url.localeCompare(b.url))
    .map((p) => {
      const e: SitemapUrlEntry = {
        loc: p.url,
        lastmod: opts.lastmod ? (p.lastmod ?? "") : "",
        changefreq: opts.changefreq,
        priority: opts.priority ? priorityForDepth(p.depth) : "",
      };
      if (opts.images && p.images?.length) e.images = p.images;
      if (opts.hreflang && p.hreflang?.length) {
        // Google requires each URL to list every alternate, itself included.
        const alts = p.hreflang.map((h) => ({ hreflang: h.lang, href: h.href }));
        e.alternates = alts;
      }
      return e;
    });
}
