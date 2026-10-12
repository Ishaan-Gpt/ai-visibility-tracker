import "server-only";
import { crawlSite, EXCLUDE_LABEL, loadRobots, type CrawlProgress, type FetchedPage } from "@/lib/crawl";
import { normalizeUrl } from "@/lib/net/safeFetch";
import { analyzePage } from "./analyze";
import { CATEGORY_ORDER } from "./scoring";
import type { SiteAuditReport, SiteIssueGroup, SitePage, SitePageIssue } from "./siteTypes";
import type { AuditCheck, PageAuditReport, Severity } from "./types";

/*
 * Whole-site audit: crawl the site (sitemaps + links, robots.txt respected), run the same pure per-page analysis the
 * single-page audit uses on every HTML page, then aggregate issues across pages with the affected URLs. Network
 * enrichers (live link checks, AI probe, PageSpeed) are single-page only; site-level link health comes from the crawl.
 */

const PAGE_ITEMS = 8;
const GROUP_PAGES = 500;
const RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 };
const DEEP = 3;

/** Site-wide labels for per-page checks whose page titles carry page-specific numbers. */
const GROUP_LABEL: Record<string, string> = {
  title: "Title missing, too short or too long",
  "title-dup": "More than one <title> tag",
  description: "Meta description missing, too short or too long",
  "description-dup": "More than one meta description",
  "description-same": "Meta description repeats the title",
  h1: "Missing or multiple H1 headings",
  words: "Thin content",
  "text-ratio": "Low text-to-HTML ratio",
  headings: "Empty headings",
  "headings-order": "Skipped heading levels",
  "img-dimensions": "Images without width/height",
  "lazy-hero": "Top-of-page image is lazy-loaded",
  "lazy-offscreen": "Offscreen images load eagerly",
  "render-blocking": "Render-blocking scripts or styles in <head>",
  ttfb: "Slow server response",
  "dom-size": "Very large DOM",
  "html-size": "Large HTML document",
  caching: "Weak caching headers",
  compression: "HTML not compressed",
  og: "Missing Open Graph tags",
  twitter: "No Twitter/X card",
  "empty-anchors": "Links with no text",
  "generic-anchors": "Links with generic anchor text",
  "nofollow-internal": "Internal links marked nofollow",
  canonical: "Canonical tag problems",
  "mixed-content": "Mixed content (http:// resources on https:// pages)",
  "security-headers": "Missing security headers",
  "schema-required": "Structured data missing required properties",
  "schema-types": "Unknown or superseded schema types",
  "ai-text": "Little text in the raw HTML (AI crawlers can't read it)",
  "ai-summary": "No usable one-line summary for AI answers",
  "ai-schema": "No entity-level structured data",
  "ai-bots": "robots.txt blocks AI search crawlers",
  "ai-snippet": "Snippets or AI use disabled",
};
/** Per-page checks that a dedicated site-wide group reports better (deduplicated images). */
const SITE_REPLACES = new Set(["alt", "alt-empty"]);

interface Analysed {
  report: PageAuditReport;
  links: FetchedPage["links"];
}

