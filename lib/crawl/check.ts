import "server-only";
import { normalizeUrl, safeFetch, SafeFetchError } from "@/lib/net/safeFetch";
import { pool } from "@/lib/net/pool";
import { extractPage, headerCanonical, headerNoindex, looksSoft404, metaNoindex } from "@/lib/crawl/html";
import { allowedFor, BOT_TOKEN, loadRobots } from "@/lib/crawl/robots";
import { DEFAULT_SITEMAP_PATHS, FALLBACK_SITEMAP_PATHS, loadSitemaps, type LoadedSitemaps } from "@/lib/crawl/sitemaps";
import { mergeIssues } from "@/lib/crawl/sitemapXml";
import { isAssetUrl, normalizeCrawlUrl } from "@/lib/crawl/url";
import type { CrawlProgress, ProtocolIssue, SampleResult, SitemapCheckReport } from "@/lib/crawl/types";

export interface CheckOptions {
  /** Domain, page URL or sitemap URL. */
  url: string;
  /** URLs to live-check (status, redirect, noindex, canonical). Default 100. */
  sampleSize?: number;
  timeBudgetMs?: number;
  signal?: AbortSignal;
  onProgress?: (p: CrawlProgress) => void;
}

const looksLikeSitemapUrl = (u: URL) => u.pathname !== "/" && (/\.xml(\.gz)?$/i.test(u.pathname) || /sitemap/i.test(u.pathname));

/** Evenly spaced picks so the sample covers every child sitemap, not just the first one. */
function spread<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * step)]);
}

