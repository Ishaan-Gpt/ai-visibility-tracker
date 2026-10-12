import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { planLimits } from "@/lib/data";
import { acquireRunLock, runBrandCheck, todayKey, type RunOutcome } from "@/lib/visibility/run";
import { settleLimit } from "@/lib/visibility/pool";
import type { BrandDoc, UserDoc } from "@/lib/types";

export const maxDuration = 300;

/** Stop starting work well before the 300 s limit; anything left stays due for the next tick. */
const BUDGET_MS = 255_000;
/** Don't start a brand with less than this left: a brand that can't finish would be retried anyway. */
const MIN_TIME_FOR_BRAND_MS = 70_000;
const BRAND_CONCURRENCY = 4;
const PROMPT_CONCURRENCY = 4;
/** Lets a daily brand checked at 03:40 yesterday run at 03:00 today instead of drifting later each day. */
const DUE_SLACK_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type BrandHead = Pick<BrandDoc, "id" | "ownerUid" | "lastCheckedAt" | "lastCheckedDate" | "runLockUntil">;

async function loadPlans(uids: string[]): Promise<Map<string, UserDoc["plan"]>> {
  const db = adminDb();
  const plans = new Map<string, UserDoc["plan"]>();
  for (let i = 0; i < uids.length; i += 100) {
    const refs = uids.slice(i, i + 100).map((uid) => db.collection("users").doc(uid));
    if (!refs.length) continue;
    const snaps = await db.getAll(...refs);
    for (const s of snaps) plans.set(s.id, (s.data() as UserDoc | undefined)?.plan ?? "free");
  }
  return plans;
}

/**
 * Hourly tick. Finds brands that are due (by plan: weekly free, daily paid), oldest first, and checks them
 * with bounded concurrency inside a time budget. Idempotent per brand per UTC day: a brand already checked
 * today, or locked by a run in flight, is skipped.
 */
async function handleCronRequest(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const started = Date.now();
  const deadline = started + BUDGET_MS;
  const today = todayKey(started);
  const db = adminDb();

  // Projection keeps this cheap even with many brands.
  const headsSnap = await db.collection("brands").select("ownerUid", "lastCheckedAt", "lastCheckedDate", "runLockUntil").get();
  const heads: BrandHead[] = headsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BrandHead, "id">) }));
  const plans = await loadPlans([...new Set(heads.map((h) => h.ownerUid).filter(Boolean))]);

  const due = heads
    .filter((h) => {
      if (h.lastCheckedDate === today) return false;
      if ((h.runLockUntil ?? 0) > started) return false;
      const refreshMs = planLimits(plans.get(h.ownerUid)).refreshDays * DAY_MS;
      return started >= (h.lastCheckedAt ?? 0) + refreshMs - DUE_SLACK_MS;
    })
    .sort((a, b) => (a.lastCheckedAt ?? 0) - (b.lastCheckedAt ?? 0));

  const results = await settleLimit(due, BRAND_CONCURRENCY, async (head): Promise<{ brandId: string; status: RunOutcome["status"] | "deferred"; answers?: number; failed?: number }> => {
    if (Date.now() > deadline - MIN_TIME_FOR_BRAND_MS) return { brandId: head.id, status: "deferred" };
    if (!(await acquireRunLock(head.id))) return { brandId: head.id, status: "locked" };
    const snap = await db.collection("brands").doc(head.id).get();
    if (!snap.exists) return { brandId: head.id, status: "failed" };
    const brand = { id: snap.id, ...(snap.data() as Omit<BrandDoc, "id">) } as BrandDoc;
    const outcome = await runBrandCheck(brand, { source: "cron", concurrency: PROMPT_CONCURRENCY, deadline, lockHeld: true });
    return { brandId: head.id, status: outcome.status, answers: outcome.answers, failed: outcome.failed };
  });

  const summary = results.map((r, i) => (r.ok ? r.value : { brandId: due[i].id, status: "error" as const, error: r.error instanceof Error ? r.error.message.slice(0, 160) : String(r.error) }));
  const count = (s: string) => summary.filter((r) => r.status === s).length;

  return NextResponse.json({
    ok: true,
    brands: heads.length,
    due: due.length,
    completed: count("completed"),
    partial: count("partial"),
    failed: count("failed") + count("error"),
    deferred: count("deferred"),
    skipped: count("locked") + count("no-prompts"),
    elapsedMs: Date.now() - started,
    summary: summary.slice(0, 100),
  });
}

export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
