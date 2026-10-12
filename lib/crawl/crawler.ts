import "server-only";
import { normalizeUrl, safeFetch, SafeFetchError, type SafeResponse } from "@/lib/net/safeFetch";
import { extractPage, headerCanonical, headerNoindex, looksSoft404, metaNoindex } from "@/lib/crawl/html";
import { allowedFor, BOT_TOKEN, loadRobots, type SiteRobots } from "@/lib/crawl/robots";
import { DEFAULT_SITEMAP_PATHS, FALLBACK_SITEMAP_PATHS, loadSitemaps } from "@/lib/crawl/sitemaps";
import { buildReport } from "@/lib/crawl/report";
import { compilePatterns, inScope, isAssetUrl, isW3cDatetime, normalizeCrawlUrl, siteKey, toW3cDate, trapReason, variantKey } from "@/lib/crawl/url";
import type { CrawlHooks, CrawlOptions, CrawlPage, CrawlProgress, CrawlResult, LinkEdge, SitemapFileInfo, StopReason } from "@/lib/crawl/types";

export type { CrawlHooks, CrawlOptions, CrawlResult, FetchedPage } from "@/lib/crawl/types";

const MAX_NODES = 60_000;
const MAX_VARIANTS_PER_PATH = 25;
const MAX_SKIPPED_IN_RESULT = 1_500;

interface Node {
  page: CrawlPage;
  state: "queued" | "fetching" | "done" | "skipped";
  inLinkQ: boolean;
  inSitemapQ: boolean;
  sitemapLastmod?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function friendlyFetchError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ENOTFOUND|EAI_AGAIN|ENODATA/.test(msg)) return "DNS lookup failed";
  if (/too long|ETIMEDOUT|timeout/i.test(msg)) return "Timed out";
  if (/ECONNREFUSED/.test(msg)) return "Connection refused";
  if (/ECONNRESET|socket hang up/i.test(msg)) return "Connection reset";
  if (/CERT|SSL|TLS/i.test(msg)) return "TLS/certificate error";
  return msg.replace(/^Could not reach the site /, "").slice(0, 120);
}

/**
 * Polite BFS site crawler. Reads robots.txt (for the "seowise-bot" token) and the site's XML
 * sitemaps, then follows links within the start host (www and apex are one site; subdomains on
 * request) up to `maxPages` and `timeBudgetMs`. Pages are fetched without following redirects so
 * every redirect is recorded as its own row. Never throws for per-page failures; throws
 * SafeFetchError only when the start URL is invalid, unreachable or disallowed.
 */
