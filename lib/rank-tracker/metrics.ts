/* Pure Rank Tracker metrics and alert rules. Shared by the server (alerts) and the dashboard (summary). */

import type { RtAlertKind, RtPoint } from "./types";

/**
 * Approximate organic click-through rate by position (Backlinko's 2023 analysis of 4M Google results:
 * 27.6%, 15.8%, 11.0%, 8.4%, 6.3%, 4.9%, 3.9%, 3.3%, 2.7%, 2.4% for positions 1-10). Page two is put at
 * about 1% tapering to 0.5%, and beyond 20 at 0. It is a weighting curve, not a traffic prediction.
 */
const CTR_TOP10 = [0.276, 0.158, 0.11, 0.084, 0.063, 0.049, 0.039, 0.033, 0.027, 0.024];

export function ctrAt(position: number | null | undefined): number {
  if (!position || position < 1) return 0;
  if (position <= 10) return CTR_TOP10[position - 1];
  if (position <= 20) return 0.01 - (position - 11) * 0.0005;
  return 0;
}

/** 0-100: average CTR weight of every checked keyword relative to holding #1 for all of them. */
export function visibilityScore(positions: (number | null)[]): number | null {
  if (!positions.length) return null;
  const sum = positions.reduce<number>((s, p) => s + ctrAt(p), 0);
  return Math.round((sum / (positions.length * CTR_TOP10[0])) * 1000) / 10;
}

export type Bucket = "1-3" | "4-10" | "11-20" | "21-50" | "51-100" | "none";
export const BUCKETS: Bucket[] = ["1-3", "4-10", "11-20", "21-50", "51-100", "none"];

export function bucketOf(p: number | null): Bucket {
  if (p === null) return "none";
  if (p <= 3) return "1-3";
  if (p <= 10) return "4-10";
  if (p <= 20) return "11-20";
  if (p <= 50) return "21-50";
  return "51-100";
}

/**
 * Positive = improved (moved towards #1). Entering the scanned top counts as an improvement of
 * (101 - position); dropping out as the reverse. null when there is nothing to compare.
 */
export function positionDelta(before: number | null | undefined, after: number | null | undefined): number | null {
  if (before === undefined || after === undefined) return null;
  if (before === null && after === null) return null;
  if (before === null) return 101 - (after as number);
  if (after === null) return -(101 - before);
  return before - after;
}

/** The latest point dated on or before `date` (YYYY-MM-DD). */
export function pointAtOrBefore(history: RtPoint[], date: string): RtPoint | undefined {
  for (let i = history.length - 1; i >= 0; i--) if (history[i].d <= date) return history[i];
  return undefined;
}

