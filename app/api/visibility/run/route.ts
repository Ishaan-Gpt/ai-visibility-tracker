import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser } from "@/lib/data";
import { consumeQuota, getViewer } from "@/lib/usage";
import { runBrandCheck } from "@/lib/visibility/run";

// One check fans out to (prompts x engines) answers plus an analysis call each.
export const maxDuration = 300;
const BUDGET_MS = 270_000;

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Run state for the dashboard's progress UI (polled while a check is in flight). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const brand = await getBrandForUser(user.uid);
  if (!brand) return NextResponse.json({ error: "Create a brand first." }, { status: 404, headers: NO_STORE });
  return NextResponse.json(
    {
      running: (brand.runLockUntil ?? 0) > Date.now(),
      lastCheckedAt: brand.lastCheckedAt ?? null,
      lastRunError: brand.lastRunError ?? null,
    },
    { headers: NO_STORE },
  );
}

/**
 * Checks every active prompt now. The first check after onboarding (`initial: true`, brand never checked)
 * is free; every other on-demand check uses the daily "visibility" quota.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to run a check." }, { status: 401, headers: NO_STORE });
  const brand = await getBrandForUser(user.uid);
  if (!brand) return NextResponse.json({ error: "Create a brand first." }, { status: 404, headers: NO_STORE });

  const body = (await req.json().catch(() => ({}))) as { initial?: unknown };
  if ((brand.runLockUntil ?? 0) > Date.now()) {
    return NextResponse.json({ status: "locked", error: "A check is already running for this brand." }, { status: 409, headers: NO_STORE });
  }

  const isInitial = body.initial === true && !brand.lastCheckedAt;
  let quota: unknown = null;
  if (!isInitial) {
    const usage = await consumeQuota(req, "visibility", await getViewer());
    if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429, headers: NO_STORE });
    quota = usage.quota;
  }

  const outcome = await runBrandCheck(brand, { source: isInitial ? "initial" : "manual", concurrency: 8, deadline: Date.now() + BUDGET_MS });
  revalidatePath("/app/visibility");

  const status =
    outcome.status === "completed" || outcome.status === "partial"
      ? 200
      : outcome.status === "locked"
        ? 409
        : outcome.status === "no-prompts"
          ? 400
          : outcome.status === "no-engines"
            ? 503
            : 502;
  const error =
    outcome.status === "locked"
      ? "A check is already running for this brand."
      : outcome.status === "no-prompts"
        ? "Add or resume at least one prompt first."
        : outcome.status === "failed" || outcome.status === "no-engines"
          ? `The AI engines didn't answer: ${outcome.errors[0] ?? "unknown error"}`
          : undefined;

  return NextResponse.json(
    {
      status: outcome.status,
      error,
      quota,
      date: outcome.date,
      answers: outcome.answers,
      failed: outcome.failed,
      skipped: outcome.skipped,
      engines: outcome.engines,
      errors: outcome.errors,
      elapsedMs: outcome.elapsedMs,
      rollup: outcome.rollup ?? null,
    },
    { status, headers: NO_STORE },
  );
}
