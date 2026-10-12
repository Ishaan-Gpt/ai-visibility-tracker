import { safeFetch } from "@/lib/net/safeFetch";

export interface SitemapStatus {
  url: string;
  declared: boolean;
  status: number | null;
  /** Response parses as a sitemap (urlset or sitemapindex). */
  isXml: boolean;
  kind: "urlset" | "index" | null;
  /** <loc> entries seen in the bytes we read (may be a lower bound when truncated). */
  locs: number;
  truncated: boolean;
  note?: string;
}

const READ_BYTES = 1_500_000;

function locsOf(body: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) && out.length < 5000) out.push(m[1].replace(/&amp;/g, "&"));
  return out;
}

async function fetchSitemap(url: string, declared: boolean, timeoutMs: number): Promise<{ status: SitemapStatus; locs: string[] }> {
  try {
    const res = await safeFetch(url, { maxBytes: READ_BYTES, timeoutMs, headers: { accept: "application/xml,text/xml;q=0.9,*/*;q=0.5" } });
    const body = res.body.slice(0, READ_BYTES * 2);
    const head = body.slice(0, 2000).toLowerCase();
    const isIndex = /<sitemapindex[\s>]/i.test(body.slice(0, 20_000));
    const isSet = /<urlset[\s>]/i.test(body.slice(0, 20_000));
    const gz = /\.gz($|\?)/i.test(url) && !isIndex && !isSet;
    const locs = res.status === 200 && (isIndex || isSet) ? locsOf(body) : [];
    return {
      locs,
      status: {
        url,
        declared,
        status: res.status,
        isXml: res.status === 200 && (isIndex || isSet),
        kind: isIndex ? "index" : isSet ? "urlset" : null,
        locs: locs.length,
        truncated: res.truncated,
        note: gz
          ? "Gzipped sitemap; not inspected."
          : res.status === 200 && !(isIndex || isSet)
            ? head.includes("<html") ? "Returns an HTML page, not XML." : "Not a sitemap XML document."
            : undefined,
      },
    };
  } catch (e) {
    return { locs: [], status: { url, declared, status: null, isXml: false, kind: null, locs: 0, truncated: false, note: e instanceof Error ? e.message : "Fetch failed." } };
  }
}

/**
 * Checks declared sitemaps (or /sitemap.xml when none are declared) and samples up to `max` same-host page paths,
 * spread across different first path segments so the sample covers the site's sections.
 */
export async function inspectSitemaps(
  origin: string,
  declared: string[],
  { max = 10, deadline, hosts = [] }: { max?: number; deadline: number; /** Extra URLs whose hosts count as "this site" (e.g. redirect targets). */ hosts?: string[] },
): Promise<{ sitemaps: SitemapStatus[]; samplePaths: string[]; source: string | null }> {
  const remaining = () => deadline - Date.now();
  const list = declared.length ? [...new Set(declared)].slice(0, 3) : [`${origin}/sitemap.xml`];
  const results = await Promise.all(list.map((u) => fetchSitemap(u, declared.length > 0, Math.max(2000, Math.min(8000, remaining())))));
  const sitemaps = results.map((r) => r.status);

  let pageLocs: string[] = [];
  let source: string | null = null;
  for (const r of results) {
    if (!r.status.isXml) continue;
    if (r.status.kind === "urlset" && r.locs.length) {
      pageLocs = r.locs;
      source = r.status.url;
      break;
    }
    if (r.status.kind === "index" && r.locs.length && remaining() > 3000) {
      // Prefer child sitemaps that look like content rather than images/videos.
      const children = [...r.locs].sort((a, b) => score(b) - score(a)).slice(0, 2);
      const kids = await Promise.all(children.map((c) => fetchSitemap(c, false, Math.max(2000, Math.min(7000, remaining())))));
      for (const k of kids) pageLocs.push(...k.locs);
      if (pageLocs.length) {
        source = r.status.url;
        break;
      }
    }
  }

  const bare = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };
  const ownHosts = new Set([origin, ...hosts].map(bare).filter(Boolean));
  const paths: string[] = [];
  for (const loc of pageLocs) {
    try {
      const u = new URL(loc);
      if (!ownHosts.has(u.hostname.replace(/^www\./, ""))) continue;
      const p = u.pathname + u.search;
      if (p !== "/" && !paths.includes(p)) paths.push(p);
    } catch {
      /* skip */
    }
  }
  return { sitemaps, samplePaths: spread(paths, max), source };
}

function score(url: string) {
  return /image|video|media/i.test(url) ? -1 : /post|page|article|blog|product|doc/i.test(url) ? 1 : 0;
}

/** Round-robin across first path segments so one huge section does not dominate the sample. */
function spread(paths: string[], max: number): string[] {
  const buckets = new Map<string, string[]>();
  for (const p of paths) {
    const seg = p.split("/")[1] ?? "";
    if (!buckets.has(seg)) buckets.set(seg, []);
    buckets.get(seg)!.push(p);
  }
  const out: string[] = [];
  const lists = [...buckets.values()];
  for (let i = 0; out.length < max && lists.some((l) => l.length > i); i++) {
    for (const l of lists) {
      if (out.length >= max) break;
      if (l[i]) out.push(l[i]);
    }
  }
  return out;
}
