import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { SafeFetchError } from "@/lib/net/safeFetch";
import { auditPage } from "@/lib/tools/pageAudit/audit";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (!url) return NextResponse.json({ error: "Enter a page URL." }, { status: 400 });

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "page-audit", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  try {
    return NextResponse.json({ ...(await auditPage(url)), quota: usage.quota });
  } catch (err) {
    if (err instanceof SafeFetchError) return NextResponse.json({ error: err.message, quota: usage.quota }, { status: 400 });
    const code = (err as { code?: string })?.code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return NextResponse.json({ error: "We couldn't find that domain. Check the spelling.", quota: usage.quota }, { status: 400 });
    if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT") return NextResponse.json({ error: "That site didn't respond. It may be down or blocking automated requests.", quota: usage.quota }, { status: 502 });
    console.error("[page-audit]", err);
    return NextResponse.json({ error: "Something went wrong auditing that page.", quota: usage.quota }, { status: 500 });
  }
}
