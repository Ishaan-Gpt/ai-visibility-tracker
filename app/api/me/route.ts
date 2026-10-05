import { NextResponse } from "next/server";
import { getViewer } from "@/lib/usage";

/** Who is looking at this (otherwise static) page. Lets tool pages stay statically rendered. */
export async function GET() {
  const v = await getViewer().catch(() => ({ uid: null, email: null, tier: "anon" as const }));
  return NextResponse.json(
    { signedIn: !!v.uid, email: v.email, tier: v.tier },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
