/* Shared (client + server) types and market tables for keyword research. No server-only imports here. */

export type Intent = "informational" | "commercial" | "transactional" | "navigational";

/** Public autocomplete endpoints we query. Each was verified to respond before being added. */
export type SuggestSource = "google" | "youtube" | "bing" | "duckduckgo" | "amazon" | "ebay";

export const SOURCES: { id: SuggestSource; name: string; short: string; hint: string }[] = [
  { id: "google", name: "Google", short: "G", hint: "Google web search autocomplete" },
  { id: "bing", name: "Bing", short: "B", hint: "Bing autocomplete (also powers Yahoo and partly DuckDuckGo)" },
  { id: "youtube", name: "YouTube", short: "Y", hint: "YouTube search autocomplete: video and how-to demand" },
  { id: "duckduckgo", name: "DuckDuckGo", short: "D", hint: "DuckDuckGo autocomplete" },
  { id: "amazon", name: "Amazon", short: "A", hint: "Amazon product search autocomplete: buyer demand" },
  { id: "ebay", name: "eBay", short: "E", hint: "eBay product search autocomplete" },
];

export const DEFAULT_SOURCES: SuggestSource[] = ["google", "bing", "youtube"];

/** AnswerThePublic-style grouping from the wording of the keyword. */
export type GroupType = "question" | "comparison" | "preposition" | "other";

export interface KeywordRow {
  keyword: string;
  /** Autocomplete sources that returned this exact phrase. Empty only for a seed no source echoed back. */
  sources: SuggestSource[];
  /** Best (lowest) position the phrase reached in any autocomplete list, 1 = first suggestion. */
  rank: number | null;
  /** How many separate autocomplete lists contained the phrase. */
  hits: number;
  /**
   * 0-100 relative autocomplete prominence inside THIS result set (position, repetition and source agreement).
   * It is a ranking signal derived from real suggestion data, not a search volume.
   */
  signal: number;
  /** 0 = the seed, 1 = suggestion for a seed-based query, 2 = suggestion found by expanding a suggestion. */
  depth: 0 | 1 | 2;
  intent: Intent;
  /** "rules" = wording heuristic, "ai" = AI-estimated. Both are estimates. */
  intentBy: "rules" | "ai";
  /** Topic cluster name. */
  cluster: string;
  group: GroupType;
  /** The word that put it in its group, e.g. "how", "for", "vs". */
  groupWord: string | null;
  words: number;
  /** Present only when a data provider (DataForSEO) is connected. Never fabricated. */
  volume?: number | null;
  cpc?: number | null;
  /** Provider paid-ads competition index 0-100. */
  competition?: number | null;
  /** Keyword difficulty 0-100 from the provider. */
  kd?: number | null;
  /** Monthly search volumes from the provider, oldest first (up to 12). */
  trend?: number[] | null;
}

export interface ClusterInfo {
  name: string;
  /** "ai" when the name was suggested by AI; the grouping itself is always rule based. */
  nameBy: "rules" | "ai";
  size: number;
  /** The shared head term that defines the cluster ("" for the core seed cluster and the long tail). */
  term: string;
  kind: "core" | "topic" | "longtail";
  /** Up to 8 member keywords, strongest signal first. */
  top: string[];
  /** Frequent secondary terms inside the cluster, with counts. */
  subterms: { term: string; count: number }[];
}

export interface SourceStats {
  requests: number;
  ok: number;
  failed: number;
  /** Unique keywords this source contributed (after normalisation and relevance filtering). */
  keywords: number;
  ms: number;
  /** Set when the source stopped early (throttled, blocked) so the UI can say so. */
  error?: string;
  /** Marketplace actually used when it differs from the selected country (Amazon/eBay). */
  market?: string;
}

export interface ResearchRequest {
  seed: string;
  /** ISO-3166 alpha-2 (lowercase) country code, e.g. "us", "in". */
  country: string;
  language: string;
  sources?: SuggestSource[];
  /** Skip the cache and run fresh (costs a run). */
  fresh?: boolean;
}

export interface ResearchResponse {
  seed: string;
  country: string;
  language: string;
  sources: SuggestSource[];
  keywords: KeywordRow[];
  clusters: ClusterInfo[];
  provider: {
    volume: boolean;
    name: string | null;
    /** Set when the provider is configured but a call failed (fully or partly), so the UI can say why. */
    error?: string;
  };
  ai: { used: boolean; error?: string };
  stats: {
    suggestRequests: number;
    elapsedMs: number;
    perSource: Partial<Record<SuggestSource, SourceStats>>;
    /** True when the time budget ended expansion early. */
    budgetHit: boolean;
    secondLevel: number;
  };
  /** Present when the response came from the cache. */
  cachedAt?: number;
  notes: string[];
}

