import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { DfsError, dfsCall, fixturesDir } from "./client";
import { serpTaskMaxCost } from "./prices";

/*
 * Global DataForSEO spend guard. Every paid call reserves its worst-case price first (transaction on
 * `dfsSpend/{YYYY-MM-DD}`), then records the `cost` DataForSEO actually returned. When today's total would pass
 * DATAFORSEO_DAILY_BUDGET_USD (default $0.50), when the account balance is below DATAFORSEO_MIN_BALANCE_USD
 * (default $0.20, a last-resort floor; the daily budget is the main cap), or after DataForSEO reports a billing error, paid calls pause until the next UTC day / hour.
 * Fails closed: if Firestore can't be reached, nothing is spent.
 *
 * Balance comes from GET /v3/appendix/user_data (free), cached in `dfsMeta/balance` and refreshed at most once an
 * hour, only in production builds (never in development or fixture mode) unless DATAFORSEO_BALANCE_CHECK=off.
 */

export type SpendCategory = "serp" | "labs" | "keywords" | "backlinks";

const SPEND = "dfsSpend";
const META = "dfsMeta";
const BALANCE_TTL_MS = 60 * 60_000;
const BILLING_PAUSE_MS = 60 * 60_000;

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
export const dailyBudget = () => num(process.env.DATAFORSEO_DAILY_BUDGET_USD, 0.5);
export const minBalance = () => num(process.env.DATAFORSEO_MIN_BALANCE_USD, 0.2);
const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const round = (n: number) => Math.round(n * 1e6) / 1e6;

export interface GuardStatus {
  paused: boolean;
  reason: string | null;
  spentToday: number;
  budget: number;
  balance: number | null;
}

function balanceCheckEnabled(): boolean {
  return process.env.NODE_ENV === "production" && !fixturesDir() && process.env.DATAFORSEO_BALANCE_CHECK !== "off";
}

/** Cached account balance; refreshes from user_data at most hourly (production only). null = unknown. */
async function cachedBalance(): Promise<number | null> {
  const ref = adminDb().collection(META).doc("balance");
  const snap = await ref.get();
  const data = snap.data() as { balance?: number; checkedAt?: number } | undefined;
  const fresh = data?.checkedAt && Date.now() - data.checkedAt < BALANCE_TTL_MS;
  if (fresh || !balanceCheckEnabled()) return typeof data?.balance === "number" ? data.balance : null;

  // Claim the refresh first so concurrent requests don't all call the API.
  const claimed = await adminDb().runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data() as { checkedAt?: number } | undefined;
    if (cur?.checkedAt && Date.now() - cur.checkedAt < BALANCE_TTL_MS) return false;
    tx.set(ref, { checkedAt: Date.now() }, { merge: true });
    return true;
  });
  if (!claimed) return typeof data?.balance === "number" ? data.balance : null;
  try {
    const env = await dfsCall<{ money?: { balance?: number } }>("GET", "/appendix/user_data", undefined, 10_000);
    const balance = Number(env.tasks?.[0]?.result?.[0]?.money?.balance);
    if (Number.isFinite(balance)) {
      await ref.set({ balance, checkedAt: Date.now() }, { merge: true });
      return balance;
    }
  } catch (err) {
    console.warn("[dfs-guard] balance check failed:", err instanceof Error ? err.message : err);
  }
  return typeof data?.balance === "number" ? data.balance : null;
}

