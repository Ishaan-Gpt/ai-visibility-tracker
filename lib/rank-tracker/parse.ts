/*
 * Pure parsing of a DataForSEO Google Organic *advanced* result (task_get/advanced or live/advanced; the same
 * shape) into one RtCheck for a project. No I/O, safe to unit-test with saved responses.
 *
 * Shape notes from a real response (2026-10-13): organic items carry rank_group (rank among organic results),
 * rank_absolute (rank among every element), domain, url, title. ai_overview items may have `references: null`
 * with sources only in nested items[].references / links or as markdown links, so all of those are scanned.
 */

import type { RtCheck, RtCompetitorPos, RtSerpRow } from "./types";

type Item = Record<string, unknown> & { type?: string; rank_group?: number; rank_absolute?: number; domain?: string; url?: string; title?: string };

export interface SerpResult {
  keyword?: string;
  check_url?: string | null;
  item_types?: string[] | null;
  se_results_count?: number | null;
  items?: Item[] | null;
}

export interface MatchTarget {
  domain: string;
  includeSubdomains: boolean;
}

/** "https://www.Acme.com/x" or "WWW.acme.com" -> "acme.com". */
export function hostOfUrl(input: string | null | undefined): string {
  if (!input) return "";
  const raw = String(input).trim();
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\d?\./, "");
  } catch {
    return raw.toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#:].*$/, "").replace(/^www\d?\./, "");
  }
}

export function hostMatches(hostOrUrl: string | null | undefined, t: MatchTarget): boolean {
  const h = hostOfUrl(hostOrUrl);
  const d = hostOfUrl(t.domain);
  if (!h || !d) return false;
  return h === d || (t.includeSubdomains && h.endsWith(`.${d}`));
}

const MD_LINK = /\]\((https?:\/\/[^)\s]+)\)/g;

/** Every url/domain referenced anywhere inside a SERP element (bounded depth), plus markdown links. */
export function referencedHosts(item: unknown, depth = 0, out: string[] = []): string[] {
  if (!item || depth > 4) return out;
  if (Array.isArray(item)) {
    for (const x of item) referencedHosts(x, depth + 1, out);
    return out;
  }
  if (typeof item !== "object") return out;
  for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
    if ((k === "url" || k === "domain" || k === "source_url") && typeof v === "string" && v) out.push(v);
    else if (k === "markdown" && typeof v === "string") for (const m of v.matchAll(MD_LINK)) out.push(m[1]);
    else if (v && typeof v === "object") referencedHosts(v, depth + 1, out);
  }
  return out;
}

/** SERP element types that are rankings or ads, never "features we appear in". */
const NOT_FEATURES = new Set(["organic", "paid", "related_searches", "people_also_search"]);

export function parseSerp(result: SerpResult, target: MatchTarget, competitors: string[], opts: { date: string; checkedAt: number }): { check: RtCheck; top: RtSerpRow[]; seResultsCount: number | null; checkUrl: string | null } {
  const items = (result.items ?? []).filter((i): i is Item => Boolean(i && typeof i === "object"));
  const organic = items.filter((i) => i.type === "organic" && typeof i.rank_group === "number").sort((a, b) => (a.rank_group as number) - (b.rank_group as number));

  const mine = organic.find((i) => hostMatches(i.domain || i.url, target) || hostMatches(i.url, target));
  const snippet = items.find((i) => i.type === "featured_snippet" && (hostMatches(i.domain, target) || hostMatches(i.url, target)));

  const ourFeatures = new Set<string>();
  for (const it of items) {
    if (!it.type || NOT_FEATURES.has(it.type)) continue;
    if (referencedHosts(it).some((h) => hostMatches(h, target))) ourFeatures.add(it.type);
  }
  if (mine?.is_featured_snippet === true) ourFeatures.add("featured_snippet");

  let position: number | null = null;
  let rankAbsolute: number | null = null;
  let url: string | null = null;
  let source: RtCheck["source"] = null;
  if (mine) {
    position = mine.rank_group as number;
    rankAbsolute = typeof mine.rank_absolute === "number" ? mine.rank_absolute : null;
    url = mine.url ?? null;
    source = "organic";
  } else if (snippet) {
    position = 1;
    rankAbsolute = typeof snippet.rank_absolute === "number" ? snippet.rank_absolute : null;
    url = (snippet.url as string | undefined) ?? null;
    source = "featured_snippet";
  }

  const competitorPos: RtCompetitorPos[] = competitors.map((domain) => {
    const t = { domain, includeSubdomains: true };
    const hit = organic.find((i) => hostMatches(i.domain || i.url, t) || hostMatches(i.url, t));
    return { domain, position: hit ? (hit.rank_group as number) : null, url: hit?.url ?? null };
  });

  const scanned = organic.length ? (organic[organic.length - 1].rank_group as number) : 0;
  const features = [...new Set((result.item_types ?? items.map((i) => i.type ?? "")).filter((t): t is string => Boolean(t) && t !== "organic"))];

  const top: RtSerpRow[] = organic.slice(0, 10).map((i) => ({
    rank: i.rank_group as number,
    domain: hostOfUrl(i.domain || i.url),
    url: String(i.url ?? ""),
    title: String(i.title ?? "").slice(0, 200),
  }));

  return {
    check: {
      date: opts.date,
      checkedAt: opts.checkedAt,
      position,
      rankAbsolute,
      url,
      source,
      scanned,
      features,
      ourFeatures: [...ourFeatures],
      competitors: competitorPos,
    },
    top,
    seResultsCount: typeof result.se_results_count === "number" ? result.se_results_count : null,
    checkUrl: result.check_url ?? null,
  };
}

/** The check recorded when Google returned no results at all (DataForSEO 40102). */
export function emptyCheck(competitors: string[], opts: { date: string; checkedAt: number }): RtCheck {
  return {
    date: opts.date,
    checkedAt: opts.checkedAt,
    position: null,
    rankAbsolute: null,
    url: null,
    source: null,
    scanned: 0,
    features: [],
    ourFeatures: [],
    competitors: competitors.map((domain) => ({ domain, position: null, url: null })),
    noResults: true,
  };
}
