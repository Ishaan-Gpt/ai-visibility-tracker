import { NextRequest, NextResponse } from "next/server";
import { ndjsonResponse } from "@/lib/crawl";
import { CRAWL_PAGE_LIMITS } from "@/lib/limits";
import { SafeFetchError } from "@/lib/net/safeFetch";
import { auditSite } from "@/lib/tools/pageAudit/site";
import type { SiteAuditMode } from "@/lib/tools/pageAudit/siteTypes";
import { consumeQuota, getViewer, refundQuota } from "@/lib/usage";

export const maxDuration = 300;

/** Crawl budget per tier: enough wall clock for the page cap at a polite concurrency, inside the 300 s limit. */
const BUDGET_MS = { anon: 60_000, free: 120_000, pro: 240_000 } as const;

/** Whole-site audit, streamed as NDJSON: progress events, then one result (or error) line. Metered as a site crawl. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown; maxPages?: unknown; mode?: unknown; scope?: unknown; urls?: unknown };
  const mode: SiteAuditMode = body.mode === "folder" || body.mode === "sitemap" || body.mode === "list" ? body.mode : "site";
  const scope = typeof body.scope === "string" ? body.scope.trim().slice(0, 500) : undefined;
  const urls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u) => u.trim().slice(0, 500)) : [];
  // List mode starts from the first URL; every other mode from the site/URL field.
  const url = mode === "list" ? (urls[0] ?? "") : typeof body.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (!url) return NextResponse.json({ error: mode === "list" ? "Paste at least one page URL." : "Enter a website, e.g. example.com." }, { status: 400 });

  const viewer = await getViewer();
  const cap = CRAWL_PAGE_LIMITS[viewer.tier];
  // Checked before metering, so an oversized list doesn't cost a run.
  if (mode === "list" && urls.length > cap) {
    return NextResponse.json({ error: `Your plan audits up to ${cap} URLs per run; you pasted ${urls.length}.` }, { status: 400 });
  }
  const usage = await consumeQuota(req, "crawl", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  const requested = Number(body.maxPages);
  const maxPages = Number.isFinite(requested) && requested > 0 ? Math.min(cap, Math.floor(requested)) : cap;

  return ndjsonResponse(
    async (progress, signal) => {
      try {
        return await auditSite(url, { maxPages, timeBudgetMs: BUDGET_MS[viewer.tier], signal, onProgress: progress, mode, scope, urls: urls.slice(1) });
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
