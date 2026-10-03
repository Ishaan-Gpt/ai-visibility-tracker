export type Intent = "informational" | "commercial" | "transactional" | "navigational";

export type KeywordSource = "seed" | "autocomplete" | "question" | "dataforseo";

export interface KeywordRow {
  keyword: string;
  source: KeywordSource;
  /** Heuristic estimate from the wording of the query, not from SERP analysis. */
  intent: Intent;
  cluster: string;
  words: number;
  /** Present only when a data provider (DataForSEO) is connected. Never fabricated. */
  volume?: number | null;
  cpc?: number | null;
  /** Provider competition index 0-100 (paid-ads competition). */
  competition?: number | null;
  /** Keyword difficulty 0-100 from the provider. */
  kd?: number | null;
}

export interface ResearchRequest {
  seed: string;
  /** ISO-3166 country code for suggestions + provider location, e.g. "us", "in". */
  country: string;
  language: string;
}

export interface ResearchResponse {
  seed: string;
  country: string;
  language: string;
  keywords: KeywordRow[];
  provider: {
    volume: boolean;
    name: string | null;
    /** Set when the provider is configured but the call failed, so the UI can say why. */
    error?: string;
  };
  stats: { suggestRequests: number; elapsedMs: number };
}

export const COUNTRIES: { code: string; name: string; dataforseoLocation: number }[] = [
  { code: "us", name: "United States", dataforseoLocation: 2840 },
  { code: "gb", name: "United Kingdom", dataforseoLocation: 2826 },
  { code: "in", name: "India", dataforseoLocation: 2356 },
  { code: "ca", name: "Canada", dataforseoLocation: 2124 },
  { code: "au", name: "Australia", dataforseoLocation: 2036 },
  { code: "ae", name: "United Arab Emirates", dataforseoLocation: 2784 },
  { code: "de", name: "Germany", dataforseoLocation: 2276 },
  { code: "sg", name: "Singapore", dataforseoLocation: 2702 },
];
