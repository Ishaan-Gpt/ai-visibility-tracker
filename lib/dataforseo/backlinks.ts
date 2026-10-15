import "server-only";
import { dfsCall, DFS_CODES, DfsError, envelopeCost } from "./client";
import type { BacklinkScope, BacklinksResult, BlAnchor, BlDomain, BlHistoryPoint, BlLink, BlSummary } from "@/lib/backlinks/types";

/*
 * DataForSEO Backlinks API (https://docs.dataforseo.com/v3/backlinks/overview/). Billed as its own subscription, so
 * it is only reachable when DATAFORSEO_BACKLINKS=on (see lib/features.ts).
 *
 * One lookup = summary + 12-month history + referring domains + backlinks (one per domain) + anchors + lost
 * domains, run in parallel. Only the summary is required; a failed list leaves the rest of the report usable.
 * Spam is not filtered at the source: every row carries its spam score and the UI hides spammy rows by default,
 * so the same lookup also serves a disavow review.
 */

type Obj = Record<string, unknown>;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const day = (v: unknown): string | null => str(v)?.slice(0, 10) ?? null;
const nofollowOf = (o: Obj): number | null => num((o.referring_links_attributes as Obj | null | undefined)?.nofollow) ?? 0;

/** Request fields shared by every endpoint. */
function common(target: string, includeSubdomains: boolean) {
  return {
    target,
    include_subdomains: includeSubdomains,
    include_indirect_links: true,
    exclude_internal_backlinks: true,
    rank_scale: "one_hundred",
  };
}

async function call(path: string, task: Obj): Promise<{ items: Obj[]; first: Obj | null; total: number | null; cost: number }> {
  const env = await dfsCall<Obj>("POST", path, [task], 45_000);
  const t = env.tasks?.[0];
  const cost = envelopeCost(t) || envelopeCost(env);
  if (!t) throw new DfsError("DataForSEO returned no task");
  if (t.status_code === DFS_CODES.noResults) return { items: [], first: null, total: 0, cost };
  if (t.status_code !== DFS_CODES.ok) throw new DfsError(`DataForSEO: ${t.status_message ?? t.status_code}`, t.status_code);
  const first = (t.result?.[0] as Obj | undefined) ?? null;
  const items = Array.isArray(first?.items) ? (first.items as Obj[]) : [];
  return { items, first, total: num(first?.total_count), cost };
}

function parseSummary(o: Obj | null): BlSummary {
  const backlinks = num(o?.backlinks);
  const nofollow = o ? nofollowOf(o) : null;
  return {
    rank: num(o?.rank),
    backlinks,
    referringDomains: num(o?.referring_domains),
    referringPages: num(o?.referring_pages),
    referringIps: num(o?.referring_ips),
    nofollow,
    dofollow: backlinks !== null && nofollow !== null ? Math.max(0, backlinks - nofollow) : null,
    brokenBacklinks: num(o?.broken_backlinks),
    newBacklinks: num(o?.new_backlinks),
    lostBacklinks: num(o?.lost_backlinks),
    // DataForSEO ships both the misspelled and corrected keys.
    newDomains: num(o?.new_referring_domains) ?? num(o?.new_reffering_domains),
    lostDomains: num(o?.lost_referring_domains) ?? num(o?.lost_reffering_domains),
    spamScore: num((o?.info as Obj | undefined)?.target_spam_score) ?? num(o?.backlinks_spam_score),
    firstSeen: day(o?.first_seen),
  };
}

const parseDomain = (o: Obj, lost = false): BlDomain => {
  const backlinks = num(o.backlinks);
  return {
    domain: str(o.domain) ?? "",
    rank: num(o.rank),
    backlinks,
    dofollow: backlinks !== null ? Math.max(0, backlinks - (nofollowOf(o) ?? 0)) : null,
    spamScore: num(o.backlinks_spam_score),
    firstSeen: day(o.first_seen),
    lost,
  };
};

const parseLink = (o: Obj): BlLink => ({
  from: str(o.url_from) ?? "",
  fromDomain: str(o.domain_from) ?? "",
  to: str(o.url_to) ?? "",
  anchor: (str(o.anchor) ?? "").replace(/\s+/g, " ").trim(),
  dofollow: o.dofollow === true,
  type: str(o.item_type),
  domainRank: num(o.domain_from_rank),
  pageRank: num(o.page_from_rank) ?? num(o.rank),
  spamScore: num(o.backlink_spam_score) ?? num(o.backlinks_spam_score),
  firstSeen: day(o.first_seen),
  lastSeen: day(o.last_seen),
  isNew: o.is_new === true,
  isBroken: o.is_broken === true,
});

