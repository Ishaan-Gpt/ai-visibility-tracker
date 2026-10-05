export type HistoryTool = "page-audit" | "ai-crawlers";

export const HISTORY_TOOLS: HistoryTool[] = ["page-audit", "ai-crawlers"];

/** Saved reports per account. Full history is the Pro feature. */
export const HISTORY_LIMITS = { free: 10, pro: 1000 } as const;

export const HISTORY_TOOL_META: Record<HistoryTool, { label: string; slug: string }> = {
  "page-audit": { label: "Page Audit", slug: "page-audit" },
  "ai-crawlers": { label: "AI Crawler Check", slug: "ai-crawler-check" },
};

export interface HistoryItem {
  id: string;
  tool: HistoryTool;
  title: string;
  subtitle: string;
  score: number | null;
  aiScore: number | null;
  createdAt: number;
}
