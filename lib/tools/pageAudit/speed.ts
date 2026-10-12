import "server-only";
import crypto from "node:crypto";
import type { SpeedMetric, SpeedOpportunity, SpeedReport } from "./types";

/*
 * Core Web Vitals via Google PageSpeed Insights v5: CrUX field data (real Chrome users, last 28 days) plus a Lighthouse
 * lab run. PSI is slow (10–40 s), so the UI calls this separately after the main audit, with a signed token from it.
 */

const TOKEN_TTL_MS = 15 * 60_000;

function secret(): string {
  return process.env.QUOTA_SALT ?? process.env.CRON_SECRET ?? "seowise-dev";
}

export function signSpeedToken(url: string): { token: string; exp: number } {
  const exp = Date.now() + TOKEN_TTL_MS;
  const token = crypto.createHmac("sha256", secret()).update(`${url}|${exp}`).digest("hex").slice(0, 32);
  return { token, exp };
}

export function verifySpeedToken(url: string, exp: number, token: string): boolean {
  if (!Number.isFinite(exp) || exp < Date.now() || typeof token !== "string") return false;
  const expected = crypto.createHmac("sha256", secret()).update(`${url}|${exp}`).digest("hex").slice(0, 32);
  return expected.length === token.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/** Google's published Core Web Vitals thresholds (good ≤ first, poor > second). */
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
  TBT: [200, 600],
  SI: [3400, 5800],
};
const LABELS: Record<SpeedMetric["id"], string> = {
  LCP: "Largest Contentful Paint",
  INP: "Interaction to Next Paint",
  CLS: "Cumulative Layout Shift",
  FCP: "First Contentful Paint",
  TTFB: "Time to First Byte",
  TBT: "Total Blocking Time",
  SI: "Speed Index",
};

function rate(id: SpeedMetric["id"], v: number): SpeedMetric["rating"] {
  const [good, poor] = THRESHOLDS[id];
  return v <= good ? "good" : v <= poor ? "ni" : "poor";
}

function metric(id: SpeedMetric["id"], value: number): SpeedMetric {
  const display = id === "CLS" ? value.toFixed(2) : value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
  return { id, label: LABELS[id], value, display, rating: rate(id, value) };
}

const CRUX_KEYS: [string, SpeedMetric["id"]][] = [
  ["LARGEST_CONTENTFUL_PAINT_MS", "LCP"],
  ["INTERACTION_TO_NEXT_PAINT", "INP"],
  ["CUMULATIVE_LAYOUT_SHIFT_SCORE", "CLS"],
  ["FIRST_CONTENTFUL_PAINT_MS", "FCP"],
  ["EXPERIMENTAL_TIME_TO_FIRST_BYTE", "TTFB"],
];
const LAB_KEYS: [string, SpeedMetric["id"]][] = [
  ["largest-contentful-paint", "LCP"],
  ["cumulative-layout-shift", "CLS"],
  ["first-contentful-paint", "FCP"],
  ["total-blocking-time", "TBT"],
  ["speed-index", "SI"],
];

type Crux = { overall_category?: string; metrics?: Record<string, { percentile?: number }> };
type Audit = { title?: string; score?: number | null; numericValue?: number; displayValue?: string; details?: { type?: string; overallSavingsMs?: number; overallSavingsBytes?: number } };
type Psi = {
  loadingExperience?: Crux & { initial_url?: string; origin_fallback?: boolean };
  originLoadingExperience?: Crux;
  lighthouseResult?: {
    lighthouseVersion?: string;
    runWarnings?: string[];
    categories?: Record<string, { score?: number | null; auditRefs?: { id: string }[] }>;
    audits?: Record<string, Audit>;
  };
  error?: { message?: string; code?: number };
};

