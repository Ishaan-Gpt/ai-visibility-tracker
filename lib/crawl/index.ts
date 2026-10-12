/**
 * Public entry point of the crawler library (server only).
 *
 *   import { crawlSite } from "@/lib/crawl";
 *   const result = await crawlSite(
 *     { url: "example.com", maxPages: CRAWL_PAGE_LIMITS[viewer.tier], timeBudgetMs: 50_000, signal: req.signal },
 *     { onProgress, onPage, onSitemapUrls },
 *   );
 */
import "server-only";

export { crawlSite } from "@/lib/crawl/crawler";
export { checkSitemap } from "@/lib/crawl/check";
export { loadRobots, allowedFor, BOT_TOKEN } from "@/lib/crawl/robots";
export { loadSitemaps } from "@/lib/crawl/sitemaps";
export { ndjsonResponse } from "@/lib/crawl/stream";
export * from "@/lib/crawl/types";
export { normalizeCrawlUrl, inScope, siteKey, isAssetUrl, trapReason } from "@/lib/crawl/url";
