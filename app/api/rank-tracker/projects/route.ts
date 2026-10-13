import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/session";
import { parseProjectInput } from "@/lib/rank-tracker/input";
import { C, limitsFor, listProjects, tierOf } from "@/lib/rank-tracker/store";
import type { RtProject } from "@/lib/rank-tracker/types";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** The signed-in user's projects (also used by the "Track" buttons in other tools). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use the Rank Tracker." }, { status: 401, headers: NO_STORE });
  const projects = await listProjects(user.uid);
  return NextResponse.json(
    { projects: projects.map((p) => ({ id: p.id, name: p.name, domain: p.domain, country: p.country, language: p.language, locationName: p.locationName, device: p.device })) },
    { headers: NO_STORE },
  );
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use the Rank Tracker." }, { status: 401, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const tier = await tierOf(user.uid);
  const limits = limitsFor(tier);
  const existing = await listProjects(user.uid);
  if (existing.length >= limits.projects) {
    return NextResponse.json({ error: `Your plan includes ${limits.projects} project${limits.projects === 1 ? "" : "s"}.${tier === "free" ? " Go Pro for more." : ""}` }, { status: 403, headers: NO_STORE });
  }
  const parsed = await parseProjectInput(body, limits.competitors);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE });
  const v = parsed.value;
  if (existing.some((p) => p.domain === v.domain && p.locationCode === v.locationCode && p.device === v.device && p.language === v.language)) {
    return NextResponse.json({ error: "You already track this domain for that location and device." }, { status: 409, headers: NO_STORE });
  }

  const ref = adminDb().collection(C.projects).doc();
  const now = Date.now();
  const doc: Omit<RtProject, "id"> = { ownerUid: user.uid, ...v, createdAt: now, updatedAt: now, lastPostedAt: null, lastCollectedAt: null, pollAt: null };
  await ref.set(doc);
  return NextResponse.json({ project: { id: ref.id, ...doc } }, { status: 201, headers: NO_STORE });
}
