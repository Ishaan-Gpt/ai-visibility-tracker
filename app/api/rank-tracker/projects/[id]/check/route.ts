import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { consumeQuota, getViewer, refundQuota } from "@/lib/usage";
import { dfsConfigured } from "@/lib/dataforseo/client";
import { guardStatus } from "@/lib/dataforseo/guard";
import { postChecks } from "@/lib/rank-tracker/engine";
import { canPost, withinPlan } from "@/lib/rank-tracker/schedule";
import { getOwnedProject, limitsFor, listKeywords, tierOf } from "@/lib/rank-tracker/store";
import { adminDb } from "@/lib/firebase/admin";

export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * On-demand check of every keyword in a project that hasn't been checked today and has no check in flight.
 * Uses one "rank-check" quota run (refunded when nothing could be posted). Results arrive as DataForSEO
 * finishes the Standard-queue tasks; the dashboard polls for them.
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]/check">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const { id } = await ctx.params;
  const project = await getOwnedProject(user.uid, id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE });
  if (!dfsConfigured()) return NextResponse.json({ error: "Rank checks aren't configured on this server yet." }, { status: 503, headers: NO_STORE });

  const guard = await guardStatus();
  if (guard.paused) return NextResponse.json({ error: `Checks are paused: ${guard.reason}`, paused: true }, { status: 503, headers: NO_STORE });

  const tier = await tierOf(user.uid);
  const now = Date.now();
  const keywords = await listKeywords(project.id);
  // Plan limit across the account (after a downgrade only the oldest keywords keep being checked).
  const all = await adminDb().collection("rtKeywords").where("ownerUid", "==", user.uid).select("createdAt").get();
  const allowed = withinPlan(all.docs.map((d) => ({ id: d.id, createdAt: (d.data().createdAt as number) ?? 0 })), limitsFor(tier).keywords);
  const postable = keywords.filter((k) => allowed.has(k.id) && canPost({ nextDueAt: k.nextDueAt ?? 0, pendingTaskId: k.pendingTaskId, pendingSince: k.pendingSince, lastDate: k.last?.date ?? null }, now, true));
  if (!postable.length) {
    const inFlight = keywords.some((k) => k.pendingTaskId);
    return NextResponse.json(
      { error: keywords.length ? (inFlight ? "A check is already in progress." : "Every keyword was already checked today.") : "Add keywords first.", posted: 0 },
      { status: 409, headers: NO_STORE },
    );
  }

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "rank-check", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429, headers: NO_STORE });

  const out = await postChecks(postable.map((kw) => ({ kw, project })), { manual: true, now });
  const quota = out.posted ? usage.quota : await refundQuota(req, "rank-check", viewer, usage.quota);
  if (!out.posted) {
    return NextResponse.json({ error: out.paused ? `Checks are paused: ${out.paused}` : out.errors[0] ? `The check couldn't start: ${out.errors[0]}` : "Nothing to check right now.", ...out, quota }, { status: out.paused ? 503 : 502, headers: NO_STORE });
  }
  return NextResponse.json({ ...out, quota }, { headers: NO_STORE });
}
