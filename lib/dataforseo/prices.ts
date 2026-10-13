/*
 * DataForSEO list prices (USD), verified 2026-10-13 against:
 *  - https://dataforseo.com/pricing/google-serp/google-organic-serp-api
 *      Standard queue $0.0006 / SERP, Priority $0.0012, Live $0.002. A "SERP" is one page of up to 10 results;
 *      depth is billed per page, rounded up to the next ten (depth 100 = 10 SERPs). Regular, advanced and HTML
 *      results cost the same. `stop_crawl_on_match` bills only the pages actually crawled. Getting results is free.
 *  - https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api
 *      Labs live endpoints (ranked_keywords, domain_rank_overview, bulk_keyword_difficulty): $0.012 / task
 *      + $0.00012 / returned item.
 *  - https://dataforseo.com/pricing/keywords-data/google-ads
 *      Google Ads endpoints (search_volume): Live $0.09 / task (up to 1000 keywords), Standard $0.06 / task.
 * A live check on 2026-10-13 matched these: SERP live advanced, depth 20 = $0.004 (2 x $0.002);
 * ranked_keywords limit 20 = $0.0144 ($0.012 + 20 x $0.00012).
 *
 * These are only used to ESTIMATE before a call (for the spend guard). After a call, the `cost` DataForSEO
 * returns is what gets recorded.
 */

export const DFS_PRICES = {
  serpStandardPerPage: 0.0006,
  serpPriorityPerPage: 0.0012,
  serpLivePerPage: 0.002,
  labsPerTask: 0.012,
  labsPerItem: 0.00012,
  adsLivePerTask: 0.09,
} as const;

/** Pages billed for a SERP depth (10 results per page, rounded up). */
export const serpPages = (depth: number) => Math.max(1, Math.ceil(depth / 10));

/** Worst-case price of one Standard-queue SERP task at `depth` (with stop_crawl_on_match it is often less). */
export const serpTaskMaxCost = (depth: number) => serpPages(depth) * DFS_PRICES.serpStandardPerPage;

export const labsCost = (items: number) => DFS_PRICES.labsPerTask + items * DFS_PRICES.labsPerItem;
