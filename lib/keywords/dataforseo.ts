import "server-only";
import { COUNTRIES, LANGUAGES } from "./types";

/**
 * Optional volume, CPC, competition, trend and difficulty enrichment via DataForSEO v3
 * (https://docs.dataforseo.com/v3/). Enabled only when DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are set.
 * Without them the app returns keywords with NO volume/difficulty instead of estimating.
 *
 * Endpoints (one task per Live call):
 *  - POST /v3/keywords_data/google_ads/search_volume/live
 *      up to 1000 keywords per task, each <= 80 characters and <= 10 words; Google Ads rejects some symbols
 *      and emoji. Result items: keyword, search_volume, cpc, competition_index, monthly_searches[{year,month,search_volume}].
 *      Rate limit: 12 requests/minute per account.
 *  - POST /v3/dataforseo_labs/google/bulk_keyword_difficulty/live
 *      up to 1000 keywords per task; location + language required. Result: tasks[].result[].items[].keyword_difficulty.
 * Each endpoint is called independently, so one failing (e.g. an unsupported location for Labs) still returns
 * the other's data; per-task status codes are checked, and failures are reported, never papered over.
 *
 * NOTE: written against the documented request/response shapes; not yet exercised against a live account.
 */

export interface Enrichment {
  volume: number | null;
  cpc: number | null;
  competition: number | null;
  kd: number | null;
  trend: number[] | null;
}

export interface EnrichResult {
  data: Map<string, Enrichment>;
  /** Human-readable problems (partial or total), empty when everything succeeded. */
  errors: string[];
}

const BATCH = 1000;
const MAX_CHARS = 80;
const MAX_WORDS = 10;

export function dataforseoConfigured(): boolean {
  return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function authHeader(): string {
  const raw = `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

interface Envelope<R> {
  status_code?: number;
  status_message?: string;
  tasks?: { status_code?: number; status_message?: string; result?: R[] | null }[];
}

async function post<R>(path: string, task: Record<string, unknown>, timeoutMs: number): Promise<R[]> {
  const res = await fetch(`https://api.dataforseo.com/v3${path}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify([task]),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("DataForSEO rejected the credentials");
  if (res.status === 402) throw new Error("DataForSEO account balance is too low");
  if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
  const json = (await res.json()) as Envelope<R>;
  if (json.status_code !== 20000) throw new Error(`DataForSEO: ${json.status_message ?? json.status_code}`);
  const t = json.tasks?.[0];
  if (!t) throw new Error("DataForSEO returned no task");
  if (t.status_code !== 20000) throw new Error(`DataForSEO: ${t.status_message ?? t.status_code}`);
  return t.result ?? [];
}

/**
 * Google Ads accepts letters, digits, spaces and a few joiners. Anything else (emoji, most symbols) makes the
 * whole task fail, so such characters are replaced with spaces and over-long keywords are skipped.
 */
export function sanitizeForAds(keyword: string): string | null {
  const k = keyword
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s'&.+\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!k || k.length > MAX_CHARS || k.split(" ").length > MAX_WORDS) return null;
  return k;
}

type VolumeItem = {
  keyword?: string;
  search_volume?: number | null;
  cpc?: number | null;
  competition_index?: number | null;
  monthly_searches?: { year: number; month: number; search_volume: number | null }[] | null;
};
type KdResult = { items?: { keyword?: string; keyword_difficulty?: number | null }[] | null };

const chunk = <T,>(arr: T[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

export async function enrichKeywords(keywords: string[], country: string, language: string, timeoutMs = 25_000): Promise<EnrichResult> {
  const location = COUNTRIES.find((c) => c.code === country)?.dataforseoLocation ?? 2840;
  const lang = LANGUAGES.find((l) => l.code === language)?.dfs ?? "en";

  // Sanitised keyword -> original keywords (several originals can collapse to one sanitised form).
  const back = new Map<string, string[]>();
  for (const kw of keywords) {
    const s = sanitizeForAds(kw);
    if (!s) continue;
    back.set(s, [...(back.get(s) ?? []), kw]);
  }
  const list = [...back.keys()];
  const batches = chunk(list, BATCH);
  const data = new Map<string, Enrichment>();
  const errors: string[] = [];
  const blank = (): Enrichment => ({ volume: null, cpc: null, competition: null, kd: null, trend: null });
  const upsert = (submitted: string, patch: Partial<Enrichment>) => {
    for (const original of back.get(submitted.toLowerCase()) ?? []) data.set(original, { ...(data.get(original) ?? blank()), ...patch });
  };

  const volumeJobs = batches.map((b) =>
    post<VolumeItem>("/keywords_data/google_ads/search_volume/live", { keywords: b, location_code: location, language_code: lang }, timeoutMs),
  );
  const kdJobs = batches.map((b) =>
    post<KdResult>("/dataforseo_labs/google/bulk_keyword_difficulty/live", { keywords: b, location_code: location, language_code: lang }, timeoutMs),
  );
  const [vol, kd] = await Promise.all([Promise.allSettled(volumeJobs), Promise.allSettled(kdJobs)]);

  vol.forEach((r) => {
    if (r.status === "rejected") return errors.push(`Volume: ${r.reason instanceof Error ? r.reason.message : "failed"}`);
    for (const item of r.value) {
      if (!item?.keyword) continue;
      const months = (item.monthly_searches ?? [])
        .filter((m) => typeof m?.search_volume === "number")
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .slice(-12)
        .map((m) => m.search_volume as number);
      upsert(item.keyword, {
        volume: typeof item.search_volume === "number" ? item.search_volume : null,
        cpc: typeof item.cpc === "number" ? item.cpc : null,
        competition: typeof item.competition_index === "number" ? item.competition_index : null,
        trend: months.length >= 3 ? months : null,
      });
    }
  });
  kd.forEach((r) => {
    if (r.status === "rejected") return errors.push(`Difficulty: ${r.reason instanceof Error ? r.reason.message : "failed"}`);
    for (const res of r.value) {
      for (const item of res?.items ?? []) {
        if (item?.keyword) upsert(item.keyword, { kd: typeof item.keyword_difficulty === "number" ? item.keyword_difficulty : null });
      }
    }
  });

  if (vol.every((r) => r.status === "rejected") && kd.every((r) => r.status === "rejected")) {
    throw new Error([...new Set(errors)].join("; ") || "DataForSEO failed");
  }
  return { data, errors: [...new Set(errors)] };
}
