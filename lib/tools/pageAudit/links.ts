/*
 * Link inventory + a bounded live check of a sample of links (broken links, redirect chains).
 * Sample: up to 40 unique URLs (internal first, then external), 8 in flight, HEAD with GET fallback, hard time budget.
 */
import type { CheerioAPI } from "cheerio";
import { BROWSER_UA } from "@/lib/net/safeFetch";
import { pool } from "@/lib/net/pool";
import { remaining, sameSite, tryFetch, urlKey } from "./net";
import type { LinkResult, LinkState, LinksReport } from "./types";

const GENERIC_ANCHORS = new Set([
  "click here", "click", "here", "read more", "more", "learn more", "find out more", "this", "link", "this link", "go", "continue",
  "details", "more info", "more information", "see more", "view more", "view", "info", "page", "website", "download", "start",
]);

/** Hosts that refuse automated checks; their 4xx/999 says nothing about whether the link works. */
const BOT_HOSTILE = /(^|\.)(linkedin\.com|instagram\.com|facebook\.com|x\.com|twitter\.com|tiktok\.com|pinterest\.[a-z.]+|quora\.com|medium\.com|reddit\.com|amazon\.[a-z.]+|indeed\.com|glassdoor\.[a-z.]+|yelp\.[a-z.]+|crunchbase\.com|g2\.com|zillow\.com|wsj\.com|nytimes\.com)$/i;

const MAX_CHECK = 40;
const MAX_INTERNAL = 26;
const CONCURRENCY = 8;

interface Found {
  url: string;
  anchor: string;
  internal: boolean;
  nofollow: boolean;
}

export function inventoryLinks($: CheerioAPI, pageUrl: string) {
  const host = new URL(pageUrl).hostname;
  const found: Found[] = [];
  let internal = 0;
  let external = 0;
  let total = 0;
  const nofollow = { internal: 0, external: 0 };
  let sponsoredOrUgc = 0;
  let empty = 0;
  const generic = new Map<string, number>();

  $("a[href]").each((_, el) => {
    const a = $(el);
    const href = (a.attr("href") ?? "").trim();
    if (!href || /^(#|mailto:|tel:|javascript:|sms:|data:)/i.test(href)) return;
    let u: URL;
    try {
      u = new URL(href, pageUrl);
    } catch {
      return;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return;
    total++;
    const isInternal = sameSite(u.hostname, host);
    if (isInternal) internal++;
    else external++;
    const rel = (a.attr("rel") ?? "").toLowerCase();
    const nf = /\bnofollow\b/.test(rel);
    if (nf) nofollow[isInternal ? "internal" : "external"]++;
    if (/\b(sponsored|ugc)\b/.test(rel)) sponsoredOrUgc++;
    const text = a.text().replace(/\s+/g, " ").trim();
    const label = text || a.attr("aria-label")?.trim() || a.attr("title")?.trim() || a.find("img[alt]").attr("alt")?.trim() || "";
    if (!label) empty++;
    const lower = text.toLowerCase().replace(/[.…:!»›→>\s]+$/g, "");
    if (GENERIC_ANCHORS.has(lower)) generic.set(lower, (generic.get(lower) ?? 0) + 1);
    u.hash = "";
    found.push({ url: u.href, anchor: label.slice(0, 80), internal: isInternal, nofollow: nf });
  });

  const unique = new Map<string, Found>();
  for (const f of found) if (!unique.has(urlKey(f.url))) unique.set(urlKey(f.url), f);

  return {
    found: [...unique.values()],
    stats: {
      total,
      unique: unique.size,
      internal,
      external,
      nofollow,
      sponsoredOrUgc,
      empty,
      generic: [...generic.entries()].map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count),
    },
  };
}

function pickSample(found: Found[], selfKey: string): Found[] {
  const candidates = found.filter((f) => urlKey(f.url) !== selfKey);
  const internal = candidates.filter((f) => f.internal).slice(0, MAX_INTERNAL);
  const external = candidates.filter((f) => !f.internal).slice(0, MAX_CHECK - internal.length);
  const sample = [...internal, ...external];
  if (sample.length < MAX_CHECK) sample.push(...candidates.filter((f) => f.internal && !sample.includes(f)).slice(0, MAX_CHECK - sample.length));
  return sample;
}

async function checkOne(f: Found, deadline: number): Promise<LinkResult> {
  const base = { url: f.url, anchor: f.anchor, internal: f.internal, nofollow: f.nofollow };
  const budget = Math.min(6000, remaining(deadline));
  if (budget < 400) return { ...base, status: null, state: "timeout", hops: 0, note: "Not checked: time budget used up" };
  let p = await tryFetch(f.url, { method: "HEAD", userAgent: BROWSER_UA, maxBytes: 50_000 }, budget);
  // Many servers mishandle HEAD (405/501, sometimes 403/404/400). Retry those with a GET before believing them.
  if (!p.ok || [400, 403, 404, 405, 406, 429, 500, 501, 503].includes(p.res.status)) {
    const left = Math.min(6000, remaining(deadline));
    if (left >= 400) {
      const g = await tryFetch(f.url, { method: "GET", userAgent: BROWSER_UA, maxBytes: 64_000 }, left);
      if (g.ok || !p.ok) p = g;
    }
  }
  if (!p.ok) {
    if (p.timeout) return { ...base, status: null, state: "timeout", hops: 0, note: "No response in time" };
    const dns = /ENOTFOUND|EAI_AGAIN|not allowed/i.test(`${p.code} ${p.error}`);
    return { ...base, status: null, state: dns ? "broken" : "error", hops: 0, note: dns ? "Domain does not resolve" : p.error };
  }
  const { status, redirects, finalUrl } = p.res;
  const host = new URL(f.url).hostname;
  let state: LinkState;
  let note: string | undefined;
  if (status === 404 || status === 410) state = "broken";
  else if (status === 429) {
    state = "blocked";
    note = "Rate-limited our checker; open it manually to confirm";
  } else if ((status === 401 || status === 403 || status === 999) && (BOT_HOSTILE.test(host) || !f.internal)) {
    state = "blocked";
    note = "The site refuses automated checks; open it manually to confirm";
  } else if (status >= 400) state = "broken";
  else if (redirects.length > 0) state = "redirect";
  else state = "ok";
  return { ...base, status, state, hops: redirects.length, finalUrl: redirects.length ? finalUrl : undefined, note };
}

export async function checkLinks($: CheerioAPI, pageUrl: string, deadline: number): Promise<LinksReport> {
  const { found, stats } = inventoryLinks($, pageUrl);
  const sample = pickSample(found, urlKey(pageUrl));
  const results = await pool(sample, CONCURRENCY, (f) => checkOne(f, deadline));
  const order: Record<LinkState, number> = { broken: 0, error: 1, redirect: 2, timeout: 3, blocked: 4, ok: 5 };
  results.sort((a, b) => order[a.state] - order[b.state] || Number(b.internal) - Number(a.internal));
  return {
    ...stats,
    checked: results.filter((r) => r.note !== "Not checked: time budget used up").length,
    budgetHit: results.some((r) => r.note === "Not checked: time budget used up"),
    results,
  };
}
