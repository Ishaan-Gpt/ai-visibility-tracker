import "server-only";
import { DFS_CODES, dfsCall, DfsError, envelopeCost } from "./client";

/*
 * DataForSEO Labs ranked_keywords/live: $0.012 per task + $0.00012 per returned item.
 * Sorted by estimated traffic (etv) so the most valuable rows come first; if DataForSEO ever rejects that sort
 * field (40501, not charged) we retry once with the documented search_volume sort.
 */

export async function rankedKeywords(domain: string, locationCode: number, languageCode: string, limit: number): Promise<{ result: unknown; cost: number }> {
  const base = {
    target: domain,
    location_code: locationCode,
    language_code: languageCode,
    limit,
    item_types: ["organic", "featured_snippet", "ai_overview_reference"],
    ignore_synonyms: false,
  };
  const attempt = async (orderBy: string[]) => {
    const env = await dfsCall("POST", "/dataforseo_labs/google/ranked_keywords/live", [{ ...base, order_by: orderBy }], 60_000);
    const t = env.tasks?.[0];
    if (!t) throw new DfsError("DataForSEO returned no task");
    return { t, cost: envelopeCost(env) };
  };
  let { t, cost } = await attempt(["ranked_serp_element.serp_item.etv,desc"]);
  if (t.status_code === DFS_CODES.invalidField) ({ t, cost } = await attempt(["keyword_data.keyword_info.search_volume,desc"]));
  if (t.status_code !== DFS_CODES.ok) throw new DfsError(`DataForSEO: ${t.status_message ?? t.status_code}`, t.status_code);
  return { result: t.result?.[0] ?? {}, cost };
}

export interface LocationOption {
  code: number;
  name: string;
  type: string;
}

const g = globalThis as unknown as { __dfsLocations?: Map<string, { at: number; list: LocationOption[] }> };
const cache = (g.__dfsLocations ??= new Map());

/**
 * Cities (and regions) for one country from GET /v3/serp/google/locations/{country} (free). Cached in memory
 * per instance for a day: the list is large and rarely changes.
 */
export async function locationsFor(country: string): Promise<LocationOption[]> {
  const key = country.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 86_400_000) return hit.list;
  const env = await dfsCall<{ location_code?: number; location_name?: string; location_type?: string }>("GET", `/serp/google/locations/${key}`, undefined, 30_000);
  const t = env.tasks?.[0];
  if (!t || t.status_code !== DFS_CODES.ok) throw new DfsError(`DataForSEO: ${t?.status_message ?? "no locations"}`, t?.status_code);
  const list: LocationOption[] = [];
  for (const r of t.result ?? []) {
    if (typeof r?.location_code !== "number" || !r.location_name) continue;
    const type = r.location_type ?? "";
    if (!/city|region|state|province|county|municipality|district|neighborhood|borough/i.test(type)) continue;
    list.push({ code: r.location_code, name: r.location_name, type });
  }
  cache.set(key, { at: Date.now(), list });
  if (cache.size > 60) cache.delete(cache.keys().next().value as string);
  return list;
}
