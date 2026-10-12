import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { normalizeUrl, safeFetch, SafeFetchError } from "@/lib/net/safeFetch";
import { ROBOTS_MAX_BYTES, looksLikeHtml } from "@/lib/tools/aiCrawlers/robots";

export const maxDuration = 20;

type Fetched = { status: number | null; text: string; finalUrl: string | null; error?: string };

async function grab(url: string, maxBytes: number): Promise<Fetched> {
  try {
    const r = await safeFetch(url, { maxBytes, timeoutMs: 9000, maxRedirects: 5, headers: { accept: "text/plain,text/markdown;q=0.9,*/*;q=0.5" } });
    const ok = r.status >= 200 && r.status < 300 && !looksLikeHtml(r.body);
    return { status: r.status, text: ok ? r.body : "", finalUrl: r.finalUrl };
  } catch (e) {
    if (e instanceof SafeFetchError && /not allowed/i.test(e.message)) throw e;
    return { status: null, text: "", finalUrl: null, error: e instanceof Error ? e.message : "Fetch failed." };
  }
}

/** Fetches a site's current robots.txt and llms.txt so the generator can merge into them. Metered as an AI crawler check. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const raw = typeof body.url === "string" ? body.url.trim().slice(0, 300) : "";
  if (!raw) return NextResponse.json({ error: "Enter your domain first." }, { status: 400 });

  let origin: string;
  try {
    const u = normalizeUrl(raw);
    origin = `${u.protocol}//${u.host}`;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid domain." }, { status: 400 });
  }

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "ai-crawlers", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  try {
    const [robots, llms] = await Promise.all([grab(`${origin}/robots.txt`, ROBOTS_MAX_BYTES), grab(`${origin}/llms.txt`, 500_000)]);
    if (robots.status === null && llms.status === null && /ENOTFOUND|EAI_AGAIN/.test(robots.error ?? "")) {
      return NextResponse.json({ error: "We couldn't find that domain. Check the spelling.", quota: usage.quota }, { status: 400 });
    }
    return NextResponse.json({ origin, robots, llms, quota: usage.quota });
  } catch (err) {
    if (err instanceof SafeFetchError) return NextResponse.json({ error: err.message, quota: usage.quota }, { status: 400 });
    console.error("[ai-crawlers/import]", err);
    return NextResponse.json({ error: "Something went wrong fetching that site.", quota: usage.quota }, { status: 500 });
  }
}
