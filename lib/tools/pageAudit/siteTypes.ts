/* Whole-site audit report shape. Client-safe (types only). */
import type { CrawlIssue, StopReason } from "@/lib/crawl/types";
import type { CheckCategory, Severity } from "./types";

export interface SitePageIssue {
  id: string;
  severity: Severity;
  title: string;
  /** Concrete evidence for this page (capped). */
  items?: string[];
}

export interface SitePage {
  url: string;
  status: number | null;
  /** Why the page isn't indexable, or null when it is. */
  excluded: string | null;
  depth: number | null;
  inlinks: number;
  inSitemap: boolean;
  title: string | null;
  h1: string | null;
  words: number;
  ms: number;
  score: number | null;
  aiScore: number | null;
  errors: number;
  warnings: number;
  schemaTypes: string[];
  issues: SitePageIssue[];
}

export interface SiteIssueGroup {
  id: string;
  severity: Severity;
  category: CheckCategory | "Site" | "AI readiness";
  title: string;
  detail: string;
  fix: string;
  /** Number of affected pages (or URLs, for site-level issues). */
  count: number;
  /** Affected URLs with page-specific evidence. */
  pages: { url: string; note?: string; items?: string[] }[];
}

/** How pages are found: the whole site, one folder, only the URLs in a sitemap, or a pasted list. */
export type SiteAuditMode = "site" | "folder" | "sitemap" | "list";

export interface SiteAuditReport {
  /** Absent on reports from before crawl modes existed (= "site"). */
  mode?: SiteAuditMode;
  scope?: string;
  startUrl: string;
  resolvedUrl: string;
  host: string;
  stoppedBy: StopReason;
  cap: number;
  durationMs: number;
  checkedAt: number;
  score: number;
  aiScore: number;
  totals: {
    crawled: number;
    analysed: number;
    indexable: number;
    excluded: number;
    broken: number;
    redirects: number;
    errors: number;
    warnings: number;
    sitemapUrls: number;
    linkCrawlComplete: boolean;
  };
  categories: { id: CheckCategory; score: number }[];
  issues: SiteIssueGroup[];
  /** Issues the crawler found (orphans, sitemap problems, traps…), passed through as-is. */
  crawlIssues: CrawlIssue[];
  pages: SitePage[];
  robots: { found: boolean; sitemaps: string[] };
  sitemaps: { found: boolean; urlCount: number; files: { url: string; status: number; urlCount: number; error?: string }[] };
}
