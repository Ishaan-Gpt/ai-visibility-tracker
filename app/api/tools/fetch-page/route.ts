import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { SafeFetchError } from "@/lib/net/safeFetch";
import { fetchAndExtract } from "@/lib/tools/pageExtract/fetchPage";

export const maxDuration = 30;

/**
 * "Load from URL" for the browser tools (Schema validator, Meta & SERP preview, Keyword density).
 * Body: { url: string, probeImages?: boolean }. Returns a PageExtract plus the caller's quota.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown; probeImages?: unknown };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 2000) : "";
  if (!url) return NextResponse.json({ error: "Enter a page URL." }, { status: 400 });

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "fetch-page", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  try {
    const page = await fetchAndExtract(url, { probeImages: body.probeImages === true });
    return NextResponse.json({ page, quota: usage.quota });
  } catch (err) {
    if (err instanceof SafeFetchError) return NextResponse.json({ error: err.message, quota: usage.quota }, { status: 400 });
    const code = (err as { code?: string })?.code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return NextResponse.json({ error: "We couldn't find that domain. Check the spelling.", quota: usage.quota }, { status: 400 });
    if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT") return NextResponse.json({ error: "That site didn't respond. It may be down or blocking automated requests.", quota: usage.quota }, { status: 502 });
    console.error("[fetch-page]", err);
    return NextResponse.json({ error: "Something went wrong loading that page.", quota: usage.quota }, { status: 500 });
  }
}
