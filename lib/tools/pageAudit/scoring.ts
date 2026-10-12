/*
 * Page Audit scoring model (v2). Client-safe: the workspace re-runs `scoreSeo` when Core Web Vitals arrive.
 *
 * SEO score
 * ---------
 * 1. Every check carries an `impact` (0–10) describing how much it matters inside its category. impact 0 = shown, not scored.
 * 2. A check earns `CREDIT[severity]` of its impact: pass 100%, info 80% (a refinement), warning 40%, error 0%.
 * 3. Category score = earned impact / possible impact × 100.
 * 4. Overall = weighted mean of the category scores using `CATEGORY_WEIGHTS` (only categories that have scored checks).
 *    Performance blends our server-side checks with Lighthouse's lab performance score when PageSpeed Insights returns:
 *    perf = 0.4 × server checks + 0.6 × Lighthouse performance.
 * 5. Blockers cap the overall: an error page (4xx/5xx) or a noindexed page can never score above 40, because nothing else
 *    matters while the page cannot be indexed.
 *
 * AI-readiness score
 * ------------------
 * Weighted checks (`AiCheck.weight`), same credit table, so a 0–100 score.
 *
 * Top fixes
 * ---------
 * Each failing check's "gain" is the number of points its lens score would rise if it passed, so SEO and AI fixes are
 * ranked on the same 0–100 scale.
 */
import type { AiCheck, AuditCheck, CategoryScore, CheckCategory, Severity, TopFix } from "./types";

export const CATEGORY_WEIGHTS: Record<CheckCategory, number> = {
  Indexability: 24,
  Content: 18,
  Performance: 14,
  Technical: 12,
  Links: 10,
  "Structured data": 8,
  "Social & Sharing": 6,
};

export const CATEGORY_ORDER: CheckCategory[] = ["Indexability", "Content", "Performance", "Technical", "Links", "Structured data", "Social & Sharing"];

export const CREDIT: Record<Severity, number> = { pass: 1, info: 0.8, warning: 0.4, error: 0 };

/** Ids whose failure blocks indexing outright. */
const BLOCKERS = new Set(["status", "noindex"]);
const BLOCKER_CAP = 40;
const PSI_SHARE = 0.6;

/** v1 checks had no impact; give them the v1 relative weights so old reports still score sensibly. */
function impactOf(c: AuditCheck): number {
  if (typeof c.impact === "number") return c.impact;
  return c.severity === "error" ? 8 : c.severity === "warning" ? 5 : c.severity === "pass" ? 5 : 0;
}

export function categoryScores(checks: AuditCheck[], lighthousePerformance: number | null = null): CategoryScore[] {
  const out: CategoryScore[] = [];
  const weightInPlay = CATEGORY_ORDER.reduce((s, cat) => {
    const has = checks.some((c) => c.category === cat && impactOf(c) > 0) || (cat === "Performance" && lighthousePerformance !== null);
    return has ? s + CATEGORY_WEIGHTS[cat] : s;
  }, 0);
  for (const cat of CATEGORY_ORDER) {
    const items = checks.filter((c) => c.category === cat);
    const scored = items.filter((c) => impactOf(c) > 0);
    let score: number | null = null;
    if (scored.length) {
      const possible = scored.reduce((s, c) => s + impactOf(c), 0);
      const earned = scored.reduce((s, c) => s + impactOf(c) * CREDIT[c.severity], 0);
      score = (earned / possible) * 100;
    }
    if (cat === "Performance" && lighthousePerformance !== null) {
      score = score === null ? lighthousePerformance : score * (1 - PSI_SHARE) + lighthousePerformance * PSI_SHARE;
    }
    if (score === null) continue;
    out.push({
      id: cat,
      score: Math.round(score),
      weight: Math.round((CATEGORY_WEIGHTS[cat] / (weightInPlay || 1)) * 100),
      issues: items.filter((c) => c.severity === "error" || c.severity === "warning").length,
      checks: items.length,
    });
  }
  return out;
}

export function scoreSeo(checks: AuditCheck[], lighthousePerformance: number | null = null): { score: number; categories: CategoryScore[] } {
  const categories = categoryScores(checks, lighthousePerformance);
  const totalW = categories.reduce((s, c) => s + CATEGORY_WEIGHTS[c.id], 0);
  let score = totalW ? categories.reduce((s, c) => s + c.score * CATEGORY_WEIGHTS[c.id], 0) / totalW : 0;
  if (checks.some((c) => BLOCKERS.has(c.id) && c.severity === "error")) score = Math.min(score, BLOCKER_CAP);
  return { score: Math.round(score), categories };
}

export function scoreAi(checks: AiCheck[]): number {
  const max = checks.reduce((s, c) => s + c.weight, 0);
  if (!max) return 0;
  return Math.round((checks.reduce((s, c) => s + c.weight * CREDIT[c.severity], 0) / max) * 100);
}

const RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 };

export function rankFixes(checks: AuditCheck[], ai: AiCheck[], limit = 6): TopFix[] {
  const categories = categoryScores(checks);
  const totalW = categories.reduce((s, c) => s + CATEGORY_WEIGHTS[c.id], 0) || 1;
  const possibleByCat = new Map<CheckCategory, number>();
  for (const c of checks) possibleByCat.set(c.category, (possibleByCat.get(c.category) ?? 0) + impactOf(c));
  const aiMax = ai.reduce((s, c) => s + c.weight, 0) || 1;

  const seo = checks
    .filter((c) => (c.severity === "error" || c.severity === "warning") && c.fix)
    .map((c) => {
      const possible = possibleByCat.get(c.category) || 1;
      let gain = ((impactOf(c) * (1 - CREDIT[c.severity])) / possible) * 100 * (CATEGORY_WEIGHTS[c.category] / totalW);
      // Fixing a blocker lifts the cap, which is worth far more than its in-category share.
      if (BLOCKERS.has(c.id)) gain = Math.max(gain, 30);
      return { title: c.title, fix: c.fix!, severity: c.severity, lens: "seo" as const, gain };
    });
  const aiFixes = ai
    .filter((c) => c.severity !== "pass" && c.fix)
    .map((c) => ({ title: c.title, fix: c.fix!, severity: c.severity, lens: "ai" as const, gain: ((c.weight * (1 - CREDIT[c.severity])) / aiMax) * 100 }));

  return [...seo, ...aiFixes]
    .filter((f) => f.gain >= 0.5 || f.severity === "error")
    .sort((a, b) => b.gain - a.gain || RANK[a.severity] - RANK[b.severity])
    .slice(0, limit)
    .map((f) => ({ ...f, gain: Math.max(1, Math.round(f.gain)) }));
}
