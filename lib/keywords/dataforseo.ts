import "server-only";
import { COUNTRIES } from "./types";

/**
 * Optional volume + difficulty enrichment via DataForSEO (https://docs.dataforseo.com).
 * Enabled only when DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are set. Without them the app returns
 * keywords with NO volume/difficulty instead of estimating, so the numbers users see are always real.
 *
 * NOTE: written against DataForSEO's documented v3 endpoints but not yet exercised against a live account.
 */

export interface Enrichment {
  volume: number | null;
  cpc: number | null;
  competition: number | null;
  kd: number | null;
}

export function dataforseoConfigured(): boolean {
  return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function authHeader(): string {
  const raw = `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`https://api.dataforseo.com/v3${path}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
  const json = (await res.json()) as T & { status_code?: number; status_message?: string };
  if (json.status_code && json.status_code >= 40000) throw new Error(`DataForSEO: ${json.status_message ?? json.status_code}`);
  return json;
}

type VolumeResp = {
  tasks?: { result?: { keyword: string; search_volume: number | null; cpc: number | null; competition_index: number | null }[] }[];
};
type KdResp = {
  tasks?: { result?: { items?: { keyword: string; keyword_difficulty: number | null }[] }[] }[];
};

export async function enrichKeywords(
  keywords: string[],
  country: string,
  language: string,
): Promise<Map<string, Enrichment>> {
  const location = COUNTRIES.find((c) => c.code === country)?.dataforseoLocation ?? 2840;
  const out = new Map<string, Enrichment>();
  const list = keywords.slice(0, 1000);

  const [vol, kd] = await Promise.all([
    post<VolumeResp>("/keywords_data/google_ads/search_volume/live", [
      { keywords: list, location_code: location, language_code: language },
    ]),
    post<KdResp>("/dataforseo_labs/google/bulk_keyword_difficulty/live", [
      { keywords: list, location_code: location, language_code: language },
    ]),
  ]);

  for (const r of vol.tasks?.[0]?.result ?? []) {
    out.set(r.keyword.toLowerCase(), {
      volume: r.search_volume ?? null,
      cpc: r.cpc ?? null,
      competition: r.competition_index ?? null,
      kd: null,
    });
  }
  for (const r of kd.tasks?.[0]?.result?.[0]?.items ?? []) {
    const k = r.keyword.toLowerCase();
    const prev = out.get(k) ?? { volume: null, cpc: null, competition: null, kd: null };
    out.set(k, { ...prev, kd: r.keyword_difficulty ?? null });
  }
  return out;
}