export const daysAgo = (today: string, n: number) => new Date(Date.parse(`${today}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

export interface KeywordMove {
  current: number | null;
  /** Previous check (any date before the latest). */
  prev: number | null | undefined;
  d1: number | null;
  d7: number | null;
  d30: number | null;
}

export function moveOf(history: RtPoint[], today: string): KeywordMove | null {
  const last = history[history.length - 1];
  if (!last) return null;
  const prevPoint = history.length > 1 ? history[history.length - 2] : undefined;
  const p7 = pointAtOrBefore(history.slice(0, -1), daysAgo(today, 7));
  const p30 = pointAtOrBefore(history.slice(0, -1), daysAgo(today, 30));
  return {
    current: last.p,
    prev: prevPoint ? prevPoint.p : undefined,
    d1: positionDelta(prevPoint ? prevPoint.p : undefined, last.p),
    d7: positionDelta(p7 ? p7.p : undefined, last.p),
    d30: positionDelta(p30 ? p30.p : undefined, last.p),
  };
}

export interface Summary {
  tracked: number;
  checked: number;
  ranking: number;
  avgPosition: number | null;
  top3: number;
  top10: number;
  top100: number;
  visibility: number | null;
  distribution: Record<Bucket, number>;
  improved: number;
  declined: number;
  /** Change in visibility vs the previous check / 7 / 30 days ago (points). */
  visibilityDelta: { d1: number | null; d7: number | null; d30: number | null };
}

/** Each keyword's position as of `date`: its latest point on or before it, if no older than `maxAgeDays`. */
function positionsAsOf(histories: RtPoint[][], date: string, maxAgeDays: number): (number | null)[] {
  const oldest = daysAgo(date, maxAgeDays);
  const out: (number | null)[] = [];
  for (const h of histories) {
    const p = pointAtOrBefore(h, date);
    if (p && p.d >= oldest) out.push(p.p);
  }
  return out;
}

export function summarize(histories: RtPoint[][], today: string, cadenceDays: number): Summary {
  const latest = histories.map((h) => h[h.length - 1]).filter(Boolean) as RtPoint[];
  const positions = latest.map((p) => p.p);
  const ranked = positions.filter((p): p is number => p !== null);
  const distribution = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<Bucket, number>;
  for (const p of positions) distribution[bucketOf(p)] += 1;

  let improved = 0;
  let declined = 0;
  for (const h of histories) {
    const m = moveOf(h, today);
    if (m?.d1 && m.d1 > 0) improved += 1;
    else if (m?.d1 && m.d1 < 0) declined += 1;
  }

  const vis = visibilityScore(positions);
  const window = cadenceDays + 1;
  const visAt = (n: number) => {
    const ps = positionsAsOf(histories.map((h) => h.slice(0, -1)), daysAgo(today, n), window);
    const v = visibilityScore(ps);
    return v === null || vis === null ? null : Math.round((vis - v) * 10) / 10;
  };
  const prevVis = (() => {
    const prevs = histories.filter((h) => h.length > 1).map((h) => h[h.length - 2].p);
    const v = visibilityScore(prevs);
    return v === null || vis === null ? null : Math.round((vis - v) * 10) / 10;
  })();

  return {
    tracked: histories.length,
    checked: latest.length,
    ranking: ranked.length,
    avgPosition: ranked.length ? Math.round((ranked.reduce((s, p) => s + p, 0) / ranked.length) * 10) / 10 : null,
    top3: ranked.filter((p) => p <= 3).length,
    top10: ranked.filter((p) => p <= 10).length,
    top100: ranked.length,
    visibility: vis,
    distribution,
    improved,
    declined,
    visibilityDelta: { d1: prevVis, d7: visAt(7), d30: visAt(30) },
  };
}

/** Daily series for the trend chart: carries each keyword's last known position forward for up to `window` days. */
export function visibilitySeries(histories: RtPoint[][], days: number, today: string, cadenceDays: number): { date: string; visibility: number | null; avgPosition: number | null; top10: number; checked: number }[] {
  const dates = new Set<string>();
  for (const h of histories) for (const p of h) if (p.d >= daysAgo(today, days)) dates.add(p.d);
  return [...dates].sort().map((date) => {
    const ps = positionsAsOf(histories, date, cadenceDays + 1);
    const ranked = ps.filter((p): p is number => p !== null);
    return {
      date,
      visibility: visibilityScore(ps),
      avgPosition: ranked.length ? Math.round((ranked.reduce((s, p) => s + p, 0) / ranked.length) * 10) / 10 : null,
      top10: ranked.filter((p) => p <= 10).length,
      checked: ps.length,
    };
  });
}

/**
 * Notable changes between two checks. `before === undefined` means there was no earlier check (no alert).
 * `threshold` is the minimum jump, in positions, for a plain up/down alert.
 */
export function alertKinds(before: number | null | undefined, after: number | null, threshold: number): RtAlertKind[] {
  if (before === undefined) return [];
  const kinds: RtAlertKind[] = [];
  if (before !== null && before <= 10 && (after === null || after > 10)) kinds.push("top10_lost");
  if (after !== null && after <= 3 && (before === null || before > 3)) kinds.push("top3_new");
  if (before !== null && after === null && before > 10) kinds.push("top100_lost");
  if (before === null && after !== null && after > 3) kinds.push("top100_new");
  if (before !== null && after !== null && !kinds.length) {
    if (before - after >= threshold) kinds.push("moved_up");
    else if (after - before >= threshold) kinds.push("moved_down");
  }
  return kinds;
}