export async function auditSite(
  input: string,
  opts: { maxPages: number; timeBudgetMs: number; signal?: AbortSignal; onProgress?: (p: CrawlProgress) => void },
): Promise<SiteAuditReport> {
  const started = Date.now();
  const base = normalizeUrl(input);
  const robots = await loadRobots(`${base.protocol}//${base.host}`, opts.signal);
  const analysed = new Map<string, Analysed>();

  const crawl = await crawlSite(
    { url: base.href, maxPages: opts.maxPages, timeBudgetMs: opts.timeBudgetMs, signal: opts.signal },
    {
      onProgress: opts.onProgress,
      onPage: (p) => {
        if (!p.isHtml || !p.html || p.status < 200 || p.status >= 300) return;
        try {
          const { report } = analyzePage({
            url: p.url,
            finalUrl: p.finalUrl,
            status: p.status,
            headers: p.headers,
            html: p.html,
            redirects: p.redirects,
            elapsedMs: p.elapsedMs,
            truncated: p.truncated,
            robots: robots.found ? robots.parsed : null,
          });
          analysed.set(p.url, { report, links: p.links });
        } catch (err) {
          console.warn("[site-audit] analyse failed", p.url, err instanceof Error ? err.message : err);
        }
      },
    },
  );

  const pages: SitePage[] = crawl.pages.map((cp) => {
    const a = analysed.get(cp.url)?.report;
    const failing = a ? [...a.checks.filter((c) => c.severity === "error" || c.severity === "warning"), ...a.ai.checks.filter((c) => c.severity === "error" || c.severity === "warning")] : [];
    return {
      url: cp.url,
      status: cp.status,
      excluded: cp.reason ? `${EXCLUDE_LABEL[cp.reason]}${cp.detail ? `: ${cp.detail}` : ""}` : null,
      depth: cp.depth,
      inlinks: cp.inlinks,
      inSitemap: cp.inSitemap,
      title: a?.facts.title ?? cp.title ?? null,
      h1: a?.facts.h1[0] ?? cp.h1 ?? null,
      words: a?.facts.wordCount ?? 0,
      ms: cp.ms ?? 0,
      score: a ? a.score : null,
      aiScore: a ? a.ai.score : null,
      errors: a?.summary.errors ?? 0,
      warnings: a?.summary.warnings ?? 0,
      schemaTypes: a?.structuredData?.items.map((i) => i.types.join(" + ")) ?? [],
      issues: failing
        .sort((x, y) => RANK[x.severity] - RANK[y.severity])
        .map((c): SitePageIssue => ({ id: c.id, severity: c.severity, title: c.title, items: c.items?.slice(0, PAGE_ITEMS) })),
    };
  });

  const indexable = pages.filter((p) => !p.excluded && p.status !== null && p.status >= 200 && p.status < 300);
  const scored = indexable.filter((p) => p.score !== null);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);

  const issues = [...perPageGroups(analysed), ...siteGroups(analysed, pages, crawl.pages)].sort(
    (a, b) => RANK[a.severity] - RANK[b.severity] || b.count - a.count,
  );

  const categories = CATEGORY_ORDER.flatMap((id) => {
    const xs = [...analysed.values()].flatMap((a) => a.report.categories?.filter((c) => c.id === id).map((c) => c.score) ?? []);
    return xs.length ? [{ id, score: avg(xs) }] : [];
  });

  // Site score: average page score, minus a penalty for site-wide errors that no single page owns.
  const siteErrors = issues.filter((i) => i.category === "Site" && i.severity === "error").length;
  const score = Math.max(0, avg(scored.map((p) => p.score!)) - siteErrors * 3);

  return {
    startUrl: crawl.startUrl,
    resolvedUrl: crawl.resolvedUrl,
    host: crawl.host,
    stoppedBy: crawl.stoppedBy,
    cap: crawl.cap,
    durationMs: Date.now() - started,
    checkedAt: Date.now(),
    score,
    aiScore: avg(scored.map((p) => p.aiScore ?? 0)),
    totals: {
      crawled: crawl.summary.crawled,
      analysed: analysed.size,
      indexable: indexable.length,
      excluded: pages.filter((p) => p.excluded).length,
      broken: crawl.summary.broken,
      redirects: crawl.summary.redirects,
      errors: issues.filter((i) => i.severity === "error").reduce((s, i) => s + i.count, 0),
      warnings: issues.filter((i) => i.severity === "warning").reduce((s, i) => s + i.count, 0),
      sitemapUrls: crawl.sitemaps.urlCount,
      linkCrawlComplete: crawl.linkCrawlComplete,
    },
    categories,
    issues,
    crawlIssues: crawl.issues,
    pages: pages.sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || a.url.localeCompare(b.url)),
    robots: { found: crawl.robots.found, sitemaps: crawl.robots.sitemaps },
    sitemaps: { found: crawl.sitemaps.found, urlCount: crawl.sitemaps.urlCount, files: crawl.sitemaps.files.map((f) => ({ url: f.url, status: f.status, urlCount: f.urlCount, error: f.error })) },
  };
}

