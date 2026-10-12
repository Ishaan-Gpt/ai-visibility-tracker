import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { normalizeUrl, SafeFetchError } from "@/lib/net/safeFetch";
import { checkSitemap } from "@/lib/crawl/check";
import { ndjsonResponse } from "@/lib/crawl/stream";

export const maxDuration = 60;

const SAMPLE_BY_TIER = { anon: 50, free: 100, pro: 250 } as const;

/**
 * POST { url } (a domain or a sitemap URL) → NDJSON progress, then {type:"result", data: SitemapCheckReport}.
 * Validates every sitemap file against the protocol and live-checks a sample of the listed URLs.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 1000) : "";
  if (!url) return NextResponse.json({ error: "Enter a domain or a sitemap URL." }, { status: 400 });
  try {
    normalizeUrl(url);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "That doesn't look like a valid URL." }, { status: 400 });
  }

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "crawl", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  return ndjsonResponse(
    (onProgress, signal) => checkSitemap({ url, sampleSize: SAMPLE_BY_TIER[viewer.tier], timeBudgetMs: 45_000, signal, onProgress }),
    {
      signal: req.signal,
      extra: { quota: usage.quota, sample: SAMPLE_BY_TIER[viewer.tier] },
      onError: (err) => {
        if (err instanceof SafeFetchError) return err.message;
        console.error("[sitemap-check]", err);
        return "Something went wrong checking that sitemap.";
      },
    },
  );
}
