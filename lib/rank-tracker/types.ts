/* Shared (client + server) Rank Tracker types. No server-only imports. */

export type Device = "desktop" | "mobile";

export interface RtCompetitorPos {
  domain: string;
  /** Organic rank_group, or null when not found in the results that were scanned. */
  position: number | null;
  url: string | null;
}

/** One check of one keyword, as stored on the keyword (latest) and in the daily snapshot. */
export interface RtCheck {
  /** YYYY-MM-DD (UTC) the check belongs to. */
  date: string;
  checkedAt: number;
  /**
   * Best position: the organic rank_group of our best organic result. When we hold the featured snippet but have
   * no organic listing, 1 (see `source`). null = not found in the scanned results ("not in top N").
   */
  position: number | null;
  /** rank_absolute of the same element (counts every SERP element above it). */
  rankAbsolute: number | null;
  url: string | null;
  /** Where `position` came from. */
  source: "organic" | "featured_snippet" | null;
  /** How many organic results were scanned. 100 normally; less when Google returned fewer. */
  scanned: number;
  /** SERP feature types on the page (DataForSEO item_types, minus organic). */
  features: string[];
  /** SERP features that reference our domain (featured_snippet, ai_overview, local_pack, video, ...). */
  ourFeatures: string[];
  competitors: RtCompetitorPos[];
  /** True when Google returned no results at all for the query (DataForSEO 40102). */
  noResults?: boolean;
}

export interface RtSerpRow {
  rank: number;
  domain: string;
  url: string;
  title: string;
}

export interface RtSnapshot extends RtCheck {
  id: string;
  keywordId: string;
  projectId: string;
  ownerUid: string;
  keyword: string;
  /** First 10 organic results. */
  top: RtSerpRow[];
  seResultsCount: number | null;
  checkUrl: string | null;
  taskId: string;
}

/** Compact history point kept on the keyword doc (sparklines, movers). p = null means not in the scanned top. */
export interface RtPoint {
  d: string;
  p: number | null;
}

export interface RtProject {
  id: string;
  ownerUid: string;
  name: string;
  /** Normalised host without www, e.g. "acme.com" or "shop.acme.com". */
  domain: string;
  /** Count rankings from any subdomain of `domain`. */
  includeSubdomains: boolean;
  /** ISO-3166 alpha-2, lowercase (COUNTRIES). */
  country: string;
  language: string;
  /** DataForSEO location_code actually sent (country or city). */
  locationCode: number;
  /** Human label, e.g. "United States" or "London,England,United Kingdom". */
  locationName: string;
  device: Device;
  competitors: string[];
  createdAt: number;
  updatedAt?: number;
  /** Last time a batch of checks was posted / collected for this project. */
  lastPostedAt?: number | null;
  lastCollectedAt?: number | null;
  /** Throttle for on-demand collection from the dashboard poll. */
  pollAt?: number | null;
  /** Email notable changes (only when an email provider is configured). Default true. */
  emailAlerts?: boolean;
  /** Minimum jump, in positions, for a plain up/down alert. */
  alertThreshold?: number;
}

export interface RtKeyword {
  id: string;
  projectId: string;
  ownerUid: string;
  keyword: string;
  tags: string[];
  createdAt: number;
  /** When the next scheduled check is due (ms). 0 = as soon as possible. */
  nextDueAt: number;
  /** DataForSEO task in flight. */
  pendingTaskId: string | null;
  pendingSince: number | null;
  /** Consecutive failed attempts (reset on success). */
  attempts: number;
  lastError: string | null;
  last: RtCheck | null;
  /** Oldest first, capped. */
  history: RtPoint[];
  best: number | null;
  /** Optional search volume from Keyword Research / Domain keywords, when known. Never estimated. */
  volume?: number | null;
}

export type RtAlertKind = "top10_lost" | "top3_new" | "moved_up" | "moved_down" | "top100_lost" | "top100_new";

export interface RtAlert {
  id: string;
  projectId: string;
  ownerUid: string;
  keywordId: string;
  keyword: string;
  kind: RtAlertKind;
  from: number | null;
  to: number | null;
  date: string;
  createdAt: number;
}

/* ---- Domain keywords (DataForSEO Labs) ---- */

export interface DomainKeywordRow {
  keyword: string;
  position: number | null;
  rankAbsolute: number | null;
  /** organic | featured_snippet | ai_overview_reference | local_pack */
  type: string;
  url: string | null;
  volume: number | null;
  /** Estimated monthly traffic (DataForSEO etv). */
  traffic: number | null;
  cpc: number | null;
  kd: number | null;
  intent: string | null;
  /** Previous rank_absolute when DataForSEO reports a change. */
  previous: number | null;
  isNew: boolean;
  serpFeatures: string[];
  updatedAt: string | null;
}

export interface DomainKeywordsResult {
  domain: string;
  country: string;
  language: string;
  locationCode: number;
  limit: number;
  /** Keywords the database has for this domain (may exceed rows returned). */
  totalCount: number;
  /** Position buckets and estimated traffic for organic results (whole domain, not just rows shown). */
  organic: { pos1: number; pos2_3: number; pos4_10: number; pos11_20: number; pos21_50: number; pos51_100: number; count: number; etv: number | null } | null;
  aiOverviewCount: number | null;
  rows: DomainKeywordRow[];
  fetchedAt: number;
  cachedAt?: number;
}

export const ALERT_LABEL: Record<RtAlertKind, string> = {
  top10_lost: "Dropped out of the top 10",
  top3_new: "New top 3",
  moved_up: "Climbed",
  moved_down: "Fell",
  top100_lost: "Dropped out of the top 100",
  top100_new: "Entered the top 100",
};

/** Plain names for DataForSEO SERP item types. */
export const FEATURE_LABEL: Record<string, string> = {
  featured_snippet: "Featured snippet",
  ai_overview: "AI Overview",
  local_pack: "Local pack",
  people_also_ask: "People also ask",
  video: "Videos",
  short_videos: "Short videos",
  images: "Images",
  top_stories: "Top stories",
  knowledge_graph: "Knowledge panel",
  answer_box: "Answer box",
  related_searches: "Related searches",
  people_also_search: "People also search",
  shopping: "Shopping",
  popular_products: "Popular products",
  paid: "Ads",
  map: "Map",
  discussions_and_forums: "Discussions",
  perspectives: "Perspectives",
  twitter: "X posts",
  carousel: "Carousel",
  hotels_pack: "Hotels",
  jobs: "Jobs",
  events: "Events",
  recipes: "Recipes",
  scholarly_articles: "Scholarly",
  google_reviews: "Reviews",
  third_party_reviews: "Reviews",
  app: "Apps",
  questions_and_answers: "Q&A",
  find_results_on: "Find results on",
  top_sights: "Top sights",
  ai_overview_reference: "AI Overview",
};

export const featureLabel = (t: string) => FEATURE_LABEL[t] ?? t.replace(/_/g, " ");
