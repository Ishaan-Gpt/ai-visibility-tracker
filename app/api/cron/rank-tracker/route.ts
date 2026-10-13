import { NextRequest, NextResponse } from "next/server";
import { dfsConfigured } from "@/lib/dataforseo/client";
import { runTick } from "@/lib/rank-tracker/engine";

export const maxDuration = 300;

/** Stop starting work well before the 300 s limit; anything left is picked up by the next tick. */
const BUDGET_MS = 240_000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Hourly Rank Tracker tick (vercel.json): collect finished DataForSEO tasks, sweep stale ones, then post every
 * keyword that is due (weekly on Free, daily on Pro) as Standard-queue tasks, within the daily spend budget.
 */
async function handle(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dfsConfigured()) return NextResponse.json({ ok: true, skipped: "DataForSEO is not configured" });
  const started = Date.now();
  const result = await runTick(started + BUDGET_MS);
  return NextResponse.json({ ok: true, ...result, elapsedMs: Date.now() - started });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
