import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { consumeQuota, getViewer, refundQuota } from "@/lib/usage";
import { DOMAIN_ROWS } from "@/lib/limits";
import { COUNTRIES, LANGUAGES } from "@/lib/keywords/types";
import { cleanDomainInput } from "@/lib/visibility/domains";
import { dfsConfigured } from "@/lib/dataforseo/client";
import { noteProviderError, reserveSpend, settleSpend } from "@/lib/dataforseo/guard";
import { rankedKeywords } from "@/lib/dataforseo/labs";
import { labsCost } from "@/lib/dataforseo/prices";
import { parseRankedKeywords } from "@/lib/rank-tracker/labs-parse";
import { C } from "@/lib/rank-tracker/store";
import type { DomainKeywordsResult } from "@/lib/rank-tracker/types";

export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "private, no-store" };
const TTL_MS = 7 * 86_400_000;
const VERSION = 1;

const cacheId = (domain: string, location: number, language: string, limit: number) =>
  crypto.createHash("sha256").update(JSON.stringify([VERSION, domain, location, language, limit])).digest("hex").slice(0, 40);

/**
 * Keywords a domain ranks for, from the DataForSEO Labs database (estimates updated about weekly, not a live
 * Google check). Signed-in only. Cached for 7 days per domain + market + row limit; a cached answer is free.
 */
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.uid || viewer.tier === "anon") return NextResponse.json({ error: "Sign in to look up a domain's keywords." }, { status: 401, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { domain?: unknown; country?: unknown; language?: unknown; fresh?: unknown } | null;
  const domain = cleanDomainInput(typeof body?.domain === "string" ? body.domain : "");
  if (!domain) return NextResponse.json({ error: "Enter a valid domain, like example.com." }, { status: 400, headers: NO_STORE });
  const country = COUNTRIES.find((c) => c.code === body?.country) ?? COUNTRIES[0];
  const language = LANGUAGES.find((l) => l.code === body?.language)?.dfs ?? country.lang;
  const limit = DOMAIN_ROWS[viewer.tier];

  const id = cacheId(domain, country.dataforseoLocation, language, limit);
  const ref = adminDb().collection(C.domainCache).doc(id);
  try {
    const snap = await ref.get();
    const d = snap.data() as { payload?: string; createdAt?: number; expiresAt?: { toMillis?: () => number } } | undefined;
    if (d?.payload && (d.expiresAt?.toMillis?.() ?? 0) > Date.now()) {
      const cached = JSON.parse(d.payload) as DomainKeywordsResult;
      return NextResponse.json({ ...cached, cachedAt: d.createdAt ?? cached.fetchedAt }, { headers: NO_STORE });
    }
  } catch (err) {
    console.warn("[domain-keywords] cache read skipped", err instanceof Error ? err.message : err);
  }

  if (!dfsConfigured()) return NextResponse.json({ error: "Domain lookups aren't configured on this server yet." }, { status: 503, headers: NO_STORE });

  const estimate = labsCost(limit);
  const budget = await reserveSpend("labs", estimate, 1);
  if (!budget.granted) return NextResponse.json({ error: `Lookups are paused: ${budget.reason}`, paused: true }, { status: 503, headers: NO_STORE });

  const usage = await consumeQuota(req, "domain-keywords", viewer);
  if (!usage.ok) {
    await settleSpend("labs", budget.reserved, 0);
    return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429, headers: NO_STORE });
  }

  let raw: { result: unknown; cost: number };
  try {
    raw = await rankedKeywords(domain, country.dataforseoLocation, language, limit);
  } catch (err) {
    await settleSpend("labs", budget.reserved, 0);
    await noteProviderError(err);
    const quota = await refundQuota(req, "domain-keywords", viewer, usage.quota);
    return NextResponse.json({ error: `The keyword database didn't answer: ${err instanceof Error ? err.message : "unknown error"}`, quota }, { status: 502, headers: NO_STORE });
  }
  await settleSpend("labs", budget.reserved, raw.cost);

  const fetchedAt = Date.now();
  const result = parseRankedKeywords(raw.result, { domain, country: country.code, language, locationCode: country.dataforseoLocation, limit, fetchedAt });
  try {
    const payload = JSON.stringify(result);
    if (payload.length < 900_000) {
      await ref.set({ domain, locationCode: country.dataforseoLocation, language, limit, rows: result.rows.length, payload, createdAt: fetchedAt, expiresAt: new Date(fetchedAt + TTL_MS) });
    }
  } catch (err) {
    console.warn("[domain-keywords] cache write skipped", err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ...result, quota: usage.quota }, { headers: NO_STORE });
}
