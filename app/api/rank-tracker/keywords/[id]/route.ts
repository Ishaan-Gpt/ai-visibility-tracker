import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getOwnedKeyword, listSnapshots } from "@/lib/rank-tracker/store";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Full history of one keyword (every daily snapshot, newest first) for the detail view. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/rank-tracker/keywords/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const { id } = await ctx.params;
  const kw = await getOwnedKeyword(user.uid, id);
  if (!kw) return NextResponse.json({ error: "Keyword not found." }, { status: 404, headers: NO_STORE });
  const snapshots = await listSnapshots(kw.id);
  return NextResponse.json({ keyword: kw, snapshots }, { headers: NO_STORE });
}