/** Groups every failing per-page check by id across the site, keeping each page's own evidence. */
function perPageGroups(analysed: Map<string, Analysed>): SiteIssueGroup[] {
  const groups = new Map<string, SiteIssueGroup & { titles: Map<string, number> }>();
  type Groupable = Pick<AuditCheck, "id" | "severity" | "title" | "detail" | "fix" | "items"> & { category: SiteIssueGroup["category"] };
  const push = (url: string, c: Groupable) => {
    if ((c.severity !== "error" && c.severity !== "warning") || SITE_REPLACES.has(c.id)) return;
    const key = c.id;
    let g = groups.get(key);
    if (!g) {
      g = { id: key, severity: c.severity, category: c.category, title: c.title, detail: c.detail, fix: c.fix ?? "", count: 0, pages: [], titles: new Map() };
      groups.set(key, g);
    }
    if (RANK[c.severity] < RANK[g.severity]) g.severity = c.severity;
    g.count++;
    g.titles.set(c.title, (g.titles.get(c.title) ?? 0) + 1);
    if (g.pages.length < GROUP_PAGES) g.pages.push({ url, note: c.title, items: c.items?.slice(0, PAGE_ITEMS) });
  };
  for (const [url, a] of analysed) {
    for (const c of a.report.checks) push(url, c);
    for (const c of a.report.ai.checks) push(url, { ...c, category: "AI readiness" });
  }
  return [...groups.values()].map(({ titles, ...g }) => {
    // Per-page titles carry numbers ("Title is short (22 chars)"); summarise with the most common phrasing, number-free.
    const common = [...titles.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const generic = GROUP_LABEL[g.id] ?? (titles.size === 1 && !/\d/.test(common) ? common : common.replace(/\s*\([^)]*\d[^)]*\)/g, "").replace(/^\d[\d,]*\s+(of\s+\d[\d,]*\s+)?/, "").trim());
    return { ...g, title: `${generic.charAt(0).toUpperCase()}${generic.slice(1)} (${g.count} page${g.count > 1 ? "s" : ""})` };
  });
}