export async function crawlSite(options: CrawlOptions, hooks: CrawlHooks = {}): Promise<CrawlResult> {
  const t0 = Date.now();
  const budgetMs = clamp(options.timeBudgetMs ?? 50_000, 5_000, 790_000);
  const deadline = t0 + budgetMs;
  const cap = clamp(Math.floor(options.maxPages || 0), 1, 50_000);
  const maxDepth = clamp(options.maxDepth ?? 25, 1, 100);
  const maxBytes = clamp(options.maxPageBytes ?? 1_500_000, 50_000, 5_000_000);
  const includeSubdomains = !!options.includeSubdomains;
  const exclude = compilePatterns(options.excludePatterns ?? []);
  const signal = options.signal;

  const startUrl = normalizeCrawlUrl(normalizeUrl(options.url).href);
  if (!startUrl) throw new SafeFetchError("That doesn't look like a valid URL.");

  const nodes = new Map<string, Node>();
  const linkQ: Node[] = [];
  const smQ: Node[] = [];
  let lh = 0;
  let sh = 0;
  let started = 0;
  let inFlight = 0;
  let fetched = 0;
  let skippedTotal = 0;
  let overflow = 0;
  let assetsSkipped = 0;
  let externalLinks = 0;
  let trapCount = 0;
  const trapExamples: string[] = [];
  const variants = new Map<string, number>();
  let stopped = false;
  let finalized = false;
  let stoppedBy: StopReason = "complete";
  let phase: CrawlProgress["phase"] = "robots";
  let current: string | undefined;
  let sitemapUrlCount = 0;
  let sitemapFileCount = 0;
  let baseHost = siteKey(new URL(startUrl).hostname);

  /* ---------- progress ---------- */
  let lastEmit = 0;
  const emit = (force = false) => {
    if (!hooks.onProgress) return;
    const now = Date.now();
    if (!force && now - lastEmit < 200) return;
    lastEmit = now;
    let queued = 0;
    for (let k = lh; k < linkQ.length; k++) if (linkQ[k].state === "queued") queued++;
    for (let k = sh; k < smQ.length; k++) if (smQ[k].state === "queued" && !smQ[k].inLinkQ) queued++;
    try {
      hooks.onProgress({ phase, crawled: fetched, queued, discovered: nodes.size, sitemapUrls: sitemapUrlCount, sitemapFiles: sitemapFileCount, cap, elapsedMs: now - t0, budgetMs, current });
    } catch {
      /* caller errors never break the crawl */
    }
  };

  /* ---------- robots (per origin) ---------- */
  const robotsCache = new Map<string, Promise<SiteRobots>>();
  const robotsDone = new Map<string, SiteRobots>();
  const getRobots = (origin: string) => {
    let p = robotsCache.get(origin);
    if (!p) {
      p = loadRobots(origin, signal)
        .catch(() => ({ url: `${origin}/robots.txt`, found: false, status: null, disallowAll: true, parsed: { groups: [], sitemaps: [] }, crawlDelay: null, sitemaps: [] }) as SiteRobots)
        .then((r) => {
          robotsDone.set(origin, r);
          return r;
        });
      robotsCache.set(origin, p);
    }
    return p;
  };

  /* ---------- scheduling ---------- */
  let waiters: (() => void)[] = [];
  const notify = () => {
    const w = waiters;
    waiters = [];
    w.forEach((f) => f());
  };
  const waitForChange = () => new Promise<void>((r) => waiters.push(r));
  const onAbort = () => {
    stopped = true;
    stoppedBy = "aborted";
    notify();
  };
  signal?.addEventListener("abort", onAbort);

  const skip = (node: Node, reason: CrawlPage["reason"], detail?: string) => {
    node.state = "skipped";
    node.page.reason = reason;
    if (detail) node.page.detail = detail;
    skippedTotal++;
  };

  const discover = (url: string, depth: number, from: CrawlPage | null) => {
    let node = nodes.get(url);
    if (node) {
      if (from && from.url !== url) {
        node.page.inlinks++;
        node.page.foundOn ??= from.url;
      }
      if (node.page.depth === null || (node.state === "queued" && depth < node.page.depth)) node.page.depth = depth;
      if (node.state === "queued" && !node.inLinkQ) {
        node.inLinkQ = true;
        linkQ.push(node);
      }
      return;
    }
    if (nodes.size >= MAX_NODES) {
      overflow++;
      return;
    }
    node = { page: { url, status: null, reason: null, depth, inlinks: from ? 1 : 0, foundOn: from?.url, inSitemap: false }, state: "queued", inLinkQ: false, inSitemapQ: false };
    nodes.set(url, node);
    if (exclude?.(url)) return skip(node, "pattern");
    const trap = trapReason(url) ?? (depth > maxDepth ? `More than ${maxDepth} clicks from the start page` : null);
    if (trap) {
      trapCount++;
      if (trapExamples.length < 8) trapExamples.push(url);
      return skip(node, "trap", trap);
    }
    const vk = variantKey(url);
    if (vk) {
      const n = (variants.get(vk) ?? 0) + 1;
      variants.set(vk, n);
      if (n > MAX_VARIANTS_PER_PATH) {
        trapCount++;
        if (trapExamples.length < 8) trapExamples.push(url);
        return skip(node, "trap", `More than ${MAX_VARIANTS_PER_PATH} query-string variants of this path`);
      }
    }
    node.inLinkQ = true;
    linkQ.push(node);
  };

  /* ---------- per-response processing ---------- */
  const process = (node: Node, res: SafeResponse, redirects: string[]) => {
    const p = node.page;
    node.state = "done";
    fetched++;
    p.status = res.status;
    p.ms = res.elapsedMs;
    p.bytes = res.bytes;
    const ct = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    if (ct) p.contentType = ct;
    let html = "";
    let isHtml = false;
    const edges: LinkEdge[] = [];
    const depth = p.depth ?? 0;

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers["location"];
      const target = loc ? normalizeCrawlUrl(loc, p.url) : null;
      p.reason = "redirect";
      p.redirectTo = target ?? loc ?? undefined;
      if (!loc) p.detail = "Redirect without a Location header";
      if (target && target !== p.url && inScope(target, baseHost, includeSubdomains) && !isAssetUrl(target)) discover(target, depth, null);
    } else if (res.status >= 500) p.reason = "server-error";
    else if (res.status >= 400) p.reason = "client-error";
    else if (res.status < 200) p.reason = "fetch-error";
    else {
      isHtml = /html|xhtml/.test(ct) || (!ct && /<html|<!doctype html/i.test(res.body.slice(0, 600)));
      if (!isHtml) p.reason = "non-html";
      else {
        html = res.body;
        const f = extractPage(html, p.url);
        p.title = f.title;
        p.h1 = f.h1;
        const noindex = metaNoindex(f.metaRobots) || headerNoindex(res.headers["x-robots-tag"]);
        const canonRaw = f.canonical ?? headerCanonical(res.headers["link"], p.url);
        const canon = canonRaw ? normalizeCrawlUrl(canonRaw) : null;
        if (canon && canon !== p.url) p.canonical = canon;
        if (f.images.length) p.images = f.images;
        if (f.hreflang.length) p.hreflang = f.hreflang;
        if (res.status === 200 && looksSoft404(f.title, f.h1)) p.soft404 = true;

        const pageDate = toW3cDate(f.modified);
        const lm = res.headers["last-modified"];
        const lmTime = lm ? Date.parse(lm) : NaN;
        // A Last-Modified of "right now" is a dynamic page stamping the request time, not a real date.
        const headerDate = !Number.isNaN(lmTime) && Math.abs(Date.now() - lmTime) > 120_000 ? toW3cDate(lm) : undefined;
        if (node.sitemapLastmod) {
          p.lastmod = node.sitemapLastmod;
          p.lastmodSource = "sitemap";
        } else if (pageDate) {
          p.lastmod = pageDate;
          p.lastmodSource = "page";
        } else if (headerDate) {
          p.lastmod = headerDate;
          p.lastmodSource = "header";
        }

        if (f.refresh) {
          const target = normalizeCrawlUrl(f.refresh);
          if (target && target !== p.url) {
            p.reason = "redirect";
            p.redirectTo = target;
            p.detail = "Meta refresh";
            if (inScope(target, baseHost, includeSubdomains)) discover(target, depth, null);
          }
        }
        if (!p.reason && noindex) {
          p.reason = "noindex";
          p.detail = metaNoindex(f.metaRobots) ? "meta robots" : "X-Robots-Tag header";
        } else if (!p.reason && p.canonical) {
          p.reason = "canonicalised";
          p.detail = p.canonical;
        }
        if (p.canonical && inScope(p.canonical, baseHost, includeSubdomains) && !isAssetUrl(p.canonical)) discover(p.canonical, depth, null);

        const seenTargets = new Set<string>();
        for (const href of f.links) {
          const t = normalizeCrawlUrl(href);
          if (!t || seenTargets.has(t)) continue;
          seenTargets.add(t);
          if (!inScope(t, baseHost, includeSubdomains)) {
            externalLinks++;
            continue;
          }
          if (isAssetUrl(t)) {
            assetsSkipped++;
            continue;
          }
          if (t !== p.url) discover(t, depth + 1, p);
        }
        if (hooks.onPage) {
          for (const a of f.anchors) {
            const t = normalizeCrawlUrl(a.href);
            if (t) edges.push({ target: t, anchor: a.text, nofollow: a.nofollow, internal: inScope(t, baseHost, includeSubdomains) });
          }
        }
      }
    }
    if (!p.lastmod && node.sitemapLastmod) {
      p.lastmod = node.sitemapLastmod;
      p.lastmodSource = "sitemap";
    }
    if (hooks.onPage) {
      try {
        hooks.onPage({ url: p.url, finalUrl: p.url, status: res.status, headers: res.headers, redirectTo: p.redirectTo, redirects, elapsedMs: res.elapsedMs, depth: p.depth, html, truncated: res.truncated, isHtml, links: edges, page: p });
      } catch {
        /* caller errors never break the crawl */
      }
    }
  };

  const fetchFailed = (node: Node, err: unknown) => {
    node.state = "done";
    fetched++;
    node.page.status = 0;
    node.page.reason = "fetch-error";
    node.page.detail = friendlyFetchError(err);
    if (hooks.onPage) {
      try {
        hooks.onPage({ url: node.page.url, finalUrl: node.page.url, status: 0, headers: {}, redirects: [], elapsedMs: 0, depth: node.page.depth, html: "", truncated: false, isHtml: false, links: [], page: node.page });
      } catch {
        /* ignore */
      }
    }
  };

  /* ---------- crawl-delay gate ---------- */
  let nextSlot = 0;
  let crawlDelayMs = 0;
  const gate = async () => {
    if (!crawlDelayMs) return;
    const now = Date.now();
    const at = Math.max(now, nextSlot);
    nextSlot = at + crawlDelayMs;
    if (at > now) await sleep(at - now);
  };

  const fetchPage = (url: string) =>
    safeFetch(url, { maxRedirects: 0, maxBytes, timeoutMs: clamp(deadline - Date.now(), 2_000, 12_000) });

  /* ---------- 1. robots.txt + start URL resolution ---------- */
  emit(true);
  const startOrigin = new URL(startUrl).origin;
  const robots0 = await getRobots(startOrigin);
  if (!allowedFor(robots0, BOT_TOKEN, startUrl)) {
    signal?.removeEventListener("abort", onAbort);
    throw new SafeFetchError(
      robots0.disallowAll
        ? `${startOrigin}/robots.txt could not be read (server error or timeout). Under the robots.txt standard (RFC 9309) that means "crawl nothing", so we stopped.`
        : `${startOrigin}/robots.txt disallows our crawler (seowise-Bot) from this URL, so we didn't crawl it.`,
    );
  }

  // Follow the start URL's redirects hop by hop so each hop is recorded and robots-checked.
  let resolved = startUrl;
  let startRes: SafeResponse | null = null;
  const hops: string[] = [];
  for (let hop = 0; hop < 6; hop++) {
    const node: Node = { page: { url: resolved, status: null, reason: null, depth: 0, inlinks: 0, inSitemap: false }, state: "fetching", inLinkQ: true, inSitemapQ: false };
    nodes.set(resolved, node);
    current = resolved;
    started++;
    let res: SafeResponse;
    try {
      res = await fetchPage(resolved);
    } catch (err) {
      signal?.removeEventListener("abort", onAbort);
      const msg = err instanceof Error ? err.message : "";
      if (/ENOTFOUND|EAI_AGAIN|ENODATA/.test(msg)) throw new SafeFetchError("We couldn't find that domain. Check the spelling.");
      if (err instanceof SafeFetchError && /not allowed/.test(msg)) throw err;
      throw new SafeFetchError(`${resolved} didn't respond (${friendlyFetchError(err)}). The site may be down or blocking automated requests.`);
    }
    const loc = res.headers["location"];
    const target = res.status >= 300 && res.status < 400 && loc ? normalizeCrawlUrl(loc, resolved) : null;
    if (target && target !== resolved && !nodes.has(target)) {
      process(node, res, []);
      hops.push(`${res.status} ${resolved}`);
      nodes.delete(target); // process() may have queued it; we fetch it here instead
      const idx = linkQ.findIndex((n) => n.page.url === target);
      if (idx !== -1) linkQ.splice(idx, 1);
      resolved = target;
      baseHost = siteKey(new URL(resolved).hostname);
      const r = await getRobots(new URL(resolved).origin);
      if (!allowedFor(r, BOT_TOKEN, resolved)) {
        signal?.removeEventListener("abort", onAbort);
        throw new SafeFetchError(`${startUrl} redirects to ${resolved}, and that site's robots.txt disallows our crawler (seowise-Bot).`);
      }
      continue;
    }
    startRes = res;
    process(node, res, hops);
    break;
  }
  if (!startRes) {
    signal?.removeEventListener("abort", onAbort);
    throw new SafeFetchError("The start URL redirects too many times.");
  }
  if (startRes.status >= 400) {
    // Keep going (sitemaps may still list pages), but the result will show the error.
  }
  const resolvedOrigin = new URL(resolved).origin;
  const siteRobots = await getRobots(resolvedOrigin);
  crawlDelayMs = siteRobots.crawlDelay ? clamp(siteRobots.crawlDelay, 0, 30) * 1000 : 0;
  const concurrency = crawlDelayMs ? 1 : clamp(options.concurrency ?? 6, 1, 8);

  /* ---------- 2. sitemaps (read in the background while the link crawl runs) ---------- */
  const sitemapFiles: SitemapFileInfo[] = [];
  let sitemapTruncated = false;
  let offsiteUrls = 0;
  let smOnly = 0;
  let sitemapsPending = false;
  const inSitemapSet = new Set<string>();
  const smAbort = new AbortController();
  signal?.addEventListener("abort", () => smAbort.abort());

  const mergeSitemapUrls = (recs: { loc: string; lastmod?: string }[]) => {
    if (finalized) return;
    for (const rec of recs) {
      const u = normalizeCrawlUrl(rec.loc);
      if (!u) continue;
      if (!inScope(u, baseHost, includeSubdomains)) {
        offsiteUrls++;
        continue;
      }
      if (inSitemapSet.has(u)) continue;
      inSitemapSet.add(u);
      const lastmod = rec.lastmod && isW3cDatetime(rec.lastmod) ? toW3cDate(rec.lastmod) : undefined;
      let node = nodes.get(u);
      if (node) {
        node.page.inSitemap = true;
        node.sitemapLastmod = lastmod;
        if (lastmod && node.state === "done" && node.page.lastmodSource !== "sitemap") {
          node.page.lastmod = lastmod;
          node.page.lastmodSource = "sitemap";
        }
        continue;
      }
      if (nodes.size >= MAX_NODES) {
        overflow++;
        continue;
      }
      node = { page: { url: u, status: null, reason: null, depth: null, inlinks: 0, inSitemap: true }, state: "queued", inLinkQ: false, inSitemapQ: true, sitemapLastmod: lastmod };
      nodes.set(u, node);
      if (exclude?.(u)) skip(node, "pattern");
      else if (isAssetUrl(u)) skip(node, "non-html", "File listed in the sitemap (not crawled)");
      else {
        smQ.push(node);
        smOnly++;
      }
    }
    sitemapUrlCount = inSitemapSet.size;
    notify();
  };

  let sitemapTask: Promise<void> = Promise.resolve();
  if (options.useSitemaps !== false && !stopped) {
    sitemapsPending = true;
    const smDeadline = Math.min(deadline - 2_000, Date.now() + budgetMs * 0.7);
    const declared = siteRobots.sitemaps.length ? siteRobots.sitemaps : robots0.sitemaps;
    const guesses = DEFAULT_SITEMAP_PATHS.map((p) => resolvedOrigin + p);
    const onFile = (f: SitemapFileInfo, _total: number, recs: { loc: string; lastmod?: string }[]) => {
      if (finalized) return;
      sitemapFileCount++;
      const { url, kind, status, urlCount, bytes, gzip, error } = f;
      sitemapFiles.push({ url, kind, status, urlCount, bytes, gzip, error });
      mergeSitemapUrls(recs);
      emit();
    };
    sitemapTask = (async () => {
      const first = await loadSitemaps(declared.length ? declared : guesses, { deadline: smDeadline, signal: smAbort.signal, optional: new Set(guesses), maxFiles: 40, maxUrls: 50_000, skipMediaSitemaps: true, onFile });
      sitemapTruncated = first.truncated;
      if (!first.files.some((f) => f.kind !== "unknown" && f.status === 200) && !smAbort.signal.aborted) {
        const fallbacks = FALLBACK_SITEMAP_PATHS.map((p) => resolvedOrigin + p);
        const more = await loadSitemaps(fallbacks, { deadline: smDeadline, signal: smAbort.signal, optional: new Set(fallbacks), maxFiles: 20, maxUrls: 50_000, skipMediaSitemaps: true, onFile });
        sitemapTruncated ||= more.truncated;
      }
    })()
      .catch(() => {
        sitemapTruncated = true;
      })
      .finally(() => {
        sitemapsPending = false;
        notify();
      });
  }

  /* ---------- 3. BFS crawl ---------- */
  phase = "crawl";
  emit(true);
  // Reserve part of the cap for sitemap-only URLs so their status gets checked even on big sites.
  const pick = (): Node | null => {
    while (lh < linkQ.length && linkQ[lh].state !== "queued") lh++;
    while (sh < smQ.length && smQ[sh].state !== "queued") sh++;
    if (started >= cap) return null;
    const linkBudget = cap - Math.min(smOnly, Math.floor(cap * 0.3));
    const linkAvail = lh < linkQ.length;
    const smAvail = sh < smQ.length;
    if (linkAvail && (started < linkBudget || !smAvail)) return linkQ[lh++];
    if (smAvail) return smQ[sh++];
    return null;
  };

  const crawlNode = async (node: Node) => {
    const url = node.page.url;
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      skip(node, "fetch-error", "Malformed URL");
      started--;
      return;
    }
    const r = await getRobots(origin);
    if (!allowedFor(r, BOT_TOKEN, url)) {
      skip(node, "blocked-robots", r.disallowAll ? "robots.txt unreachable (treated as disallow all)" : "Disallowed for seowise-Bot");
      started--;
      return;
    }
    await gate();
    if (stopped || finalized) {
      node.state = "queued";
      started--;
      return;
    }
    current = url;
    try {
      const res = await fetchPage(url);
      if (finalized) return;
      process(node, res, []);
    } catch (err) {
      if (finalized) return;
      fetchFailed(node, err);
    }
    emit();
  };

  const worker = async () => {
    while (!stopped) {
      const node = pick();
      if (!node) {
        if (inFlight === 0 && (!sitemapsPending || started >= cap)) return;
        await waitForChange();
        continue;
      }
      node.state = "fetching";
      started++;
      inFlight++;
      try {
        await crawlNode(node);
      } finally {
        inFlight--;
        notify();
      }
    }
  };

  if (!stopped) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeUp = new Promise<"time">((r) => {
      timer = setTimeout(() => r("time"), Math.max(0, deadline - Date.now()));
    });
    const aborted = new Promise<"abort">((r) => {
      if (signal?.aborted) r("abort");
      signal?.addEventListener("abort", () => r("abort"));
    });
    const outcome = await Promise.race([Promise.all(Array.from({ length: concurrency }, worker)).then(() => "done" as const), timeUp, aborted]);
    clearTimeout(timer);
    stopped = true;
    notify();
    if (outcome === "time") stoppedBy = "time-budget";
    else if (outcome === "abort") stoppedBy = "aborted";
  }
  finalized = true;
  const smWasPending = sitemapsPending;
  smAbort.abort();
  await Promise.race([sitemapTask, sleep(50)]);
  signal?.removeEventListener("abort", onAbort);
  try {
    hooks.onSitemapUrls?.(inSitemapSet);
  } catch {
    /* ignore */
  }
  phase = "finishing";
  current = undefined;

  // Anything still "fetching" when time ran out goes back to "not crawled".
  for (const n of nodes.values()) if (n.state === "fetching") n.state = "queued";
  const remainingQueued = [...nodes.values()].filter((n) => n.state === "queued");
  const linkCrawlComplete = !remainingQueued.some((n) => n.inLinkQ);
  if (stoppedBy === "complete" && remainingQueued.length > 0) stoppedBy = started >= cap ? "page-cap" : Date.now() >= deadline ? "time-budget" : "page-cap";
  emit(true);

  // Googlebot's view of robots.txt for sitemap URLs (independent of our own token's rules).
  const pages: CrawlPage[] = [];
  let skippedKept = 0;
  for (const n of nodes.values()) {
    if (n.page.inSitemap) {
      try {
        const r = robotsDone.get(new URL(n.page.url).origin);
        if (r && !allowedFor(r, "googlebot", n.page.url)) n.page.blockedForGoogle = true;
      } catch {
        /* ignore */
      }
    }
    if (n.state === "done") pages.push(n.page);
    else if (n.state === "skipped" && skippedKept < MAX_SKIPPED_IN_RESULT) {
      skippedKept++;
      pages.push(n.page);
    }
  }

  return buildReport({
    startUrl,
    resolvedUrl: resolved,
    host: baseHost,
    includeSubdomains,
    cap,
    stoppedBy,
    durationMs: Date.now() - t0,
    robots: { url: siteRobots.url, found: siteRobots.found, status: siteRobots.status, crawlDelay: siteRobots.crawlDelay, sitemaps: siteRobots.sitemaps },
    sitemaps: { found: sitemapFiles.some((f) => f.kind !== "unknown" && f.status === 200), files: sitemapFiles, urlCount: sitemapUrlCount, offsiteUrls, truncated: sitemapTruncated || smWasPending },
    linkCrawlComplete,
    pages,
    notCrawled: remainingQueued.length + overflow,
    discovered: nodes.size + overflow,
    assetsSkipped,
    externalLinks,
    traps: { count: trapCount, examples: trapExamples },
    skippedNotListed: Math.max(0, skippedTotal - skippedKept),
  });
}
