export type Plan = "free" | "paid";

export const PLAN_LIMITS: Record<Plan, { maxPrompts: number; maxCompetitors: number; refreshDays: number }> = {
  free: { maxPrompts: 3, maxCompetitors: 1, refreshDays: 7 },
  paid: { maxPrompts: 10, maxCompetitors: 2, refreshDays: 1 },
};

export interface UserDoc {
  uid: string;
  email: string;
  plan: Plan;
  createdAt: number;
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
}

export interface PromptDoc {
  id: string;
  brandId: string;
  text: string;
  active: boolean;
  createdAt: number;
}

export type Provider = "gemini";

export interface RunDoc {
  id: string;
  brandId: string;
  promptId: string;
  provider: Provider;
  timestamp: number;
  mentioned: boolean;
  citedUrls: string[];
  competitorMentions: Record<string, boolean>;
  rawExcerpt: string;
  grounded: boolean;
}

export interface RollupDoc {
  brandId: string;
  date: string; // YYYY-MM-DD
  totalPrompts: number;
  mentionedCount: number;
  score: number; // 0-100
  competitorMentionCounts: Record<string, number>;
}