function field(c: Crux | undefined, scope: "url" | "origin"): SpeedReport["field"] {
  if (!c?.metrics) return null;
  const metrics = CRUX_KEYS.flatMap(([k, id]) => {
    const p = c.metrics?.[k]?.percentile;
    if (typeof p !== "number") return [];
    return [metric(id, id === "CLS" ? p / 100 : p)];
  });
  if (!metrics.length) return null;
  const overall = c.overall_category === "FAST" ? "good" : c.overall_category === "AVERAGE" ? "ni" : c.overall_category === "SLOW" ? "poor" : undefined;
  return { scope, overall, metrics };
}

export class SpeedError extends Error {}

export async function runPageSpeed(url: string, strategy: "mobile" | "desktop" = "mobile"): Promise<SpeedReport> {
  const qs = new URLSearchParams({ url, strategy });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) qs.append("category", c);
  if (process.env.PAGESPEED_API_KEY) qs.set("key", process.env.PAGESPEED_API_KEY);

  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, { signal: AbortSignal.timeout(55_000) });
  } catch {
    throw new SpeedError("PageSpeed Insights didn't answer in time. Try again in a minute.");
  }
  const data = (await res.json().catch(() => ({}))) as Psi;
  if (!res.ok || data.error) {
    const msg = data.error?.message ?? "";
    if ((res.status === 429 || /quota/i.test(msg)) && !process.env.PAGESPEED_API_KEY) console.warn("[speed] keyless PageSpeed quota exhausted: set PAGESPEED_API_KEY (see .env.example)");
    if (res.status === 429 || /quota/i.test(msg)) throw new SpeedError("Google's PageSpeed quota is used up for now. Try again later.");
    if (/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|NO_FCP|DNS/i.test(msg)) throw new SpeedError("Google's Lighthouse couldn't load the page (it may block Google's servers or never paint).");
    throw new SpeedError(msg ? `PageSpeed Insights: ${msg.slice(0, 160)}` : `PageSpeed Insights returned HTTP ${res.status}.`);
  }

  const lh = data.lighthouseResult;
  const audits = lh?.audits ?? {};
  const cats = lh?.categories ?? {};
  const pct = (k: string) => (typeof cats[k]?.score === "number" ? Math.round((cats[k].score as number) * 100) : null);

  const opportunities: SpeedOpportunity[] = Object.entries(audits)
    .filter(([, a]) => a.details?.type === "opportunity" && (a.details.overallSavingsMs ?? 0) >= 100)
    .map(([id, a]) => ({ id, title: a.title ?? id, display: a.displayValue, savingsMs: a.details?.overallSavingsMs, savingsBytes: a.details?.overallSavingsBytes }))
    .sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0))
    .slice(0, 10);

  const failedAudits: NonNullable<SpeedReport["lab"]>["failedAudits"] = [];
  for (const cat of ["accessibility", "best-practices", "seo"] as const) {
    for (const ref of cats[cat]?.auditRefs ?? []) {
      const a = audits[ref.id];
      if (a && typeof a.score === "number" && a.score < 0.9) failedAudits.push({ category: cat, id: ref.id, title: a.title ?? ref.id });
    }
  }

  const urlField = data.loadingExperience && !data.loadingExperience.origin_fallback ? field(data.loadingExperience, "url") : null;
  return {
    url,
    strategy,
    fetchedAt: Date.now(),
    lighthouseVersion: lh?.lighthouseVersion,
    field: urlField ?? field(data.originLoadingExperience, "origin"),
    lab: lh
      ? {
          scores: { performance: pct("performance"), accessibility: pct("accessibility"), bestPractices: pct("best-practices"), seo: pct("seo") },
          metrics: LAB_KEYS.flatMap(([k, id]) => (typeof audits[k]?.numericValue === "number" ? [metric(id, audits[k].numericValue as number)] : [])),
          opportunities,
          failedAudits: failedAudits.slice(0, 25),
        }
      : null,
    warnings: lh?.runWarnings?.slice(0, 3),
  };
}
