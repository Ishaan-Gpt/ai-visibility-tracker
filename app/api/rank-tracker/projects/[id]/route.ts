import { after, NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/session";
import { collectProject } from "@/lib/rank-tracker/engine";
import { parseProjectInput } from "@/lib/rank-tracker/input";
import { C, deleteProject, getOwnedProject, limitsFor, tierOf } from "@/lib/rank-tracker/store";
import { dashboardData } from "@/lib/rank-tracker/view";

export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "private, no-store" };
/** The dashboard polls while checks are in flight; collect for it at most this often. */
const POLL_COLLECT_EVERY_MS = 12_000;

/**
 * Dashboard data for one project. While checks are in flight it also collects finished tasks for this project
 * (throttled), so results appear within seconds of DataForSEO finishing instead of at the next cron tick.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const { id } = await ctx.params;
  const project = await getOwnedProject(user.uid, id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE });

  if (req.nextUrl.searchParams.get("collect") === "1" && (project.pollAt ?? 0) < Date.now() - POLL_COLLECT_EVERY_MS) {
    const ref = adminDb().collection(C.projects).doc(project.id);
    const claimed = await adminDb()
      .runTransaction(async (tx) => {
        const cur = (await tx.get(ref)).data()?.pollAt ?? 0;
        if (cur > Date.now() - POLL_COLLECT_EVERY_MS) return false;
        tx.update(ref, { pollAt: Date.now() });
        return true;
      })
      .catch(() => false);
    if (claimed) await collectProject(project.id, Date.now() + 25_000).catch((err) => console.warn("[rank-tracker] poll collect", err instanceof Error ? err.message : err));
  }

  const data = await dashboardData(user.uid, await tierOf(user.uid), project.id);
  return NextResponse.json(data, { headers: NO_STORE });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const { id } = await ctx.params;
  const project = await getOwnedProject(user.uid, id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const tier = await tierOf(user.uid);
  // Fields not sent keep their current values; keep the existing city unless a new one (or `city: null`) is sent.
  const merged: Record<string, unknown> = {
    name: project.name,
    domain: project.domain,
    includeSubdomains: project.includeSubdomains,
    country: project.country,
    language: project.language,
    device: project.device,
    competitors: project.competitors,
    emailAlerts: project.emailAlerts !== false,
    alertThreshold: project.alertThreshold ?? 5,
    ...body,
  };
  const parsed = await parseProjectInput(merged, limitsFor(tier).competitors);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE });
  const v = parsed.value;
  const keepCity = !("city" in body) && !("country" in body) && project.locationCode !== undefined;
  const patch = {
    ...v,
    ...(keepCity ? { locationCode: project.locationCode, locationName: project.locationName } : {}),
    updatedAt: Date.now(),
  };
  // Changing what is measured (domain, market, device) makes old history incomparable: the owner is told in the UI.
  await adminDb().collection(C.projects).doc(project.id).update(patch);
  return NextResponse.json({ project: { ...project, ...patch } }, { headers: NO_STORE });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const { id } = await ctx.params;
  const project = await getOwnedProject(user.uid, id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE });
  // Hide it immediately, then clean up its keywords, snapshots, alerts and tasks after responding.
  await adminDb().collection(C.projects).doc(project.id).update({ ownerUid: `deleted:${user.uid}` });
  after(() => deleteProject(project).catch((err) => console.error("[rank-tracker] delete project", err)));
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
