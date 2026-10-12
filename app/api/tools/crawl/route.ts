import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { CRAWL_PAGE_LIMITS } from "@/lib/limits";
import { normalizeUrl, SafeFetchError } from "@/lib/net/safeFetch";
import { crawlSite } from "@/lib/crawl/crawler";
import { ndjsonResponse } from "@/lib/crawl/stream";

/** Crawl budget is 50 s; the extra headroom covers robots/sitemap reads finishing and the final payload. */
export const maxDuration = 60;

const CRAWL_BUDGET_MS = 50_000;

function crawlError(err: unknown): string {
  if (err instanceof SafeFetchError) return err.message;
  console.error("[crawl]", err);
  return "Something went wrong crawling that site.";
}

/**
 * POST { url, maxPages?, includeSubdomains?, excludePatterns? } → NDJSON stream of
 * {type:"progress"} lines, then one {type:"result", data: CrawlResult} or {type:"error"}.
 * robots.txt is always respected for our token; there is deliberately no switch to turn that off.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    url?: unknown;
    maxPages?: unknown;
    includeSubdomains?: unknown;
    excludePatterns?: unknown;
  };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (!url) return NextResponse.json({ error: "Enter your site's domain." }, { status: 400 });
  try {
    normalizeUrl(url);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "That doesn't look like a valid URL." }, { status: 400 });
  }
  const excludePatterns = Array.isArray(body.excludePatterns)
    ? body.excludePatterns.filter((p): p is string => typeof p === "string").map((p) => p.trim().slice(0, 200)).filter(Boolean).slice(0, 30)
    : [];

  const viewer = await getViewer();
  const tierCap = CRAWL_PAGE_LIMITS[viewer.tier];
  const requested = Number(body.maxPages);
  const maxPages = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), tierCap) : tierCap;

  const usage = await consumeQuota(req, "crawl", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  return ndjsonResponse(
    (onProgress, signal) =>
      crawlSite(
        { url, maxPages, includeSubdomains: body.includeSubdomains === true, excludePatterns, timeBudgetMs: CRAWL_BUDGET_MS, concurrency: 8, signal },
        { onProgress },
      ),
    { signal: req.signal, extra: { quota: usage.quota, cap: maxPages, tierCap, tier: viewer.tier }, onError: crawlError },
  );
}
