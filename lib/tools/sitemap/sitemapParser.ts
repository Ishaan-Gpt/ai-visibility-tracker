import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";

export type ParsedSitemap =
  | { kind: "urlset"; entries: SitemapUrlEntry[] }
  | { kind: "sitemapindex"; sitemaps: { loc: string; lastmod: string }[] }
  | { kind: "error"; message: string };

/**
 * Parses a pasted sitemap.xml or sitemap-index.xml using the browser's
 * native DOMParser — no XML library dependency. Uses getElementsByTagName
 * (not querySelector) because it matches local element names reliably even
 * though sitemap XML declares a default namespace, which CSS-selector-based
 * queries handle inconsistently across browsers.
 */
export function parseSitemapXml(raw: string): ParsedSitemap {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return { kind: "error", message: "Parsing only runs in the browser." };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { kind: "error", message: "Paste a sitemap.xml first." };
  }

  const doc = new DOMParser().parseFromString(trimmed, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    return { kind: "error", message: "That doesn't look like valid XML — check for unclosed tags." };
  }

  if (doc.getElementsByTagName("sitemapindex").length > 0) {
    const sitemaps = Array.from(doc.getElementsByTagName("sitemap"))
      .map((node) => ({
        loc: node.getElementsByTagName("loc")[0]?.textContent?.trim() ?? "",
        lastmod: node.getElementsByTagName("lastmod")[0]?.textContent?.trim() ?? "",
      }))
      .filter((s) => s.loc !== "");
    return { kind: "sitemapindex", sitemaps };
  }

  const urlNodes = Array.from(doc.getElementsByTagName("url"));
  if (urlNodes.length === 0) {
    return { kind: "error", message: "No <url> entries found — paste a <urlset> sitemap or a <sitemapindex>." };
  }

  const entries: SitemapUrlEntry[] = urlNodes
    .map((node) => ({
      loc: node.getElementsByTagName("loc")[0]?.textContent?.trim() ?? "",
      lastmod: node.getElementsByTagName("lastmod")[0]?.textContent?.trim() ?? "",
      changefreq: (node.getElementsByTagName("changefreq")[0]?.textContent?.trim() ?? "") as SitemapUrlEntry["changefreq"],
      priority: node.getElementsByTagName("priority")[0]?.textContent?.trim() ?? "",
    }))
    .filter((e) => e.loc !== "");

  if (entries.length === 0) {
    return { kind: "error", message: "Found <url> tags but no <loc> values inside them." };
  }

  return { kind: "urlset", entries };
}