const parseAnchor = (o: Obj): BlAnchor => {
  const backlinks = num(o.backlinks);
  return {
    anchor: (str(o.anchor) ?? "").replace(/\s+/g, " ").trim(),
    backlinks,
    referringDomains: num(o.referring_domains),
    dofollow: backlinks !== null ? Math.max(0, backlinks - (nofollowOf(o) ?? 0)) : null,
    firstSeen: day(o.first_seen),
  };
};

const parseHistory = (o: Obj): BlHistoryPoint => ({
  month: (day(o.date) ?? "").slice(0, 7) + "-01",
  backlinks: num(o.backlinks),
  referringDomains: num(o.referring_domains),
  newDomains: num(o.new_referring_domains) ?? num(o.new_reffering_domains),
  lostDomains: num(o.lost_referring_domains) ?? num(o.lost_reffering_domains),
});

/** Number of paid calls one lookup makes, for the spend estimate. */
export const BACKLINK_CALLS = 6;

export async function backlinkProfile(target: string, scope: BacklinkScope, includeSubdomains: boolean, rows: number): Promise<{ result: Omit<BacklinksResult, "fetchedAt">; cost: number }> {
  const base = common(target, includeSubdomains);
  const live = { ...base, backlinks_status_type: "live" };
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1)).toISOString().slice(0, 10);

  // Summary first: a bad target or a missing subscription fails here, before any list is paid for.
  const summary = await call("/backlinks/summary/live", live);

  const lists = await Promise.allSettled([
    // History is only defined for domains.
    scope === "domain" ? call("/backlinks/history/live", { target, date_from: from, date_to: now.toISOString().slice(0, 10) }) : Promise.resolve(null),
    call("/backlinks/referring_domains/live", { ...live, limit: rows, order_by: ["rank,desc"] }),
    call("/backlinks/backlinks/live", { ...live, mode: "one_per_domain", limit: rows, order_by: ["domain_from_rank,desc"] }),
    call("/backlinks/anchors/live", { ...live, limit: Math.min(rows, 500), order_by: ["referring_domains,desc"] }),
    call("/backlinks/referring_domains/live", { ...base, backlinks_status_type: "lost", limit: Math.min(rows, 200), order_by: ["rank,desc"] }),
  ]);
  const names = ["history", "referring domains", "backlinks", "anchors", "lost domains"];
  const partial: string[] = [];
  let cost = summary.cost;
  const got = lists.map((r, i) => {
    if (r.status === "fulfilled") {
      cost += r.value?.cost ?? 0;
      return r.value;
    }
    // A billing error on a list means the whole lookup should be treated as a provider failure upstream.
    if (r.reason instanceof DfsError && r.reason.isBilling) throw r.reason;
    console.warn(`[backlinks] ${names[i]} failed:`, r.reason instanceof Error ? r.reason.message : r.reason);
    partial.push(names[i]);
    return null;
  });
  const [hist, domains, links, anchors, lost] = got;

  const history = (hist?.items ?? []).map(parseHistory).filter((h) => h.month.length === 10).sort((a, b) => a.month.localeCompare(b.month));
  const s = parseSummary(summary.first);
  // Summary new/lost counts are not always present; fall back to the latest history month.
  const last = history[history.length - 1];
  if (s.newDomains === null && last) s.newDomains = last.newDomains;
  if (s.lostDomains === null && last) s.lostDomains = last.lostDomains;

  return {
    result: {
      target,
      scope,
      includeSubdomains,
      rowLimit: rows,
      summary: s,
      history,
      domains: (domains?.items ?? []).map((o) => parseDomain(o)).filter((d) => d.domain),
      links: (links?.items ?? []).map(parseLink).filter((l) => l.from),
      anchors: (anchors?.items ?? []).map(parseAnchor),
      lostDomains: (lost?.items ?? []).map((o) => parseDomain(o, true)).filter((d) => d.domain),
      partial,
    },
    cost,
  };
}