export async function checkSitemap(opts: CheckOptions): Promise<SitemapCheckReport> {
  const t0 = Date.now();
  const budget = Math.max(10_000, Math.min(opts.timeBudgetMs ?? 45_000, 280_000));
  const deadline = t0 + budget;
  const sampleSize = Math.max(0, Math.min(opts.sampleSize ?? 100, 500));
  const input = normalizeUrl(opts.url);
  const isSitemapInput = looksLikeSitemapUrl(input);
  const host = input.hostname.toLowerCase();
  const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const origin = input.origin;

  let files = 0;
  let urlsSoFar = 0;
  const progress = (phase: CrawlProgress["phase"], crawled = 0, current?: string) =>
    opts.onProgress?.({ phase, crawled, queued: 0, discovered: urlsSoFar, sitemapUrls: urlsSoFar, sitemapFiles: files, cap: sampleSize, elapsedMs: Date.now() - t0, budgetMs: budget, current });

  progress("robots");
  const robots = await loadRobots(origin, opts.signal);

  progress("sitemaps");
  const onFile = (_: unknown, total: number) => {
    files++;
    urlsSoFar = total;
    progress("sitemaps");
  };
  const smDeadline = t0 + budget * 0.55;
  const allowedHosts = [host, twin];
  let discoveredVia: SitemapCheckReport["discoveredVia"] = "none";
  let loaded: LoadedSitemaps = { files: [], urls: [], truncated: false };

  if (isSitemapInput) {
    discoveredVia = "input";
    loaded = await loadSitemaps([input.href], { deadline: smDeadline, signal: opts.signal, validate: true, allowedHosts, maxFiles: 60, maxUrls: 200_000, onFile });
  } else {
    if (robots.sitemaps.length) {
      discoveredVia = "robots";
      loaded = await loadSitemaps(robots.sitemaps, { deadline: smDeadline, signal: opts.signal, validate: true, allowedHosts, maxFiles: 60, maxUrls: 200_000, onFile });
    }
    if (!loaded.files.some((f) => f.status === 200 && f.kind !== "unknown")) {
      const guesses = [...DEFAULT_SITEMAP_PATHS, ...FALLBACK_SITEMAP_PATHS].map((p) => origin + p);
      for (const g of guesses) {
        if (Date.now() > smDeadline) break;
        const r = await loadSitemaps([g], { deadline: smDeadline, signal: opts.signal, validate: true, allowedHosts, optional: new Set([g]), maxFiles: 60, maxUrls: 200_000, onFile });
        if (r.files.some((f) => f.status === 200 && f.kind !== "unknown")) {
          loaded = { files: [...loaded.files, ...r.files], urls: [...loaded.urls, ...r.urls], truncated: r.truncated };
          if (discoveredVia === "none") discoveredVia = "default-path";
          break;
        }
      }
    }
  }

  const found = loaded.files.some((f) => f.status === 200 && f.kind !== "unknown");

  // Set-level issues the per-file validator cannot see.
  const extra: ProtocolIssue[] = [];
  const add = (it: Omit<ProtocolIssue, "count" | "examples"> & { count?: number; examples?: ProtocolIssue["examples"] }) => extra.push({ count: 1, examples: [], ...it });
  for (const f of loaded.files) {
    if (f.error || f.status !== 200) {
      add({ code: "fetch", severity: "error", message: "A sitemap file could not be read", fix: "Every sitemap URL must return HTTP 200 with XML. Check the URL, your server and any firewall/bot protection.", examples: [{ file: f.url, value: f.error ?? `HTTP ${f.status}` }] });
    }
    if (f.redirectedTo) add({ code: "redirected", severity: "warning", message: "A sitemap URL redirects", fix: "Submit and reference the final URL directly (in robots.txt and Search Console).", examples: [{ file: f.url, value: `→ ${f.redirectedTo}` }] });
    if (f.status === 200 && !f.gzip && f.contentType && !/xml|gzip|octet-stream|text\/plain/i.test(f.contentType)) {
      add({ code: "content-type", severity: "info", message: `A sitemap is served as ${f.contentType}`, fix: "Serve sitemaps as application/xml (or text/xml).", examples: [{ file: f.url, value: f.contentType }] });
    }
  }
  const counts = new Map<string, number>();
  for (const u of loaded.urls) counts.set(u.loc, (counts.get(u.loc) ?? 0) + 1);
  const crossDupes = [...counts.entries()].filter(([, n]) => n > 1);
  if (crossDupes.length && loaded.files.length > 1) {
    add({ code: "dupe-across", severity: "warning", message: "URLs listed in more than one sitemap file", fix: "List each URL in exactly one file.", count: crossDupes.length, examples: crossDupes.slice(0, 5).map(([v, n]) => ({ value: `${v} (×${n})` })) });
  }
  const declares = robots.sitemaps;
  if (found && robots.found && !declares.length) {
    add({ code: "robots-undeclared", severity: "info", message: "robots.txt does not reference your sitemap", fix: `Add "Sitemap: ${loaded.files[0]?.url}" to robots.txt so every search engine finds it.` });
  }
  if (!found) {
    add({ code: "not-found", severity: "error", message: isSitemapInput ? "That sitemap URL did not return a readable sitemap" : "No sitemap found", fix: "Generate one with Crawl mode, upload it to your site root and declare it in robots.txt." });
  }

  /* ---------- live sample ---------- */
  const unique = [...new Set(loaded.urls.map((u) => u.loc))].filter((l) => /^https?:\/\//i.test(l));
  // Small sitemaps are checked in full; larger ones get an evenly spread sample.
  const sampleUrls = spread(unique, unique.length <= 200 ? unique.length : sampleSize);
  const results: SampleResult[] = [];
  let checked = 0;
  const robotsByOrigin = new Map<string, ReturnType<typeof loadRobots>>([[origin, Promise.resolve(robots)]]);
  const robotsFor = (o: string) => {
    let p = robotsByOrigin.get(o);
    if (!p) {
      p = loadRobots(o, opts.signal).catch(() => robots);
      robotsByOrigin.set(o, p);
    }
    return p;
  };

  if (sampleUrls.length && Date.now() < deadline - 2_000) {
    progress("crawl", 0);
    const out = await pool(sampleUrls, 8, async (url): Promise<SampleResult | null> => {
      if (Date.now() > deadline - 1_500 || opts.signal?.aborted) return null;
      let o: string;
      try {
        o = new URL(url).origin;
      } catch {
        return { url, status: null, verdict: "fetch-error", detail: "Malformed URL" };
      }
      const r = await robotsFor(o);
      if (!allowedFor(r, "googlebot", url)) return { url, status: null, verdict: "blocked-google", detail: "Disallowed for Googlebot in robots.txt" };
      if (!allowedFor(r, BOT_TOKEN, url)) return { url, status: null, verdict: "blocked-us", detail: "robots.txt disallows our crawler, so we did not fetch it" };
      const timeoutMs = Math.max(2_000, Math.min(10_000, deadline - Date.now() - 500));
      try {
        const asset = isAssetUrl(url);
        let res = await safeFetch(url, { method: asset ? "HEAD" : "GET", maxRedirects: 0, maxBytes: 400_000, timeoutMs });
        if (asset && (res.status === 405 || res.status === 501)) res = await safeFetch(url, { maxRedirects: 0, maxBytes: 50_000, timeoutMs });
        checked++;
        progress("crawl", checked, url);
        const st = res.status;
        if (st >= 300 && st < 400) {
          const loc = res.headers["location"];
          return { url, status: st, verdict: "redirect", detail: loc ? `→ ${new URL(loc, url).href}` : "No Location header", ms: res.elapsedMs };
        }
        if (st === 404 || st === 410) return { url, status: st, verdict: "not-found", ms: res.elapsedMs };
        if (st >= 400 && st < 500) return { url, status: st, verdict: "client-error", detail: st === 403 ? "Forbidden (may be bot protection)" : st === 401 ? "Requires login" : undefined, ms: res.elapsedMs };
        if (st >= 500) return { url, status: st, verdict: "server-error", ms: res.elapsedMs };
        const ct = (res.headers["content-type"] ?? "").toLowerCase();
        if (headerNoindex(res.headers["x-robots-tag"])) return { url, status: st, verdict: "noindex", detail: "X-Robots-Tag header", ms: res.elapsedMs };
        if (!/html/.test(ct)) return { url, status: st, verdict: "ok-non-html", detail: ct.split(";")[0] || undefined, ms: res.elapsedMs };
        const f = extractPage(res.body, url);
        if (metaNoindex(f.metaRobots)) return { url, status: st, verdict: "noindex", detail: "meta robots", ms: res.elapsedMs };
        const canonRaw = f.canonical ?? headerCanonical(res.headers["link"], url);
        const canon = canonRaw ? normalizeCrawlUrl(canonRaw) : null;
        if (canon && canon !== normalizeCrawlUrl(url)) return { url, status: st, verdict: "canonicalised", detail: `→ ${canon}`, ms: res.elapsedMs };
        if (looksSoft404(f.title, f.h1)) return { url, status: st, verdict: "soft-404", detail: f.title, ms: res.elapsedMs };
        return { url, status: st, verdict: "ok", ms: res.elapsedMs };
      } catch (err) {
        checked++;
        const msg = err instanceof Error ? err.message : "";
        return { url, status: 0, verdict: "fetch-error", detail: /too long/i.test(msg) ? "Timed out" : msg.replace(/^Could not reach the site /, "").slice(0, 100) };
      }
    });
    for (const r of out) if (r) results.push(r);
  }

  // A wall of 403s is almost always bot protection answering us, not what Googlebot sees.
  const forbidden = results.filter((r) => r.status === 403).length;
  const botWall = results.length >= 5 && forbidden / results.length >= 0.5;
  if (botWall) {
    extra.push({
      code: "bot-protection",
      severity: "warning",
      message: `${forbidden} of ${results.length} sampled URLs answered 403 Forbidden to our checker`,
      fix: "This is usually a firewall or bot-protection rule, so those results are inconclusive. Confirm in Search Console (URL Inspection) that Googlebot is allowed through.",
      count: forbidden,
      examples: [],
    });
  }
  const inconclusive = (r: SampleResult) => r.verdict === "blocked-us" || (botWall && r.status === 403);
  const problems = results.filter((r) => r.verdict !== "ok" && r.verdict !== "ok-non-html" && !inconclusive(r));
  const tested = results.filter((r) => !inconclusive(r)).length;
  const estimatedAffected = tested ? Math.round((problems.length / tested) * unique.length) : 0;

  const issues = mergeIssues([...loaded.files.map((f) => f.issues), extra]);

  // Score: protocol errors weigh most, then the live sample's problem rate.
  let score = found ? 100 : 0;
  if (found) {
    for (const it of issues) score -= it.severity === "error" ? 18 : it.severity === "warning" ? 6 : 1;
    // Every bad URL costs a little; a high problem rate costs a lot.
    if (tested) score -= Math.min(25, problems.length * 2) + Math.round((problems.length / tested) * 40);
    score = Math.max(0, Math.min(100, score));
  }

  const fileList = loaded.files.map((f) => ({ ...f, children: undefined }));
  return {
    input: input.href,
    host,
    checkedAt: Date.now(),
    durationMs: Date.now() - t0,
    found,
    discoveredVia,
    robots: { url: robots.url, found: robots.found, declares, declaresChecked: discoveredVia === "robots" },
    files: fileList,
    totals: {
      urls: loaded.urls.length,
      uniqueUrls: unique.length,
      files: loaded.files.length,
      indexes: loaded.files.filter((f) => f.kind === "sitemapindex").length,
      gzipFiles: loaded.files.filter((f) => f.gzip).length,
      withLastmod: loaded.urls.filter((u) => u.lastmod).length,
      images: loaded.urls.reduce((s, u) => s + u.images, 0),
      hreflang: loaded.urls.reduce((s, u) => s + u.hreflang, 0),
      truncated: loaded.truncated,
    },
    issues,
    sample: { size: results.length, results, problemCount: problems.length, estimatedAffected },
    score,
  };
}

export { SafeFetchError };
