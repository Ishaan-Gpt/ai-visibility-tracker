import { NextRequest, NextResponse } from "next/server";
import { ndjsonResponse } from "@/lib/crawl";
import { CRAWL_PAGE_LIMITS } from "@/lib/limits";
import { SafeFetchError } from "@/lib/net/safeFetch";
import { auditSite } from "@/lib/tools/pageAudit/site";
import { consumeQuota, getViewer, refundQuota } from "@/lib/usage";

export const maxDuration = 300;

/** Crawl budget per tier: enough wall clock for the page cap at a polite concurrency, inside the 300 s limit. */
const BUDGET_MS = { anon: 60_000, free: 120_000, pro: 240_000 } as const;

/** Whole-site audit, streamed as NDJSON: progress events, then one result (or error) line. Metered as a site crawl. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown; maxPages?: unknown };
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (!url) return NextResponse.json({ error: "Enter a website, e.g. example.com." }, { status: 400 });

  const viewer = await getViewer();
  const usage = await consumeQuota(req, "crawl", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  const cap = CRAWL_PAGE_LIMITS[viewer.tier];
  const requested = Number(body.maxPages);
  const maxPages = Number.isFinite(requested) && requested > 0 ? Math.min(cap, Math.floor(requested)) : cap;

  return ndjsonResponse(
    async (progress, signal) => {
      try {
        return await auditSite(url, { maxPages, timeBudgetMs: BUDGET_MS[viewer.tier], signal, onProgress: progress });
      } catch (err) {
        await refundQuota(req, "crawl", viewer, usage.quota);
        throw err;
      }
    },
    {
      signal: req.signal,
      extra: { quota: usage.quota, cap },
      onError: (err) => {
        if (err instanceof SafeFetchError) return err.message;
        const code = (err as { code?: string })?.code;
        if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "We couldn't find that domain. Check the spelling.";
        console.error("[page-audit/site]", err);
        return "Something went wrong auditing that site.";
      },
    },
  );
}
