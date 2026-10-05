import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getViewer } from "@/lib/usage";
import { HISTORY_LIMITS, HISTORY_TOOLS, type HistoryItem, type HistoryTool } from "@/lib/history";

const MAX_BYTES = 400_000;

function unauthorized() {
  return NextResponse.json({ error: "Sign in to save and view reports." }, { status: 401 });
}

async function listFor(uid: string): Promise<HistoryItem[]> {
  // Sorted in memory so no composite index is required.
  const snap = await adminDb().collection("reports").where("ownerUid", "==", uid).select("tool", "title", "subtitle", "score", "aiScore", "createdAt").get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryItem, "id">) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.uid) return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const snap = await adminDb().collection("reports").doc(id).get();
    const data = snap.data();
    if (!snap.exists || data?.ownerUid !== viewer.uid) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json({ id, tool: data.tool, title: data.title, createdAt: data.createdAt, report: JSON.parse(data.payload as string) });
  }

  const items = await listFor(viewer.uid);
  return NextResponse.json({ items, limit: HISTORY_LIMITS[viewer.tier === "pro" ? "pro" : "free"], tier: viewer.tier });
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.uid) return unauthorized();

  const body = (await req.json().catch(() => null)) as {
    tool?: unknown;
    title?: unknown;
    subtitle?: unknown;
    score?: unknown;
    aiScore?: unknown;
    report?: unknown;
  } | null;
  if (!body || !HISTORY_TOOLS.includes(body.tool as HistoryTool) || typeof body.report !== "object" || !body.report) {
    return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  }
  const payload = JSON.stringify(body.report);
  if (payload.length > MAX_BYTES) return NextResponse.json({ error: "This report is too large to save." }, { status: 413 });

  const limit = HISTORY_LIMITS[viewer.tier === "pro" ? "pro" : "free"];
  const existing = await adminDb().collection("reports").where("ownerUid", "==", viewer.uid).count().get();
  if (existing.data().count >= limit) {
    return NextResponse.json(
      {
        error:
          viewer.tier === "pro"
            ? `You have ${limit} saved reports. Delete a few to save more.`
            : `Free accounts keep ${limit} reports. Delete one, or go Pro for full history.`,
      },
      { status: 409 },
    );
  }

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);
  const ref = await adminDb().collection("reports").add({
    ownerUid: viewer.uid,
    tool: body.tool,
    title: String(body.title ?? "Untitled report").slice(0, 160),
    subtitle: String(body.subtitle ?? "").slice(0, 300),
    score: num(body.score),
    aiScore: num(body.aiScore),
    payload,
    createdAt: Date.now(),
  });
  return NextResponse.json({ id: ref.id });
}

export async function DELETE(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.uid) return unauthorized();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const ref = adminDb().collection("reports").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.ownerUid !== viewer.uid) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  await ref.delete();
  return NextResponse.json({ ok: true });
}
