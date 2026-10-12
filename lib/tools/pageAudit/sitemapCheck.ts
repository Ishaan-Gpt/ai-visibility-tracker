import "server-only";
import { loadSitemaps } from "@/lib/crawl";
import type { ParsedRobots } from "@/lib/tools/aiCrawlers/robots";
import { urlKey } from "./net";
import type { AuditCheck, SitemapCheck } from "./types";

const DEFAULTS = ["/sitemap.xml", "/sitemap_index.xml"];

/**
 * Finds the site's sitemaps (robots.txt Sitemap: lines, then /sitemap.xml and /sitemap_index.xml), reads them through
 * any sitemap index, and reports whether this page is listed. Bounded by `deadline`; never throws.
 */
export async function checkPageInSitemap(pageUrl: string, robots: ParsedRobots | null, deadline: number): Promise<{ sitemap: SitemapCheck; checks: AuditCheck[] }> {
  const origin = new URL(pageUrl).origin;
  const declared = robots?.sitemaps ?? [];
  const guessed = DEFAULTS.map((p) => `${origin}${p}`);
  const seeds = declared.length ? declared : guessed;
  const target = urlKey(pageUrl);
  const host = new URL(pageUrl).hostname.replace(/^www\./, "");

  let loaded: Awaited<ReturnType<typeof loadSitemaps>> | null = null;
  try {
    loaded = await loadSitemaps(seeds, { deadline, maxFiles: 25, maxUrls: 100_000, optional: new Set(declared.length ? [] : guessed), allowedHosts: [host, `www.${host}`] });
  } catch {
    loaded = null;
  }

  const files = (loaded?.files ?? []).map((f) => ({ url: f.url, status: f.status, kind: f.kind, urls: f.urlCount, error: f.error }));
  const readable = files.filter((f) => f.status === 200 && !f.error && f.kind !== "unknown");
  const hit = loaded?.urls.find((u) => urlKey(u.loc) === target);
  const truncated = !!loaded?.truncated;
  const found = readable.length > 0;
  const sitemap: SitemapCheck = {
    declaredInRobots: declared,
    files,
    found,
    listed: hit ? true : found && !truncated ? false : null,
    listedIn: hit?.file,
    truncated,
    urlsRead: loaded?.urls.length ?? 0,
  };

  const checks: AuditCheck[] = [];
  const broken = files.filter((f) => f.status !== 200 || f.error || f.kind === "unknown");
  if (!found) {
    checks.push({ id: "sitemap", category: "Indexability", impact: 5, severity: "warning", title: "No XML sitemap found", detail: declared.length ? "robots.txt declares sitemaps, but none of them could be read." : "Nothing at /sitemap.xml or /sitemap_index.xml, and robots.txt declares none.", fix: "Generate a sitemap with the XML Sitemap Generator, upload it and declare it in robots.txt with a Sitemap: line.", items: broken.map((f) => `${f.url} → ${f.error ?? `HTTP ${f.status}`}`) });
  } else {
    checks.push(sitemap.listed === false
      ? { id: "sitemap", category: "Indexability", impact: 5, severity: "warning", title: "This page is not in the sitemap", detail: `Checked ${sitemap.urlsRead.toLocaleString("en-US")} URLs in ${readable.length} sitemap file${readable.length > 1 ? "s" : ""}.`, fix: "Add this URL to your XML sitemap so search engines discover and recrawl it.", items: readable.map((f) => f.url) }
      : sitemap.listed
        ? { id: "sitemap", category: "Indexability", impact: 5, severity: "pass", title: "Listed in the XML sitemap", detail: `Found in ${hit!.file}${hit!.lastmod ? `, lastmod ${hit!.lastmod}` : ""}.` }
        : { id: "sitemap", category: "Indexability", impact: 0, severity: "info", title: "Sitemap too large to check fully", detail: `Read ${sitemap.urlsRead.toLocaleString("en-US")} URLs before the time limit without finding this page.` });
    if (!declared.length) checks.push({ id: "sitemap-robots", category: "Indexability", impact: 2, severity: "warning", title: "Sitemap not declared in robots.txt", detail: `Found at ${readable[0].url}, but robots.txt has no Sitemap: line, so other crawlers may not find it.`, fix: `Add "Sitemap: ${readable[0].url}" to robots.txt.` });
    if (broken.length) checks.push({ id: "sitemap-errors", category: "Indexability", impact: 3, severity: "warning", title: `${broken.length} sitemap file${broken.length > 1 ? "s" : ""} could not be read`, detail: "Search engines report unreadable sitemaps as errors and skip their URLs.", fix: "Fix or remove the broken sitemap URLs (they must return 200 with valid XML).", items: broken.map((f) => `${f.url} → ${f.error ?? `HTTP ${f.status}`}`) });
  }
  return { sitemap, checks };
}
