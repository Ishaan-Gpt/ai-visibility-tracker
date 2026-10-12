import type { Provider, RunDoc } from "@/lib/types";

export function timeAgo(ts: number | null | undefined, now = Date.now()): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function timeUntil(ts: number, now = Date.now()): string {
  const s = Math.round((ts - now) / 1000);
  if (s <= 0) return "within the hour";
  const h = Math.round(s / 3600);
  if (h < 1) return "within the hour";
  if (h < 36) return `in ${h} h`;
  const d = Math.round(h / 24);
  return `in ${d} day${d === 1 ? "" : "s"}`;
}

export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** The newest run is first in `runs` (sorted by timestamp desc). */
export type SlimRun = Pick<RunDoc, "provider" | "timestamp" | "mentioned" | "position" | "cited" | "grounded">;

export type FullRun = Pick<
  RunDoc,
  | "id"
  | "provider"
  | "model"
  | "timestamp"
  | "mentioned"
  | "position"
  | "cited"
  | "citations"
  | "citedUrls"
  | "sentiment"
  | "sentimentReason"
  | "rawExcerpt"
  | "mentionSpans"
  | "grounded"
  | "brandOrder"
  | "competitorMentions"
>;

export interface PromptView {
  id: string;
  text: string;
  active: boolean;
  latest: Partial<Record<Provider, FullRun>>;
  history: SlimRun[];
}

export interface EngineView {
  id: Provider;
  label: string;
  detail: string;
  active: boolean;
  envVar: string;
}
