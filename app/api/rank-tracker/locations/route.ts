import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dfsConfigured } from "@/lib/dataforseo/client";
import { locationsFor } from "@/lib/dataforseo/labs";
import { COUNTRIES } from "@/lib/keywords/types";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** City / region search inside one country (DataForSEO's free locations list, cached per instance). Signed-in only. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const country = COUNTRIES.find((c) => c.code === req.nextUrl.searchParams.get("country"));
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  if (!country) return NextResponse.json({ error: "Pick a country." }, { status: 400, headers: NO_STORE });
  if (q.length < 2) return NextResponse.json({ locations: [] }, { headers: NO_STORE });
  if (!dfsConfigured()) return NextResponse.json({ locations: [], error: "Location search isn't configured." }, { headers: NO_STORE });
  try {
    const list = await locationsFor(country.code);
    const starts = list.filter((l) => l.name.toLowerCase().startsWith(q));
    const contains = list.filter((l) => !l.name.toLowerCase().startsWith(q) && l.name.toLowerCase().includes(q));
    return NextResponse.json({ locations: [...starts, ...contains].slice(0, 12) }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ locations: [], error: err instanceof Error ? err.message : "Location search failed." }, { status: 502, headers: NO_STORE });
  }
}
