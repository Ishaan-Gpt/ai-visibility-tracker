import { after, NextRequest, NextResponse } from "next/server";
import { collectById } from "@/lib/rank-tracker/engine";
import { verifyTag } from "@/lib/rank-tracker/notify";

export const maxDuration = 60;

/**
 * DataForSEO pingback (GET ?id=$id&tag=$tag&sig=...) sent when a Standard-queue task finishes. Only active when
 * RANK_TRACKER_PINGBACK_BASE_URL is set. Answers immediately (DataForSEO waits at most 10 s) and collects after
 * the response; collectById ignores ids that aren't in rtTasks. The cron sweep remains the fallback.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const tag = req.nextUrl.searchParams.get("tag") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!/^[\w-]{8,80}$/.test(id) || !tag.startsWith("rt:") || !verifyTag(tag, sig)) return NextResponse.json({ ok: false }, { status: 403 });
  after(() => collectById(id).catch((err) => console.warn("[rank-tracker] pingback collect", err instanceof Error ? err.message : err)));
  return NextResponse.json({ ok: true });
}