/** Issues that only exist across pages: duplicates, broken internal links with their sources, depth, thin content… */
function siteGroups(analysed: Map<string, Analysed>, pages: SitePage[], crawlPages: { url: string; status: number | null; redirectTo?: string }[]): SiteIssueGroup[] {
  const out: SiteIssueGroup[] = [];
  const idx = pages.filter((p) => !p.excluded && p.status !== null && p.status >= 200 && p.status < 300 && analysed.has(p.url));

  const dupes = (id: string, label: string, pick: (r: PageAuditReport) => string | null | undefined, fix: string) => {
    const by = new Map<string, string[]>();
    for (const p of idx) {
      const v = pick(analysed.get(p.url)!.report)?.trim().toLowerCase();
      if (!v) continue;
      by.set(v, [...(by.get(v) ?? []), p.url]);
    }
    const sets = [...by.entries()].filter(([, urls]) => urls.length > 1).sort((a, b) => b[1].length - a[1].length);
    if (!sets.length) return;
    const count = sets.reduce((s, [, u]) => s + u.length, 0);
    out.push({ id, severity: "warning", category: "Site", title: `Duplicate ${label} on ${count} pages (${sets.length} group${sets.length > 1 ? "s" : ""})`, detail: `Pages sharing the same ${label} compete with each other and look like duplicates to search engines.`, fix, count, pages: sets.slice(0, 100).flatMap(([v, urls]) => urls.map((url) => ({ url, note: `"${v.slice(0, 120)}" — shared by ${urls.length} pages` }))) });
  };
  dupes("dup-title", "titles", (r) => r.facts.title, "Give every page a unique title that names its specific topic.");
  dupes("dup-description", "meta descriptions", (r) => r.facts.description, "Write a unique meta description for each page.");
  dupes("dup-h1", "H1 headings", (r) => r.facts.h1[0], "Give every page its own H1 describing that page.");

  // Broken internal links, with the pages that link to them and the anchor text.
  const status = new Map(crawlPages.map((p) => [p.url, p]));
  const sources = new Map<string, { from: string; anchor: string }[]>();
  for (const [from, a] of analysed) {
    for (const l of a.links) {
      if (!l.internal) continue;
      const s = status.get(l.target);
      if (!s) continue;
      if ((s.status !== null && s.status >= 400) || s.status === 0) sources.set(l.target, [...(sources.get(l.target) ?? []), { from, anchor: l.anchor }]);
    }
  }
  if (sources.size) {
    const list = [...sources.entries()];
    out.push({ id: "broken-internal", severity: "error", category: "Site", title: `${list.length} broken internal URL${list.length > 1 ? "s" : ""} linked from your pages`, detail: "Visitors and crawlers hit dead ends; link equity is wasted.", fix: "Fix the link on each source page, or 301-redirect the dead URL to its closest live page.", count: list.length, pages: list.slice(0, GROUP_PAGES).map(([url, src]) => ({ url, note: `HTTP ${status.get(url)?.status || "no response"} · linked from ${src.length} place${src.length > 1 ? "s" : ""}`, items: src.slice(0, PAGE_ITEMS).map((s) => `${s.from} · "${s.anchor || "(no text)"}"`) })) });
  }

  // Internal links that point at redirects.
  const redirected = new Map<string, string[]>();
  for (const [from, a] of analysed) {
    for (const l of a.links) {
      const s = l.internal ? status.get(l.target) : undefined;
      if (s?.redirectTo) redirected.set(l.target, [...(redirected.get(l.target) ?? []), from]);
    }
  }
  if (redirected.size) {
    const list = [...redirected.entries()];
    out.push({ id: "links-to-redirects", severity: "warning", category: "Site", title: `Internal links point to ${list.length} redirecting URL${list.length > 1 ? "s" : ""}`, detail: "Every redirect costs a round trip and some link equity.", fix: "Update the links to point straight at the final URL.", count: list.length, pages: list.slice(0, GROUP_PAGES).map(([url, from]) => ({ url, note: `→ ${status.get(url)?.redirectTo}`, items: [...new Set(from)].slice(0, PAGE_ITEMS) })) });
  }

  const deep = idx.filter((p) => p.depth !== null && p.depth > DEEP);
  if (deep.length) out.push({ id: "deep-pages", severity: "warning", category: "Site", title: `${deep.length} page${deep.length > 1 ? "s" : ""} more than ${DEEP} clicks from the homepage`, detail: "Deep pages get crawled less often and receive less internal authority.", fix: "Link to them from the homepage, hubs or category pages so they sit within 3 clicks.", count: deep.length, pages: deep.map((p) => ({ url: p.url, note: `${p.depth} clicks deep` })) });

  const noSchema = idx.filter((p) => !p.schemaTypes.length);
  if (noSchema.length) out.push({ id: "no-schema", severity: "warning", category: "Site", title: `${noSchema.length} page${noSchema.length > 1 ? "s" : ""} without structured data`, detail: "No JSON-LD, microdata or RDFa, so no rich results and less for AI systems to extract.", fix: "Add schema for each page type (Article, Product, Service, FAQPage…) with the Schema Generator.", count: noSchema.length, pages: noSchema.map((p) => ({ url: p.url })) });

  // Images missing alt, de-duplicated across the site (logos and icons repeat on every page).
  const imgs = new Map<string, { state: string; pages: Set<string> }>();
  for (const [url, a] of analysed) {
    for (const im of a.report.images?.items ?? []) {
      if (im.state !== "missing" && im.state !== "empty-content") continue;
      const e = imgs.get(im.src) ?? { state: im.state, pages: new Set<string>() };
      e.pages.add(url);
      imgs.set(im.src, e);
    }
  }
  if (imgs.size) {
    const list = [...imgs.entries()].sort((a, b) => b[1].pages.size - a[1].pages.size);
    out.push({ id: "site-alt", severity: "warning", category: "Site", title: `${list.length} unique image${list.length > 1 ? "s" : ""} missing alt text`, detail: "Missing alt attribute or an empty alt on what looks like a content image. Fixing a shared image (logo, template image) fixes every page it appears on.", fix: "Add a short description of each image in its alt attribute; keep alt=\"\" only for decoration.", count: list.length, pages: list.slice(0, GROUP_PAGES).map(([src, e]) => ({ url: src, note: `${e.state === "missing" ? "no alt attribute" : 'alt=""'} · on ${e.pages.size} page${e.pages.size > 1 ? "s" : ""}`, items: [...e.pages].slice(0, PAGE_ITEMS) })) });
  }
  return out;
}
