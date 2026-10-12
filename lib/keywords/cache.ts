import "server-only";
import crypto from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import type { ResearchResponse, SuggestSource } from "./types";

/*
 * Firestore cache for finished research results (collection `keywordCache`). Keyed by a hash of the
 * normalised seed + country + language + sources, so repeat seeds return instantly without re-querying the
 * autocomplete endpoints or charging a run. Entries expire after 7 days via `expiresAt` (also the field to
 * point a Firestore TTL policy at). The payload is stored as one JSON string to stay well clear of per-field
 * index limits. Every call is fail-soft: if Firestore is unreachable the research simply runs uncached.
 */

const COLLECTION = "keywordCache";
const TTL_MS = 7 * 86_400_000;
/** Bump when the response shape or the expansion logic changes, so stale shapes are never served. */
const VERSION = 2;
const MAX_BYTES = 900_000;

/** `providerLimit` is part of the key: a result without paid data must never be served to a plan that gets it. */
export function cacheKey(seed: string, country: string, language: string, sources: SuggestSource[], providerLimit = 0): string {
  const raw = JSON.stringify([VERSION, seed, country, language, [...sources].sort(), providerLimit]);
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("cache timeout")), ms))]);
}

export async function readCache(key: string): Promise<ResearchResponse | null> {
  try {
    // Generous: a cold Firestore client can take a few seconds, and a miss costs ~20 s of live queries.
    const snap = await withTimeout(adminDb().collection(COLLECTION).doc(key).get(), 6000);
    if (!snap.exists) return null;
    const data = snap.data() as { payload?: string; createdAt?: number; expiresAt?: { toMillis?: () => number } | Date; v?: number };
    const exp = data.expiresAt instanceof Date ? data.expiresAt.getTime() : data.expiresAt?.toMillis?.() ?? 0;
    if (data.v !== VERSION || !data.payload || exp < Date.now()) return null;
    const parsed = JSON.parse(data.payload) as ResearchResponse;
    return { ...parsed, cachedAt: data.createdAt ?? Date.now() };
  } catch (err) {
    console.warn("[keywords/cache] read skipped:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function writeCache(key: string, value: ResearchResponse): Promise<void> {
  try {
    const payload = JSON.stringify(value);
    if (payload.length > MAX_BYTES) return;
    const now = Date.now();
    await withTimeout(
      adminDb()
        .collection(COLLECTION)
        .doc(key)
        .set({
          v: VERSION,
          seed: value.seed,
          country: value.country,
          language: value.language,
          sources: value.sources,
          count: value.keywords.length,
          payload,
          createdAt: now,
          expiresAt: new Date(now + TTL_MS),
        }),
      5000,
    );
  } catch (err) {
    console.warn("[keywords/cache] write skipped:", err instanceof Error ? err.message : err);
  }
}
