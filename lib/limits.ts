export type QuotaTool = "page-audit" | "ai-crawlers" | "keywords" | "fetch-page" | "crawl" | "visibility" | "rank-check" | "domain-keywords";
export type Tier = "anon" | "free" | "pro";

/** Daily runs per tool. Anonymous = per IP. Browser-only tools are unlimited and never metered. */
export const DAILY_LIMITS: Record<QuotaTool, Record<Tier, number>> = {
  "page-audit": { anon: 5, free: 25, pro: 300 },
  "ai-crawlers": { anon: 10, free: 40, pro: 300 },
  keywords: { anon: 2, free: 6, pro: 60 },
  /** "Load from URL" in the browser tools (meta preview, schema validator, keyword density). */
  "fetch-page": { anon: 20, free: 100, pro: 1000 },
  /** Site crawls that feed the XML / HTML sitemap generators. */
  crawl: { anon: 2, free: 10, pro: 60 },
  /** On-demand AI visibility checks (the scheduled check is not metered). Accounts only. */
  visibility: { anon: 0, free: 2, pro: 20 },
  /** On-demand Rank Tracker checks (one per project refresh; scheduled checks are not metered). Accounts only. */
  "rank-check": { anon: 0, free: 1, pro: 10 },
  /** Domain keyword lookups (DataForSEO Labs, paid per row). Cached lookups are free. Accounts only. */
  "domain-keywords": { anon: 0, free: 2, pro: 10 },
};

/**
 * Rank Tracker plan limits. Each check of one keyword is one DataForSEO Standard-queue SERP task: at most
 * 10 pages ($0.006) for the top 100, usually less because crawling stops once your domain is found.
 */
export const RANK_LIMITS: Record<Exclude<Tier, "anon">, { keywords: number; projects: number; competitors: number; cadenceDays: number }> = {
  free: { keywords: 10, projects: 1, competitors: 1, cadenceDays: 7 },
  pro: { keywords: 200, projects: 5, competitors: 3, cadenceDays: 1 },
};

/** Rows returned per Domain keywords lookup ($0.012 + $0.00012 per row). */
export const DOMAIN_ROWS: Record<Tier, number> = { anon: 0, free: 100, pro: 500 };

/**
 * Keywords per research that get paid provider data (DataForSEO volume / difficulty / CPC), by tier. Each research
 * costs real money per keyword, so anonymous visitors get none and the strongest ideas are enriched first.
 */
export const PROVIDER_KEYWORDS: Record<Tier, number> = { anon: 0, free: 50, pro: 500 };

/** Pages a single crawl may discover, by tier. */
export const CRAWL_PAGE_LIMITS: Record<Tier, number> = { anon: 150, free: 500, pro: 2500 };

export const QUOTA_LABELS: Record<QuotaTool, string> = {
  "page-audit": "Page audits",
  "ai-crawlers": "AI crawler checks",
  keywords: "Keyword research",
  "fetch-page": "URL imports",
  crawl: "Site crawls",
  visibility: "AI visibility checks",
  "rank-check": "Rank checks",
  "domain-keywords": "Domain lookups",
};
