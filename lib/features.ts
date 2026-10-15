import "server-only";
import { billingConfigured } from "@/lib/billing/razorpay";
import { dfsConfigured } from "@/lib/dataforseo/client";
import { activeEngines } from "@/lib/providers";
import type { FeatureState } from "@/lib/features-shared";

/*
 * What is live. A feature only ships when its code is finished AND the API behind it is configured on this
 * deployment; anything else is shown as "coming soon" (nav, overview, and the page itself) instead of a page that
 * errors on first use. Roadmap items are features that aren't built yet: always coming soon.
 */

export type FeatureKey = "visibility" | "rank-tracker" | "domain-keywords" | "backlinks" | "billing" | "search-console" | "client-reports" | "team-seats" | "api-mcp" | "local-seo";

interface FeatureDef {
  key: FeatureKey;
  name: string;
  href: string | null;
  summary: string;
  /** null = roadmap (not built). Otherwise returns why it isn't ready, or null when live. */
  check: (() => string | null) | null;
}

const DEFS: FeatureDef[] = [
  {
    key: "visibility",
    name: "AI Visibility",
    href: "/app/visibility",
    summary: "Daily checks of whether Gemini, ChatGPT, Perplexity and Claude mention and cite your brand.",
    check: () => (activeEngines().length ? null : "No AI engine API key is set (GEMINI_API_KEY)."),
  },
  {
    key: "rank-tracker",
    name: "Rank Tracker",
    href: "/app/rank-tracker",
    summary: "Daily Google positions in the top 100 with competitors, SERP features, alerts and imports from SE Ranking or Semrush.",
    check: () => (dfsConfigured() ? null : "DataForSEO credentials are not set (DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD)."),
  },
  {
    key: "domain-keywords",
    name: "Domain keywords",
    href: "/app/rank-tracker?tab=domains",
    summary: "Every keyword any domain ranks for, with volume and traffic share.",
    check: () => (dfsConfigured() ? null : "DataForSEO credentials are not set."),
  },
  {
    key: "backlinks",
    name: "Backlinks",
    href: "/app/backlinks",
    summary: "Referring domains, anchors, new and lost links for any site or URL.",
    // DataForSEO bills the Backlinks API as a separate subscription, so it is opt-in even when Labs/SERP work.
    check: () => (!dfsConfigured() ? "DataForSEO credentials are not set." : process.env.DATAFORSEO_BACKLINKS === "on" ? null : "The DataForSEO Backlinks subscription is not enabled (DATAFORSEO_BACKLINKS=on)."),
  },
  {
    key: "billing",
    name: "Pro plan",
    href: "/app/billing",
    summary: "Upgrade to Pro for daily checks and higher limits.",
    check: () => (billingConfigured() ? null : "Razorpay keys are not set."),
  },
  { key: "search-console", name: "Search Console & Analytics", href: null, summary: "Connect Google Search Console and GA4 to see clicks, impressions and conversions beside rankings.", check: null },
  { key: "client-reports", name: "Client reports", href: null, summary: "White-label reports with your logo, shared by link or emailed to clients on a schedule.", check: null },
  { key: "team-seats", name: "Team seats", href: null, summary: "Invite your team and clients with their own roles and projects.", check: null },
  { key: "api-mcp", name: "API & MCP", href: null, summary: "Use your SEO data from Claude, ChatGPT or your own scripts.", check: null },
  { key: "local-seo", name: "Local SEO", href: null, summary: "Map-pack rankings by city and Google Business Profile checks.", check: null },
];

export function featureStates(): FeatureState[] {
  return DEFS.map((d) => {
    const reason = d.check ? d.check() : "Not built yet.";
    return { key: d.key, name: d.name, href: d.href, summary: d.summary, live: reason === null, roadmap: d.check === null, reason };
  });
}

export function featureState(key: FeatureKey): FeatureState {
  return featureStates().find((f) => f.key === key)!;
}

export function isLive(key: FeatureKey): boolean {
  return featureState(key).live;
}
