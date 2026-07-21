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
}
