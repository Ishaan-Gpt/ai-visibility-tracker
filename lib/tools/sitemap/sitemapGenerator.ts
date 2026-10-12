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
  for (const alt of entry.alternates ?? []) {
    parts.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}"/>`);
  }
  // Google reads up to 1,000 images per URL.
  for (const img of (entry.images ?? []).slice(0, 1000)) {
    parts.push(`    <image:image>\n      <image:loc>${escapeXml(img)}</image:loc>\n    </image:image>`);
  }
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

/** Only declares the image / xhtml namespaces when an entry actually uses them. */
function buildUrlsetXml(entries: SitemapUrlEntry[]): string {
  const body = entries.map(entryToXml).join("\n");
  const ns = ['xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'];
  if (entries.some((e) => e.alternates?.length)) ns.push('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  if (entries.some((e) => e.images?.length)) ns.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${ns.join("\n        ")}>\n${body}\n</urlset>`;
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
export function generateSitemap(entries: SitemapUrlEntry[], baseUrl?: string, opts: { gzip?: boolean } = {}): GeneratedSitemap {
  const ext = opts.gzip ? ".xml.gz" : ".xml";
  const valid = entries.filter((e) => e.loc.trim() !== "");

  if (valid.length === 0) {
    return { files: [{ filename: `sitemap${ext}`, xml: buildUrlsetXml([]) }] };
  }

  const countChunks = chunkByCount(valid, SITEMAP_LIMITS.maxUrlsPerFile);
  const finalChunks = countChunks.flatMap((chunk) => splitBySize(chunk));

  if (finalChunks.length === 1) {
    return { files: [{ filename: `sitemap${ext}`, xml: buildUrlsetXml(finalChunks[0]) }] };
  }

  const files = finalChunks.map((chunk, i) => ({ filename: `sitemap-${i + 1}${ext}`, xml: buildUrlsetXml(chunk) }));
  // The index itself stays uncompressed so it is easy to inspect and reference from robots.txt.
  const index = { filename: "sitemap-index.xml", xml: buildIndexXml(files.map((f) => f.filename), baseUrl ?? inferBaseUrl(valid)) };
  return { files, index };
}

export function minifyXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").trim();
}

/** gzip in the browser via the native CompressionStream (Chrome 80+, Safari 16.4+, Firefox 113+). */
export async function gzipText(text: string): Promise<Blob | null> {
  if (typeof CompressionStream === "undefined") return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}

export function canGzip(): boolean {
  return typeof CompressionStream !== "undefined";
}
