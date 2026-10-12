/** Shared, client-safe types for the site crawler and the sitemap checker. */

/** Why a crawled URL is not suggested for the XML sitemap. `null` = indexable. */
export type ExcludeReason =
  | "noindex"
  | "canonicalised"
  | "redirect"
  | "client-error"
  | "server-error"
  | "fetch-error"
  | "non-html"
  | "blocked-robots"
  | "trap"
  | "pattern"
  | "off-site";

export const EXCLUDE_LABEL: Record<ExcludeReason, string> = {
  noindex: "noindex",
  canonicalised: "Canonical points elsewhere",
  redirect: "Redirect",
  "client-error": "4xx error",
  "server-error": "5xx error",
  "fetch-error": "Could not fetch",
  "non-html": "Not an HTML page",
  "blocked-robots": "Blocked by robots.txt",
  trap: "Crawl trap skipped",
  pattern: "Matched your exclude pattern",
  "off-site": "On a different site",
};

export interface Hreflang {
  lang: string;
  href: string;
}

export interface CrawlPage {
  /** Normalised URL (fragment and tracking parameters removed, query sorted). */
  url: string;
  /** HTTP status. 0 = network error / timeout, null = not fetched (blocked, trap, pattern). */
  status: number | null;
  reason: ExcludeReason | null;
  /** Human detail for the reason, e.g. the canonical target or the trap rule. */
  detail?: string;
  /** Redirect target (3xx Location or meta refresh). */
  redirectTo?: string;
  /** rel=canonical target when it points to a different URL. */
  canonical?: string;
  /** Clicks from the start URL. Sitemap-only URLs get the depth they were found at, or null if never linked. */
  depth: number | null;
  title?: string;
  h1?: string;
  /** W3C date (YYYY-MM-DD) from the sitemap, page metadata or Last-Modified header. */
  lastmod?: string;
  lastmodSource?: "sitemap" | "page" | "header";
  contentType?: string;
  bytes?: number;
  ms?: number;
  /** Unique internal pages linking here (within the crawled set). */
  inlinks: number;
  /** First page we saw linking here. */
  foundOn?: string;
  inSitemap: boolean;
  /** Robots.txt disallows this URL for Googlebot (independent of our own crawler's rules). */
  blockedForGoogle?: boolean;
  /** 200 page that reads like an error page ("not found" title/h1). */
  soft404?: boolean;
  images?: string[];
  hreflang?: Hreflang[];
}

export type StopReason = "complete" | "page-cap" | "time-budget" | "aborted";

export interface SitemapFileInfo {
  url: string;
  kind: "urlset" | "sitemapindex" | "unknown";
  status: number;
  urlCount: number;
  bytes: number;
  gzip: boolean;
  error?: string;
}

export interface CrawlIssue {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  detail: string;
  fix: string;
  count: number;
  examples: string[];
}

export interface CrawlSummary {
  crawled: number;
  discovered: number;
  /** In-scope URLs that were discovered but never fetched because the page cap or time budget ran out. */
  notCrawled: number;
  indexable: number;
  excluded: Partial<Record<ExcludeReason, number>>;
  broken: number;
  redirects: number;
  /** In the sitemap but no internal link found to them in the crawled pages. */
  orphans: number;
  /** Indexable pages we found by links that the existing sitemap does not list. */
  missingFromSitemap: number;
  /** Sitemap URLs that are not indexable (noindex, redirect, 4xx/5xx, canonicalised, blocked). */
  sitemapProblems: number;
  imagesFound: number;
  hreflangPages: number;
  assetsSkipped: number;
  externalLinks: number;
}

export interface CrawlResult {
  startUrl: string;
  /** Where the start URL ended up after redirects. */
  resolvedUrl: string;
  host: string;
  includeSubdomains: boolean;
  cap: number;
  stoppedBy: StopReason;
  durationMs: number;
  crawledAt: number;
  robots: { url: string; found: boolean; status: number | null; crawlDelay: number | null; sitemaps: string[] };
  sitemaps: { found: boolean; files: SitemapFileInfo[]; urlCount: number; offsiteUrls: number; truncated: boolean };
  /** Link-crawl frontier was fully exhausted, so "orphan" claims are reliable. */
  linkCrawlComplete: boolean;
  summary: CrawlSummary;
  issues: CrawlIssue[];
  pages: CrawlPage[];
  traps: { count: number; examples: string[] };
}

/* ------------------------------------------------------------------ */
/* Library API (server): crawlSite(options, hooks)                     */
/* ------------------------------------------------------------------ */

