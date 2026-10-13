/* Pure scheduling rules for the Rank Tracker (unit-tested). */

export const DAY_MS = 86_400_000;
/** A daily keyword checked at 03:40 yesterday may run from 01:40 today, so it doesn't drift later each day. */
export const DUE_SLACK_MS = 2 * 60 * 60_000;
/** While a task is in flight the keyword is leased this long; after that it may be posted again. */
export const PENDING_LEASE_MS = 26 * 60 * 60_000;
/** A claim that never turned into a posted task (process died in between) expires after this. */
export const CLAIM_LEASE_MS = 15 * 60_000;
/** A queued task not collected after this long is abandoned (DataForSEO drops uncollected tasks from tasks_ready after 3 days). */
export const TASK_ABANDON_MS = 3 * DAY_MS - 60 * 60_000;
export const MAX_ATTEMPTS = 3;
export const HISTORY_CAP = 400;

export const todayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export function nextDueAfterCheck(checkedAt: number, cadenceDays: number): number {
  return checkedAt + cadenceDays * DAY_MS - DUE_SLACK_MS;
}

/** Backoff after a failed attempt: 30 min, 2 h, 6 h. */
export function retryAt(now: number, attempts: number): number {
  return now + [30, 120, 360][Math.min(Math.max(attempts, 1), 3) - 1] * 60_000;
}

export interface DueInput {
  nextDueAt: number;
  pendingTaskId: string | null;
  pendingSince: number | null;
  lastDate: string | null;
}

/** Whether a keyword may be posted now. `manual` ignores the cadence but never re-checks a keyword already checked today. */
export function canPost(k: DueInput, now: number, manual = false): boolean {
  if (k.lastDate === todayKey(now)) return false;
  if (k.pendingTaskId) {
    const lease = k.pendingTaskId.startsWith("claim:") ? CLAIM_LEASE_MS : PENDING_LEASE_MS;
    if ((k.pendingSince ?? 0) > now - lease) return false;
  }
  return manual || k.nextDueAt <= now;
}

/** Replace-or-append a dated point, keep chronological order, cap length. */
export function upsertPoint<T extends { d: string }>(history: T[], point: T, cap = HISTORY_CAP): T[] {
  const next = history.filter((p) => p.d !== point.d);
  next.push(point);
  next.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return next.slice(-cap);
}

/** Keywords allowed for a plan: the oldest `limit` keep being checked after a downgrade. */
export function withinPlan<T extends { createdAt: number; id: string }>(all: T[], limit: number): Set<string> {
  return new Set([...all].sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1)).slice(0, limit).map((k) => k.id));
}
