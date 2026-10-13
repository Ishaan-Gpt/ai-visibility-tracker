/*
 * Pure parser for DataForSEO Labs ranked_keywords/live results
 * (https://docs.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live/). Paths verified against a real
 * response on 2026-10-13: items[].keyword_data.keyword / keyword_info.{search_volume,cpc} /
 * keyword_properties.keyword_difficulty / search_intent_info.main_intent, items[].ranked_serp_element.serp_item.
 * {type, rank_group, rank_absolute, url, etv, rank_changes.previous_rank_absolute, rank_changes.is_new},
 * ranked_serp_element.serp_item_types (or keyword_data.serp_info.serp_item_types), result.metrics.organic.pos_*.
 */

import type { DomainKeywordRow, DomainKeywordsResult } from "./types";

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function parseRankedKeywords(
  result: unknown,
  meta: { domain: string; country: string; language: string; locationCode: number; limit: number; fetchedAt: number },
): DomainKeywordsResult {
  const r = o(result);
  const metrics = o(r.metrics);
  const org = metrics.organic ? o(metrics.organic) : null;
  const aio = metrics.ai_overview_reference ? o(metrics.ai_overview_reference) : null;
  const sum = (...keys: string[]) => keys.reduce((acc, k) => acc + (n(org?.[k]) ?? 0), 0);

  const rows: DomainKeywordRow[] = [];
  for (const raw of Array.isArray(r.items) ? r.items : []) {
    const it = o(raw);
    const kd = o(it.keyword_data);
    const keyword = s(kd.keyword);
    if (!keyword) continue;
    const info = o(kd.keyword_info);
    const props = o(kd.keyword_properties);
    const intent = o(kd.search_intent_info);
    const rse = o(it.ranked_serp_element);
    const item = o(rse.serp_item);
    const changes = o(item.rank_changes);
    const types = Array.isArray(rse.serp_item_types) ? rse.serp_item_types : Array.isArray(o(kd.serp_info).serp_item_types) ? (o(kd.serp_info).serp_item_types as unknown[]) : [];
    rows.push({
      keyword,
      position: n(item.rank_group),
      rankAbsolute: n(item.rank_absolute),
      type: s(item.type) ?? "organic",
      url: s(item.url),
      volume: n(info.search_volume),
      traffic: n(item.etv),
      cpc: n(info.cpc),
      kd: n(props.keyword_difficulty),
      intent: s(intent.main_intent),
      previous: n(changes.previous_rank_absolute),
      isNew: changes.is_new === true,
      serpFeatures: types.filter((t): t is string => typeof t === "string" && t !== "organic"),
      updatedAt: s(rse.last_updated_time) ?? s(o(kd.serp_info).last_updated_time),
    });
  }

  return {
    domain: meta.domain,
    country: meta.country,
    language: meta.language,
    locationCode: meta.locationCode,
    limit: meta.limit,
    totalCount: n(r.total_count) ?? rows.length,
    organic: org
      ? {
          pos1: sum("pos_1"),
          pos2_3: sum("pos_2_3"),
          pos4_10: sum("pos_4_10"),
          pos11_20: sum("pos_11_20"),
          pos21_50: sum("pos_21_30", "pos_31_40", "pos_41_50"),
          pos51_100: sum("pos_51_60", "pos_61_70", "pos_71_80", "pos_81_90", "pos_91_100"),
          count: n(org.count) ?? 0,
          etv: n(org.etv),
        }
      : null,
    aiOverviewCount: aio ? n(aio.count) : null,
    rows,
    fetchedAt: meta.fetchedAt,
  };
}
