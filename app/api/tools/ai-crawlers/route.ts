import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { SafeFetchError } from "@/lib/net/safeFetch";
import { checkAiCrawlers } from "@/lib/tools/aiCrawlers/check";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 300) : "";
  if (!url) return NextResponse.json({ error: "Enter a domain, e.g. example.com." }, { status: 400 });

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "ai-crawlers", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  try {
    return NextResponse.json({ ...(await checkAiCrawlers(url)), quota: usage.quota });
  } catch (err) {
    if (err instanceof SafeFetchError) return NextResponse.json({ error: err.message, quota: usage.quota }, { status: 400 });
    const code = (err as { code?: string })?.code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return NextResponse.json({ error: "We couldn't find that domain. Check the spelling.", quota: usage.quota }, { status: 400 });
    console.error("[ai-crawlers]", err);
    return NextResponse.json({ error: "Something went wrong checking that site.", quota: usage.quota }, { status: 500 });
  }
}
