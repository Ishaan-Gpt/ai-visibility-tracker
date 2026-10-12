/** Turns raw crawl rows into the summary and Search-Console-style issue list. Pure; safe in the browser. */
import type { CrawlIssue, CrawlPage, CrawlResult, CrawlSummary, ExcludeReason } from "@/lib/crawl/types";

export interface ReportInput extends Omit<CrawlResult, "summary" | "issues" | "crawledAt"> {
  notCrawled: number;
  discovered: number;
  assetsSkipped: number;
  externalLinks: number;
  skippedNotListed: number;
}

export const isIndexable = (p: CrawlPage) => p.reason === null && p.status !== null && p.status >= 200 && p.status < 300;
const fetchedPage = (p: CrawlPage) => p.status !== null;

function issue(id: string, severity: CrawlIssue["severity"], title: string, detail: string, fix: string, rows: CrawlPage[], ex?: (p: CrawlPage) => string): CrawlIssue | null {
  if (!rows.length) return null;
  return { id, severity, title, detail, fix, count: rows.length, examples: rows.slice(0, 6).map(ex ?? ((p) => p.url)) };
}

export function buildReport(input: ReportInput): CrawlResult {
  const { pages } = input;
  const excluded: Partial<Record<ExcludeReason, number>> = {};
  for (const p of pages) if (p.reason) excluded[p.reason] = (excluded[p.reason] ?? 0) + 1;

  const indexable = pages.filter(isIndexable);
  const broken = pages.filter((p) => p.reason === "client-error" || p.reason === "server-error" || p.reason === "fetch-error");
  const redirects = pages.filter((p) => p.reason === "redirect");
  const sm = pages.filter((p) => p.inSitemap);
  const hasSitemap = input.sitemaps.found;
  const orphans = sm.filter((p) => fetchedPage(p) && p.depth === null && isIndexable(p));
  const missing = hasSitemap ? indexable.filter((p) => !p.inSitemap) : [];
  const smProblems = sm.filter((p) => (fetchedPage(p) && !isIndexable(p)) || p.reason === "blocked-robots" || p.blockedForGoogle);

  const summary: CrawlSummary = {
    crawled: pages.filter(fetchedPage).length,
    discovered: input.discovered,
    notCrawled: input.notCrawled,
    indexable: indexable.length,
    excluded,
    broken: broken.length,
    redirects: redirects.length,
    orphans: orphans.length,
    missingFromSitemap: missing.length,
    sitemapProblems: smProblems.length,
    imagesFound: pages.reduce((s, p) => s + (p.images?.length ?? 0), 0),
    hreflangPages: pages.filter((p) => p.hreflang?.length).length,
    assetsSkipped: input.assetsSkipped,
    externalLinks: input.externalLinks,
  };

  const withTarget = (p: CrawlPage) => (p.redirectTo ? `${p.url} → ${p.redirectTo}` : p.url);
  const withCanon = (p: CrawlPage) => (p.canonical ? `${p.url} → ${p.canonical}` : p.url);
  const withSource = (p: CrawlPage) => (p.foundOn ? `${p.url} (linked from ${p.foundOn})` : p.url);

  const fetchedRows = pages.filter(fetchedPage);
  const forbidden = fetchedRows.filter((p) => p.status === 403);
  const list: (CrawlIssue | null)[] = [
    fetchedRows.length >= 3 && forbidden.length / fetchedRows.length >= 0.5
      ? {
          id: "bot-wall",
          severity: "warning",
          title: "The site blocked our crawler (403 Forbidden)",
          detail: `${forbidden.length} of ${fetchedRows.length} pages answered 403. That is almost always a firewall or bot-protection rule reacting to an automated visitor, so this crawl is incomplete.`,
          fix: "If this is your site, allow the seowise-Bot user agent in your firewall/CDN, or build the sitemap in Manual mode. Check in Search Console that Googlebot is not blocked too.",
          count: forbidden.length,
          examples: forbidden.slice(0, 3).map((p) => p.url),
        }
      : null,
    hasSitemap || input.sitemaps.files.length
      ? null
      : {
          id: "no-sitemap",
          severity: "warning",
          title: "No XML sitemap found",
          detail: `We checked robots.txt and the usual locations (/sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml) and found nothing.`,
          fix: "Generate one below, upload it to your site root and add a Sitemap: line to robots.txt.",
          count: 1,
          examples: [],
        },
    input.sitemaps.files.some((f) => f.error || f.status !== 200)
      ? {
          id: "sitemap-unreadable",
          severity: "error",
          title: "A sitemap file could not be read",
          detail: "Search engines will report this sitemap as \"Couldn't fetch\" or \"Sitemap could not be read\".",
          fix: "Make sure each sitemap URL returns 200 with valid XML. Use Validate mode for line-by-line errors.",
          count: input.sitemaps.files.filter((f) => f.error || f.status !== 200).length,
          examples: input.sitemaps.files.filter((f) => f.error || f.status !== 200).slice(0, 6).map((f) => `${f.url} (${f.error ?? `HTTP ${f.status}`})`),
        }
      : null,
    issue(
      "sm-noindex",
      "error",
      "Submitted URL marked noindex",
      "These URLs are in your sitemap but tell Google not to index them. Search Console reports them as errors.",
      "Remove them from the sitemap, or remove the noindex if they should rank.",
      sm.filter((p) => p.reason === "noindex"),
    ),
    issue(
      "sm-404",
      "error",
      "Submitted URL not found (4xx)",
      "These sitemap URLs return a client error, usually 404 or 410.",
      "Remove deleted pages from the sitemap, or restore/redirect them.",
      sm.filter((p) => p.reason === "client-error"),
      (p) => `${p.url} (${p.status})`,
    ),
    issue("sm-5xx", "error", "Submitted URL has a server error (5xx)", "These sitemap URLs failed with a server error or did not respond.", "Check your server logs; Google slows crawling when it sees repeated 5xx errors.", sm.filter((p) => p.reason === "server-error" || p.reason === "fetch-error"), (p) => `${p.url} (${p.status || p.detail})`),
    issue(
      "sm-robots",
      "error",
      "Submitted URL blocked by robots.txt",
      "These sitemap URLs are disallowed for Googlebot, so Google cannot crawl them.",
      "Either allow them in robots.txt or take them out of the sitemap.",
      sm.filter((p) => p.blockedForGoogle),
    ),
    issue(
      "sm-redirect",
      "warning",
      "Submitted URL is a redirect",
      "Sitemaps should list final URLs. Search Console reports these as \"Page with redirect\".",
      "Replace each with the URL it redirects to.",
      sm.filter((p) => p.reason === "redirect"),
      withTarget,
    ),
    issue(
      "sm-canonical",
      "warning",
      "Submitted URL is not the canonical",
      "These sitemap URLs declare a different canonical URL, so Google indexes the other one. Search Console reports \"Alternate page with proper canonical tag\".",
      "List only canonical URLs in the sitemap.",
      sm.filter((p) => p.reason === "canonicalised"),
      withCanon,
    ),
    issue("sm-soft404", "warning", "Submitted URL looks like a soft 404", "These return 200 but their title or heading reads like an error page.", "Return a real 404/410 for missing pages, or fix the content.", sm.filter((p) => p.soft404 && isIndexable(p))),
    issue(
      "orphans",
      "warning",
      input.linkCrawlComplete ? "Orphan pages (in sitemap, no internal links)" : "In the sitemap but not reached by links",
      input.linkCrawlComplete
        ? "These pages are only discoverable through the sitemap; nothing on the site links to them."
        : "We did not find a link to these pages in the pages we crawled. The crawl stopped early, so some may be linked from pages we did not reach.",
      "Link to important pages from relevant content or navigation. Internal links pass authority; sitemaps do not.",
      orphans,
    ),
    issue("missing", "warning", "Indexable pages missing from your sitemap", "We reached these pages by following links, but your current sitemap does not list them.", "Regenerate the sitemap below so it includes every indexable page.", missing),
    issue("broken", "error", "Broken internal links", "Pages on your site link to these URLs, which return errors.", "Fix or remove the links, or redirect the target to a live page.", broken.filter((p) => p.foundOn), withSource),
    issue("redirect-chain", "info", "Redirect chains", "These redirects point at another redirect.", "Point the first redirect (and your internal links) straight at the final URL.", redirects.filter((p) => p.redirectTo && redirects.some((r) => r.url === p.redirectTo)), withTarget),
    issue("soft404", "info", "Possible soft 404s", "These pages return 200 but look like error pages.", "Return a real 404 for missing content.", pages.filter((p) => p.soft404 && !p.inSitemap && isIndexable(p))),
    input.traps.count
      ? {
          id: "traps",
          severity: "info",
          title: "Crawl traps skipped",
          detail: "These URL patterns generate endless pages (calendars, repeating paths, action links, parameter combinations). We skipped them so the crawl stays useful.",
          fix: "Disallow them in robots.txt or add rel=\"nofollow\" so search engines don't waste crawl budget either.",
          count: input.traps.count,
          examples: input.traps.examples,
        }
      : null,
    input.robots.crawlDelay
      ? {
          id: "crawl-delay",
          severity: "info",
          title: `robots.txt asks for a ${input.robots.crawlDelay}s crawl delay`,
          detail: "We honoured it by fetching one page at a time, which limits how much we can crawl. Google ignores Crawl-delay.",
          fix: "Remove Crawl-delay unless your server truly needs it.",
          count: 1,
          examples: [],
        }
      : null,
    hasSitemap && input.robots.found && input.robots.sitemaps.length === 0
      ? {
          id: "robots-no-sitemap",
          severity: "info",
          title: "robots.txt does not declare your sitemap",
          detail: "Search engines found your sitemap at a default location, but robots.txt has no Sitemap: line.",
          fix: `Add "Sitemap: ${input.sitemaps.files[0]?.url ?? "https://yoursite.com/sitemap.xml"}" to robots.txt.`,
          count: 1,
          examples: [],
        }
      : null,
  ];

  return {
    startUrl: input.startUrl,
    resolvedUrl: input.resolvedUrl,
    host: input.host,
    includeSubdomains: input.includeSubdomains,
    cap: input.cap,
    stoppedBy: input.stoppedBy,
    durationMs: input.durationMs,
    crawledAt: Date.now(),
    robots: input.robots,
    sitemaps: input.sitemaps,
    linkCrawlComplete: input.linkCrawlComplete,
    summary,
    issues: list.filter((i): i is CrawlIssue => !!i),
    pages: input.pages,
    traps: input.traps,
  };
}