export interface Language {
  code: string;
  name: string;
  /** DataForSEO language_code. */
  dfs: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", dfs: "en" },
  { code: "es", name: "Spanish", dfs: "es" },
  { code: "fr", name: "French", dfs: "fr" },
  { code: "de", name: "German", dfs: "de" },
  { code: "it", name: "Italian", dfs: "it" },
  { code: "pt", name: "Portuguese", dfs: "pt" },
  { code: "nl", name: "Dutch", dfs: "nl" },
  { code: "sv", name: "Swedish", dfs: "sv" },
  { code: "no", name: "Norwegian", dfs: "no" },
  { code: "da", name: "Danish", dfs: "da" },
  { code: "fi", name: "Finnish", dfs: "fi" },
  { code: "pl", name: "Polish", dfs: "pl" },
  { code: "cs", name: "Czech", dfs: "cs" },
  { code: "el", name: "Greek", dfs: "el" },
  { code: "ro", name: "Romanian", dfs: "ro" },
  { code: "hu", name: "Hungarian", dfs: "hu" },
  { code: "tr", name: "Turkish", dfs: "tr" },
  { code: "ar", name: "Arabic", dfs: "ar" },
  { code: "he", name: "Hebrew", dfs: "he" },
  { code: "hi", name: "Hindi", dfs: "hi" },
  { code: "bn", name: "Bengali", dfs: "bn" },
  { code: "ur", name: "Urdu", dfs: "ur" },
  { code: "id", name: "Indonesian", dfs: "id" },
  { code: "ms", name: "Malay", dfs: "ms" },
  { code: "th", name: "Thai", dfs: "th" },
  { code: "vi", name: "Vietnamese", dfs: "vi" },
  { code: "tl", name: "Filipino", dfs: "tl" },
  { code: "ja", name: "Japanese", dfs: "ja" },
  { code: "ko", name: "Korean", dfs: "ko" },
  { code: "zh-TW", name: "Chinese (Traditional)", dfs: "zh-TW" },
];

export interface Country {
  code: string;
  name: string;
  /** DataForSEO / Google Ads country location code (2000 + ISO-3166 numeric). */
  dataforseoLocation: number;
  /** Default language when the country is picked. */
  lang: string;
  /** DuckDuckGo region (kl). */
  ddg: string;
}

const c = (code: string, name: string, iso: number, lang: string, ddg?: string): Country => ({
  code,
  name,
  dataforseoLocation: 2000 + iso,
  lang,
  ddg: ddg ?? `${code}-${lang.slice(0, 2)}`,
});

/** Google Ads geo-target IDs for countries are 2000 + the ISO-3166 numeric code (e.g. US 840 -> 2840). */
export const COUNTRIES: Country[] = [
  c("us", "United States", 840, "en"),
  c("gb", "United Kingdom", 826, "en", "uk-en"),
  c("in", "India", 356, "en"),
  c("ca", "Canada", 124, "en"),
  c("au", "Australia", 36, "en"),
  c("nz", "New Zealand", 554, "en"),
  c("ie", "Ireland", 372, "en"),
  c("sg", "Singapore", 702, "en"),
  c("ae", "United Arab Emirates", 784, "en", "xa-en"),
  c("za", "South Africa", 710, "en"),
  c("ng", "Nigeria", 566, "en", "wt-wt"),
  c("ke", "Kenya", 404, "en", "wt-wt"),
  c("pk", "Pakistan", 586, "en"),
  c("bd", "Bangladesh", 50, "en", "wt-wt"),
  c("ph", "Philippines", 608, "en"),
  c("my", "Malaysia", 458, "en"),
  c("id", "Indonesia", 360, "id", "id-en"),
  c("th", "Thailand", 764, "th"),
  c("vn", "Vietnam", 704, "vi"),
  c("jp", "Japan", 392, "ja", "jp-jp"),
  c("kr", "South Korea", 410, "ko", "kr-kr"),
  c("tw", "Taiwan", 158, "zh-TW", "tw-tzh"),
  c("hk", "Hong Kong", 344, "zh-TW", "hk-tzh"),
  c("de", "Germany", 276, "de"),
  c("at", "Austria", 40, "de"),
  c("ch", "Switzerland", 756, "de"),
  c("fr", "France", 250, "fr"),
  c("be", "Belgium", 56, "nl"),
  c("nl", "Netherlands", 528, "nl"),
  c("es", "Spain", 724, "es"),
  c("pt", "Portugal", 620, "pt"),
  c("it", "Italy", 380, "it"),
  c("se", "Sweden", 752, "sv"),
  c("no", "Norway", 578, "no"),
  c("dk", "Denmark", 208, "da"),
  c("fi", "Finland", 246, "fi"),
  c("pl", "Poland", 616, "pl"),
  c("cz", "Czechia", 203, "cs"),
  c("gr", "Greece", 300, "el"),
  c("ro", "Romania", 642, "ro"),
  c("hu", "Hungary", 348, "hu"),
  c("tr", "Turkey", 792, "tr"),
  c("il", "Israel", 376, "he"),
  c("sa", "Saudi Arabia", 682, "ar", "xa-ar"),
  c("eg", "Egypt", 818, "ar", "xa-ar"),
  c("br", "Brazil", 76, "pt"),
  c("mx", "Mexico", 484, "es"),
  c("ar", "Argentina", 32, "es"),
  c("co", "Colombia", 170, "es"),
  c("cl", "Chile", 152, "es"),
];