export interface CrawlOptions {
  /** Domain or URL to start from. */
  url: string;
  /** Hard page cap (fetched pages). Callers pass the tier cap from CRAWL_PAGE_LIMITS. */
  maxPages: number;
  /** Total wall-clock budget in ms, including robots.txt and sitemap reading. Default 50,000. */
  timeBudgetMs?: number;
  /** Concurrent requests to the site. Default 6, max 8. Forced to 1 when robots.txt sets Crawl-delay. */
  concurrency?: number;
  /** Also crawl subdomains of the start host (blog.example.com for example.com). */
  includeSubdomains?: boolean;
  /** Path ("/tag/*") or substring patterns to skip. */
  excludePatterns?: string[];
  /** Read robots.txt Sitemap: lines and /sitemap.xml (default true). */
  useSitemaps?: boolean;
  /** Max depth (clicks from start). Default 25. */
  maxDepth?: number;
  /** Max bytes read per page. Default 1.5 MB. */
  maxPageBytes?: number;
  /** Only crawl URLs whose path starts with this prefix (e.g. "/blog/"). Links elsewhere on the site are not followed. */
  scopePath?: string;
  /** Follow links found on pages (default true). False = only fetch the start URL, `seedUrls` and sitemap URLs. */
  followLinks?: boolean;
  /** Sitemap files to read instead of robots.txt Sitemap: lines and the default paths. */
  sitemapUrls?: string[];
  /** Extra URLs to fetch at depth 0 (URL-list mode). Must be on the same site as `url`. */
  seedUrls?: string[];
  signal?: AbortSignal;
}

export interface LinkEdge {
  /** Normalised target URL. */
  target: string;
  anchor: string;
  nofollow: boolean;
  internal: boolean;
}

/** Everything fetched for one URL, handed to `onPage` so callers can analyse without refetching. */
export interface FetchedPage {
  /** Normalised requested URL. */
  url: string;
  /** Same as url (pages are fetched without following redirects; see `redirectTo`). */
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  /** Redirect target when this URL is a 3xx (or meta refresh). */
  redirectTo?: string;
  /** Redirect hops as "301 https://..." (only the initial start-URL resolution can have more than one). */
  redirects: string[];
  elapsedMs: number;
  depth: number | null;
  /** Raw HTML body (empty for non-HTML responses). Possibly truncated at maxPageBytes. */
  html: string;
  truncated: boolean;
  isHtml: boolean;
  /** Outgoing links with anchor text (internal and external), capped at 1,000 per page. */
  links: LinkEdge[];
  /** The summary record for this URL (reason, title, canonical...). */
  page: CrawlPage;
}

export interface CrawlHooks {
  onProgress?: (p: CrawlProgress) => void;
  /** Called once per fetched URL (any status). May be async; the crawler does not await it. */
  onPage?: (page: FetchedPage) => void;
  /** Called once after sitemaps are read, with every normalised in-scope sitemap URL. */
  onSitemapUrls?: (urls: Set<string>) => void;
}

export interface CrawlProgress {
  phase: "robots" | "sitemaps" | "crawl" | "finishing";
  crawled: number;
  queued: number;
  discovered: number;
  sitemapUrls: number;
  sitemapFiles: number;
  cap: number;
  elapsedMs: number;
  budgetMs: number;
  current?: string;
}

/* ------------------------------------------------------------------ */
/* Sitemap checker                                                     */
/* ------------------------------------------------------------------ */

export type IssueSeverity = "error" | "warning" | "info";

export interface ProtocolIssue {
  code: string;
  severity: IssueSeverity;
  message: string;
  fix: string;
  count: number;
  examples: { line?: number; value?: string; file?: string }[];
}

export interface CheckedFile extends SitemapFileInfo {
  contentType: string;
  redirectedTo?: string;
  children?: string[];
  imageCount: number;
  hreflangCount: number;
  lastmodCount: number;
  issues: ProtocolIssue[];
}

export type SampleVerdict =
  | "ok"
  | "ok-non-html"
  | "redirect"
  | "not-found"
  | "client-error"
  | "server-error"
  | "fetch-error"
  | "noindex"
  | "canonicalised"
  | "soft-404"
  | "blocked-google"
  | "blocked-us";

export const VERDICT_LABEL: Record<SampleVerdict, string> = {
  ok: "Indexable",
  "ok-non-html": "OK (not HTML)",
  redirect: "Redirects",
  "not-found": "Not found (404/410)",
  "client-error": "4xx error",
  "server-error": "5xx error",
  "fetch-error": "Unreachable",
  noindex: "noindex",
  canonicalised: "Canonical elsewhere",
  "soft-404": "Possible soft 404",
  "blocked-google": "Blocked for Googlebot",
  "blocked-us": "Not checked (robots.txt)",
};

export interface SampleResult {
  url: string;
  status: number | null;
  verdict: SampleVerdict;
  detail?: string;
  ms?: number;
}

export interface SitemapCheckReport {
  input: string;
  host: string;
  checkedAt: number;
  durationMs: number;
  found: boolean;
  discoveredVia: "input" | "robots" | "default-path" | "none";
  robots: { url: string; found: boolean; declares: string[]; declaresChecked: boolean };
  files: CheckedFile[];
  totals: { urls: number; uniqueUrls: number; files: number; indexes: number; gzipFiles: number; withLastmod: number; images: number; hreflang: number; truncated: boolean };
  issues: ProtocolIssue[];
  sample: { size: number; results: SampleResult[]; problemCount: number; estimatedAffected: number };
  score: number;
}

export type StreamEvent<T> =
  | { type: "progress"; progress: CrawlProgress }
  | { type: "result"; data: T }
  | { type: "error"; message: string };
