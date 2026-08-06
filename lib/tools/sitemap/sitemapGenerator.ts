import { SITEMAP_LIMITS, type SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";

export type SitemapFile = { filename: string; xml: string };

export type GeneratedSitemap = {
  files: SitemapFile[];
  /** Present only when entries had to be split across more than one file. */
  index?: SitemapFile;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entryToXml(entry: SitemapUrlEntry): string {
  const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority) parts.push(`    <priority>${escapeXml(entry.priority)}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

function buildUrlsetXml(entries: SitemapUrlEntry[]): string {
  const body = entries.map(entryToXml).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function buildIndexXml(filenames: string[], baseUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const cleanBase = baseUrl.replace(/\/$/, "");
  const entries = filenames
    .map((name) => `  <sitemap>\n    <loc>${escapeXml(`${cleanBase}/${name}`)}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

function chunkByCount<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Recursively halves a chunk until its rendered XML fits under the 50MB-per-file limit. */
function splitBySize(entries: SitemapUrlEntry[]): SitemapUrlEntry[][] {
  if (entries.length <= 1) return [entries];
  const bytes = new TextEncoder().encode(buildUrlsetXml(entries)).length;
  if (bytes <= SITEMAP_LIMITS.maxBytesPerFile) return [entries];
  const mid = Math.ceil(entries.length / 2);
  return [...splitBySize(entries.slice(0, mid)), ...splitBySize(entries.slice(mid))];
}

function inferBaseUrl(entries: SitemapUrlEntry[]): string {
  const first = entries.find((e) => e.loc.trim() !== "");
  if (!first) return "https://example.com";
  try {
    return new URL(first.loc).origin;
  } catch {
    return "https://example.com";
  }
}

/**
 * Generates a spec-conformant sitemap.xml, automatically splitting into a
 * sitemap index + numbered sub-sitemaps once the sitemaps.org / Google
 * Search Central limits (50,000 URLs or 50MB per file) are exceeded — the
 * exact case free generators either cap out on or handle by truncating data.
 */
export function generateSitemap(entries: SitemapUrlEntry[], baseUrl?: string): GeneratedSitemap {
  const valid = entries.filter((e) => e.loc.trim() !== "");

  if (valid.length === 0) {
    return { files: [{ filename: "sitemap.xml", xml: buildUrlsetXml([]) }] };
  }

  const countChunks = chunkByCount(valid, SITEMAP_LIMITS.maxUrlsPerFile);
  const finalChunks = countChunks.flatMap((chunk) => splitBySize(chunk));

  if (finalChunks.length === 1) {
    return { files: [{ filename: "sitemap.xml", xml: buildUrlsetXml(finalChunks[0]) }] };
  }

  const files = finalChunks.map((chunk, i) => ({ filename: `sitemap-${i + 1}.xml`, xml: buildUrlsetXml(chunk) }));
  const index = { filename: "sitemap-index.xml", xml: buildIndexXml(files.map((f) => f.filename), baseUrl ?? inferBaseUrl(valid)) };
  return { files, index };
}

export function minifyXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").trim();
}
