import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { addKeywords, getOwnedProject, limitsFor, removeKeywords, setKeywordTags, tierOf } from "@/lib/rank-tracker/store";

const NO_STORE = { "Cache-Control": "private, no-store" };
const MAX_PER_REQUEST = 500;

async function owned(ctx: RouteContext<"/api/rank-tracker/projects/[id]/keywords">) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE }) };
  const { id } = await ctx.params;
  const project = await getOwnedProject(user.uid, id);
  if (!project) return { error: NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE }) };
  return { user, project };
}

const strings = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max) : []);

/**
 * Add keywords. Body: { keywords: string[] | {keyword, volume?}[], tags?: string[] } or { text: "one per line" }.
 * New keywords are checked at the next scheduler tick (or now, with an on-demand check).
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]/keywords">) {
  const o = await owned(ctx);
  if ("error" in o) return o.error;
  const body = (await req.json().catch(() => null)) as { keywords?: unknown; text?: unknown; tags?: unknown } | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const tags = strings(body.tags, 8);
  const items: { keyword: string; tags: string[]; volume?: number | null }[] = [];
  if (typeof body.text === "string") for (const line of body.text.split(/[\n,;\t]+/)) items.push({ keyword: line, tags });
  if (Array.isArray(body.keywords)) {
    for (const k of body.keywords.slice(0, MAX_PER_REQUEST)) {
      if (typeof k === "string") items.push({ keyword: k, tags });
      else if (k && typeof k === "object" && typeof (k as { keyword?: unknown }).keyword === "string") {
        const vol = (k as { volume?: unknown }).volume;
        items.push({ keyword: (k as { keyword: string }).keyword, tags, volume: typeof vol === "number" && Number.isFinite(vol) && vol >= 0 ? Math.round(vol) : null });
      }
    }
  }
  if (!items.length) return NextResponse.json({ error: "Add at least one keyword." }, { status: 400, headers: NO_STORE });
  if (items.length > MAX_PER_REQUEST) return NextResponse.json({ error: `Add up to ${MAX_PER_REQUEST} keywords at a time.` }, { status: 400, headers: NO_STORE });

  const tier = await tierOf(o.user.uid);
  const result = await addKeywords(o.project, items, tier);
  const limit = limitsFor(tier).keywords;
  const message = [
    result.added.length ? `Added ${result.added.length} keyword${result.added.length === 1 ? "" : "s"}.` : "",
    result.duplicates.length ? `${result.duplicates.length} already tracked.` : "",
    result.invalid.length ? `${result.invalid.length} skipped (${result.invalid[0].reason}${result.invalid.length > 1 ? ", …" : ""}).` : "",
    result.overLimit.length ? `${result.overLimit.length} over your plan's ${limit}-keyword limit${tier === "free" ? " (Pro tracks more)" : ""}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return NextResponse.json({ ...result, message }, { status: result.added.length ? 201 : 200, headers: NO_STORE });
}

/** Tag edits. Body: { ids: string[], add?: string[], remove?: string[] } */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]/keywords">) {
  const o = await owned(ctx);
  if ("error" in o) return o.error;
  const body = (await req.json().catch(() => null)) as { ids?: unknown; add?: unknown; remove?: unknown } | null;
  const ids = strings(body?.ids, MAX_PER_REQUEST);
  if (!ids.length) return NextResponse.json({ error: "No keywords selected." }, { status: 400, headers: NO_STORE });
  const updated = await setKeywordTags(o.project, ids, strings(body?.add, 8), strings(body?.remove, 8));
  return NextResponse.json({ updated }, { headers: NO_STORE });
}

/** Remove keywords and their history. Body: { ids: string[] } */
export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/rank-tracker/projects/[id]/keywords">) {
  const o = await owned(ctx);
  if ("error" in o) return o.error;
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = strings(body?.ids, MAX_PER_REQUEST);
  if (!ids.length) return NextResponse.json({ error: "No keywords selected." }, { status: 400, headers: NO_STORE });
  const removed = await removeKeywords(o.project, ids);
  return NextResponse.json({ removed }, { headers: NO_STORE });
}
