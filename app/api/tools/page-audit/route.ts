import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { consumeDaily } from "@/lib/usage";
import { SafeFetchError } from "@/lib/net/safeFetch";
import { auditPage } from "@/lib/tools/pageAudit/audit";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (!url) return NextResponse.json({ error: "Enter a page URL." }, { status: 400 });

  const usage = await consumeDaily(user.uid, "page-audit", { free: 15, paid: 200 });
  if (!usage.ok) return NextResponse.json({ error: usage.message }, { status: 429 });

  try {
    return NextResponse.json(await auditPage(url));
  } catch (err) {
    if (err instanceof SafeFetchError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[page-audit]", err);
    return NextResponse.json({ error: "Something went wrong auditing that page." }, { status: 500 });
  }
}
