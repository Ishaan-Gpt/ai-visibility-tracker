import { CRAWL_PAGE_LIMITS, DAILY_LIMITS } from "@/lib/limits";
import { HISTORY_LIMITS } from "@/lib/history";
import { PLAN_LIMITS } from "@/lib/types";

/** Free vs Pro comparison, derived from the limits the API actually enforces. */
export function planRows() {
  return [
    { label: "Page audits / day", free: String(DAILY_LIMITS["page-audit"].free), pro: String(DAILY_LIMITS["page-audit"].pro) },
    { label: "AI crawler checks / day", free: String(DAILY_LIMITS["ai-crawlers"].free), pro: String(DAILY_LIMITS["ai-crawlers"].pro) },
    { label: "Keyword research / day", free: String(DAILY_LIMITS.keywords.free), pro: String(DAILY_LIMITS.keywords.pro) },
    { label: "Site crawls / day", free: String(DAILY_LIMITS.crawl.free), pro: String(DAILY_LIMITS.crawl.pro) },
    { label: "Pages per crawl", free: String(CRAWL_PAGE_LIMITS.free), pro: CRAWL_PAGE_LIMITS.pro.toLocaleString("en-US") },
    { label: "URL imports / day", free: String(DAILY_LIMITS["fetch-page"].free), pro: String(DAILY_LIMITS["fetch-page"].pro) },
    { label: "Saved reports", free: String(HISTORY_LIMITS.free), pro: "All" },
    { label: "AI Visibility prompts", free: String(PLAN_LIMITS.free.maxPrompts), pro: String(PLAN_LIMITS.paid.maxPrompts) },
    { label: "AI Visibility checks", free: "Weekly", pro: "Daily" },
    { label: "On-demand visibility runs / day", free: String(DAILY_LIMITS.visibility.free), pro: String(DAILY_LIMITS.visibility.pro) },
    { label: "Browser tools + PDF", free: "∞", pro: "∞" },
  ];
}
