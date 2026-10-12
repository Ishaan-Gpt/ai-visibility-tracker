export type QuotaTool = "page-audit" | "ai-crawlers" | "keywords" | "fetch-page" | "crawl" | "visibility";
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
};

/** Pages a single crawl may discover, by tier. */
export const CRAWL_PAGE_LIMITS: Record<Tier, number> = { anon: 150, free: 500, pro: 2500 };

export const QUOTA_LABELS: Record<QuotaTool, string> = {
  "page-audit": "Page audits",
  "ai-crawlers": "AI crawler checks",
  keywords: "Keyword research",
  "fetch-page": "URL imports",
  crawl: "Site crawls",
  visibility: "AI visibility checks",
};
