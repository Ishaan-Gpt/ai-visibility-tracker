export type Plan = "free" | "paid";

export const PLAN_LIMITS: Record<Plan, { maxPrompts: number; maxCompetitors: number; refreshDays: number; maxAliases: number }> = {
  free: { maxPrompts: 3, maxCompetitors: 1, refreshDays: 7, maxAliases: 3 },
  paid: { maxPrompts: 10, maxCompetitors: 2, refreshDays: 1, maxAliases: 8 },
};

export interface UserDoc {
  uid: string;
  email: string;
  plan: Plan;
  createdAt: number;
  billingProvider?: "razorpay";
  pendingSubscriptionId?: string;
  subscriptionId?: string;
  billingStatus?: string;
  paidAt?: number;
}

export interface Competitor {
  name: string;
  domain: string;
}

export interface BrandDoc {
  id: string;
  ownerUid: string;
  name: string;
  domain: string;
  competitors: Competitor[];
  createdAt: number;
  /** Other names the brand goes by ("AcmeDent", "Acme Dental Clinic"). Matched with the same rules as the name. */
  aliases?: string[];
  /** What the brand does, in a few words. Feeds prompt suggestions. */
  category?: string;
  /** Last completed check (scheduled or on demand). 0 / missing = never checked. */
  lastCheckedAt?: number;
  /** YYYY-MM-DD (UTC) of the last completed check: makes the scheduler idempotent per day. */
  lastCheckedDate?: string;
  /** Set while a check is running so a second one can't start; expires on its own if a run dies. */
  runLockUntil?: number;
  lastRunError?: string | null;
}

export interface PromptDoc {
  id: string;
  brandId: string;
  text: string;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}

export type Provider = "gemini" | "openai" | "perplexity" | "anthropic";

export type Sentiment = "positive" | "neutral" | "negative";

export interface Citation {
  url: string;
  /** Registrable domain, e.g. "g2.com" for "https://www.g2.com/x". */
  domain: string;
  title?: string;
}

export interface RunDoc {
  id: string;
  brandId: string;
  promptId: string;
  provider: Provider;
  timestamp: number;
  mentioned: boolean;
  citedUrls: string[];
  /** Keyed by competitor domain. */
  competitorMentions: Record<string, boolean>;
  rawExcerpt: string;
  grounded: boolean;
  /* ---- v2 analysis (absent on runs written before it shipped) ---- */
  /** Model id that produced the answer. */
  model?: string;
  /** YYYY-MM-DD (UTC) the run belongs to. */
  date?: string;
  /** 1-based rank of the brand's first mention among every brand named in the answer; null when not mentioned. */
  position?: number | null;
  /** Brand's registrable domain is among the answer's sources. */
  cited?: boolean;
  citations?: Citation[];
  sentiment?: Sentiment | null;
  sentimentReason?: string;
  /** Keyed by competitor domain: 1-based rank or null. */
  competitorPositions?: Record<string, number | null>;
  competitorCited?: Record<string, boolean>;
  /** Brands the answer names that aren't you or a tracked competitor (competitor discovery). */
  otherBrands?: string[];
  /** Every brand named, in order of first appearance (yours and competitors use their tracked names). */
  brandOrder?: string[];
  /** Character ranges in rawExcerpt where the brand is mentioned, for highlighting. */
  mentionSpans?: [number, number][];
  /** Whether the sentiment/brand-extraction pass ran (it is fail-soft). */
  analyzed?: boolean;
}

export interface EngineStat {
  total: number;
  mentioned: number;
  cited: number;
  grounded: number;
}

export interface DomainStat {
  domain: string;
  count: number;
  /** "own" = your domain, "competitor" = a tracked competitor's. */
  kind?: "own" | "competitor";
  /** One example URL, for the sources table. */
  sampleUrl?: string;
}

export interface RollupDoc {
  brandId: string;
  date: string; // YYYY-MM-DD
  totalPrompts: number;
  mentionedCount: number;
  score: number; // 0-100
  competitorMentionCounts: Record<string, number>;
  /* ---- v2 metrics (absent on older rollups) ---- */
  /** Answers checked (prompts x engines). totalPrompts keeps the same number for older readers. */
  totalAnswers?: number;
  citedCount?: number;
  /** 0-100, share of answers that cite your domain. */
  citationRate?: number;
  /** Mean position across answers that mention you; null when you were never mentioned. */
  avgPosition?: number | null;
  /** 0-100: your mentions / (your mentions + tracked competitor mentions). */
  shareOfVoice?: number;
  /** Keyed by competitor domain, same denominator as shareOfVoice. */
  competitorShareOfVoice?: Record<string, number>;
  competitorCitedCounts?: Record<string, number>;
  competitorAvgPosition?: Record<string, number | null>;
  sentiment?: Record<Sentiment, number>;
  topDomains?: DomainStat[];
  byProvider?: Partial<Record<Provider, EngineStat>>;
  groundedCount?: number;
  /** Untracked brands named most often, for competitor suggestions. */
  otherBrands?: { name: string; count: number }[];
  updatedAt?: number;
}
