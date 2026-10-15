import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { consumeQuota, getViewer, refundQuota } from "@/lib/usage";
import { BACKLINK_ROWS } from "@/lib/limits";
import { isLive } from "@/lib/features";
import { cleanDomainInput } from "@/lib/visibility/domains";
import { DfsError } from "@/lib/dataforseo/client";
import { BACKLINK_CALLS, backlinkProfile } from "@/lib/dataforseo/backlinks";
import { noteProviderError, reserveSpend, settleSpend } from "@/lib/dataforseo/guard";
import { backlinksCost } from "@/lib/dataforseo/prices";
import type { BacklinkScope, BacklinksResult } from "@/lib/backlinks/types";

export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "private, no-store" };
const CACHE = "blCache";
const TTL_MS = 3 * 86_400_000;
const VERSION = 1;

/**
 * "example.com" is a domain lookup. Anything with a path ("example.com/blog/post") is a page lookup, sent to
 * DataForSEO as an absolute URL.
 */
function parseTarget(raw: string): { target: string; scope: BacklinkScope } | null {
  const input = raw.trim();
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = cleanDomainInput(url.hostname);
  if (!host) return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (!path && !url.search) return { target: host, scope: "domain" };
  return { target: `${url.protocol}//${url.hostname}${url.pathname}${url.search}`, scope: "page" };
}

const cacheId = (target: string, sub: boolean, rows: number) => crypto.createHash("sha256").update(JSON.stringify([VERSION, target, sub, rows])).digest("hex").slice(0, 40);

/**
 * Backlink profile of a domain or page: summary, 12-month trend, referring domains, backlinks, anchors and lost
 * domains. Signed-in only, cached for 3 days (a cached answer is free and doesn't use a lookup).
 */
export async function POST(req: NextRequest) {
  if (!isLive("backlinks")) return NextResponse.json({ error: "Backlinks are coming soon." }, { status: 503, headers: NO_STORE });
  const viewer = await getViewer();
  if (!viewer.uid || viewer.tier === "anon") return NextResponse.json({ error: "Sign in to look up backlinks." }, { status: 401, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { target?: unknown; includeSubdomains?: unknown } | null;
  const parsed = parseTarget(typeof body?.target === "string" ? body.target : "");
  if (!parsed) return NextResponse.json({ error: "Enter a domain like example.com or a full page URL." }, { status: 400, headers: NO_STORE });
  const sub = parsed.scope === "domain" && body?.includeSubdomains !== false;
  const rows = BACKLINK_ROWS[viewer.tier];

  const ref = adminDb().collection(CACHE).doc(cacheId(parsed.target, sub, rows));
  try {
    const d = (await ref.get()).data() as { payload?: string; createdAt?: number; expiresAt?: { toMillis?: () => number } } | undefined;
    if (d?.payload && (d.expiresAt?.toMillis?.() ?? 0) > Date.now()) {
      const cached = JSON.parse(d.payload) as BacklinksResult;
      return NextResponse.json({ ...cached, cachedAt: d.createdAt ?? cached.fetchedAt }, { headers: NO_STORE });
    }
  } catch (err) {
    console.warn("[backlinks] cache read skipped", err instanceof Error ? err.message : err);
  }

  // Worst case: every list returns a full page of rows.
  const estimate = backlinksCost(1) + backlinksCost(12) + backlinksCost(rows) * 2 + backlinksCost(Math.min(rows, 500)) + backlinksCost(Math.min(rows, 200));
  const budget = await reserveSpend("backlinks", estimate, 1);
  if (!budget.granted) return NextResponse.json({ error: `Lookups are paused: ${budget.reason}`, paused: true }, { status: 503, headers: NO_STORE });

  const usage = await consumeQuota(req, "backlinks", viewer);
  if (!usage.ok) {
    await settleSpend("backlinks", budget.reserved, 0);
    return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429, headers: NO_STORE });
  }

  let raw: Awaited<ReturnType<typeof backlinkProfile>>;
  try {
    raw = await backlinkProfile(parsed.target, parsed.scope, sub, rows);
  } catch (err) {
    // Some of the parallel calls may have been charged before the failure: keep the reservation as spent.
    await settleSpend("backlinks", budget.reserved, budget.reserved);
    await noteProviderError(err);
    const quota = await refundQuota(req, "backlinks", viewer, usage.quota);
    const billing = err instanceof DfsError && err.isBilling;
    return NextResponse.json(
      { error: billing ? "Backlink data is paused while the data provider account is topped up." : `The backlink index didn't answer: ${err instanceof Error ? err.message : "unknown error"}`, quota },
      { status: 502, headers: NO_STORE },
    );
  }
  await settleSpend("backlinks", budget.reserved, raw.cost);

  const fetchedAt = Date.now();
  const result: BacklinksResult = { ...raw.result, fetchedAt };
  try {
    const payload = JSON.stringify(result);
    // Firestore documents cap at 1 MiB; a Pro lookup with long URLs can exceed it, so oversize results aren't cached.
    if (payload.length < 900_000 && !result.partial.length) {
      await ref.set({ target: parsed.target, payload, createdAt: fetchedAt, expiresAt: new Date(fetchedAt + TTL_MS) });
    }
  } catch (err) {
    console.warn("[backlinks] cache write skipped", err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ...result, calls: BACKLINK_CALLS, quota: usage.quota }, { headers: NO_STORE });
}
