import type { Competitor, Provider } from "@/lib/types";

export interface CheckPromptInput {
  promptText: string;
  brandName: string;
  brandDomain: string;
  competitors: Competitor[];
}

export interface CheckPromptResult {
  provider: Provider;
  mentioned: boolean;
  citedUrls: string[];
  /** Keyed by competitor domain. */
  competitorMentions: Record<string, boolean>;
  rawExcerpt: string;
  /** False when this ran without live web grounding (e.g. billing not yet linked) —
   * reflects the model's training-data knowledge only, not current AI search results. */
  grounded: boolean;
}
