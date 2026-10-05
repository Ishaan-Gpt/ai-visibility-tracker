export type QuotaTool = "page-audit" | "ai-crawlers" | "keywords";
export type Tier = "anon" | "free" | "pro";

/** Daily runs per tool. Anonymous = per IP. Browser-only tools are unlimited and never metered. */
export const DAILY_LIMITS: Record<QuotaTool, Record<Tier, number>> = {
  "page-audit": { anon: 5, free: 25, pro: 300 },
  "ai-crawlers": { anon: 10, free: 40, pro: 300 },
  keywords: { anon: 2, free: 6, pro: 60 },
};