/** Current state for the UI and for callers deciding whether to try. Never throws (reports paused on error). */
export async function guardStatus(): Promise<GuardStatus> {
  const budget = dailyBudget();
  try {
    const [spendSnap, stateSnap, balance] = await Promise.all([
      adminDb().collection(SPEND).doc(dayKey()).get(),
      adminDb().collection(META).doc("state").get(),
      cachedBalance(),
    ]);
    const spentToday = round((spendSnap.data()?.total as number | undefined) ?? 0);
    const state = stateSnap.data() as { pausedUntil?: number; pauseReason?: string } | undefined;
    let reason: string | null = null;
    if ((state?.pausedUntil ?? 0) > Date.now()) reason = state?.pauseReason ?? "Paused after a provider billing error.";
    else if (balance !== null && balance < minBalance()) reason = "The data provider balance is low.";
    // Less left than one full rank check (10 SERP pages) counts as used up.
    else if (spentToday > budget - serpTaskMaxCost(100)) reason = "Today's data budget is used up. Checks resume after midnight UTC.";
    return { paused: reason !== null, reason, spentToday, budget, balance };
  } catch (err) {
    console.warn("[dfs-guard] status unavailable:", err instanceof Error ? err.message : err);
    return { paused: true, reason: "Spend tracking is unavailable, so paid checks are paused.", spentToday: 0, budget, balance: null };
  }
}

/**
 * Reserves budget for up to `units` calls of `unitCost` each and returns how many fit (0 when paused).
 * Call `settleSpend` afterwards with the reserved amount and the actual cost.
 */
export async function reserveSpend(category: SpendCategory, unitCost: number, units = 1): Promise<{ granted: number; reserved: number; reason: string | null }> {
  if (units <= 0) return { granted: 0, reserved: 0, reason: null };
  const status = await guardStatus();
  if (status.paused) return { granted: 0, reserved: 0, reason: status.reason };
  const budget = status.budget;
  try {
    const ref = adminDb().collection(SPEND).doc(dayKey());
    return await adminDb().runTransaction(async (tx) => {
      const total = ((await tx.get(ref)).data()?.total as number | undefined) ?? 0;
      const room = budget - total;
      const granted = unitCost > 0 ? Math.max(0, Math.min(units, Math.floor((room + 1e-9) / unitCost))) : units;
      if (granted === 0) return { granted: 0, reserved: 0, reason: "Today's data budget is used up. Checks resume after midnight UTC." };
      const reserved = round(granted * unitCost);
      tx.set(
        ref,
        {
          day: dayKey(),
          total: FieldValue.increment(reserved),
          byCategory: { [category]: FieldValue.increment(reserved) },
          reservations: FieldValue.increment(1),
          updatedAt: Date.now(),
          expiresAt: new Date(Date.now() + 120 * 86_400_000),
        },
        { merge: true },
      );
      return { granted, reserved, reason: null };
    });
  } catch (err) {
    console.warn("[dfs-guard] reserve failed (failing closed):", err instanceof Error ? err.message : err);
    return { granted: 0, reserved: 0, reason: "Spend tracking is unavailable, so paid checks are paused." };
  }
}

/** Replaces a reservation with the actual cost (both may be 0). Best-effort. */
export async function settleSpend(category: SpendCategory, reserved: number, actual: number): Promise<void> {
  const delta = round(actual - reserved);
  try {
    await adminDb()
      .collection(SPEND)
      .doc(dayKey())
      .set(
        {
          total: FieldValue.increment(delta),
          byCategory: { [category]: FieldValue.increment(delta) },
          actual: { [category]: FieldValue.increment(round(actual)) },
          updatedAt: Date.now(),
        },
        { merge: true },
      );
  } catch (err) {
    console.warn("[dfs-guard] settle failed:", err instanceof Error ? err.message : err);
  }
}

/** After a billing/limit error from DataForSEO, stop paid calls for an hour. */
export async function noteProviderError(err: unknown): Promise<void> {
  if (!(err instanceof DfsError) || !err.isBilling) return;
  try {
    await adminDb()
      .collection(META)
      .doc("state")
      .set({ pausedUntil: Date.now() + BILLING_PAUSE_MS, pauseReason: "The data provider reported a billing limit. Paid checks are paused for an hour.", at: Date.now() }, { merge: true });
  } catch {
    /* best-effort */
  }
}
