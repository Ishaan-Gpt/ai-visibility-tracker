export type ChangeFreq = "" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: string;
}

export function createEmptyEntry(): SitemapUrlEntry {
  return { loc: "", lastmod: "", changefreq: "", priority: "" };
}

/** Google's documented per-sitemap-file limits (sitemaps.org protocol + Search Central guidance). */
export const SITEMAP_LIMITS = {
  maxUrlsPerFile: 50000,
  maxBytesPerFile: 50 * 1024 * 1024, // 50MB uncompressed
};
