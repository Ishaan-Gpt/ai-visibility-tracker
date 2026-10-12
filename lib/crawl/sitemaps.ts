import "server-only";
import { decodeSitemapBody, fetchBytes } from "@/lib/crawl/fetchBytes";
import { parseSitemapDoc, validateSitemapDoc, type ParsedUrl } from "@/lib/crawl/sitemapXml";
import type { CheckedFile } from "@/lib/crawl/types";

export const DEFAULT_SITEMAP_PATHS = ["/sitemap.xml", "/sitemap_index.xml"];
export const FALLBACK_SITEMAP_PATHS = ["/wp-sitemap.xml", "/sitemap-index.xml", "/sitemap/sitemap.xml"];

export interface SitemapUrlRecord extends ParsedUrl {
  file: string;
}

export interface LoadedSitemaps {
  files: CheckedFile[];
  urls: SitemapUrlRecord[];
  truncated: boolean;
}

interface LoadOptions {
  maxFiles?: number;
  maxUrls?: number;
  deadline: number;
  signal?: AbortSignal;
  /** Run full protocol validation on each file (checker mode). */
  validate?: boolean;
  allowedHosts?: string[];
  /** Skip image/video/news child sitemaps (they repeat page URLs; crawl mode only needs pages). */
  skipMediaSitemaps?: boolean;
  /** Seeds that should be silently dropped when they 404 (guessed default paths). */
  optional?: Set<string>;
  onFile?: (file: CheckedFile, totalUrls: number, newUrls: SitemapUrlRecord[]) => void;
}

/** Fetches sitemap files breadth-first, following sitemap indexes (and .xml.gz), within count, size and time caps. */
export async function loadSitemaps(seeds: string[], opts: LoadOptions): Promise<LoadedSitemaps> {
  const { maxFiles = 50, maxUrls = 50_000, deadline, signal, validate = false, optional = new Set<string>() } = opts;
  const files: CheckedFile[] = [];
  const urls: SitemapUrlRecord[] = [];
  const visited = new Set<string>();
  const queue = [...new Set(seeds)].map((u) => ({ url: u, nested: false, seed: true }));
  let truncated = false;
  let started = 0;
  let active = 0;
  let parked: (() => void)[] = [];
  const wakeAll = () => {
    const p = parked;
    parked = [];
    p.forEach((f) => f());
  };

  const handle = (r: Awaited<ReturnType<typeof fetchOne>>, item: { url: string; seed: boolean }) => {
    if (item.seed && optional.has(item.url) && (r.file.status === 404 || r.file.status === 410 || r.file.kind === "unknown" || r.file.status === 0)) return;
    // /sitemap.xml often redirects to /sitemap_index.xml: count the same final file once.
    const finalUrl = r.file.redirectedTo ?? r.file.url;
    if (r.file.redirectedTo) {
      if (visited.has(finalUrl)) return;
      visited.add(finalUrl);
    }
    files.push(r.file);
    if (r.file.kind === "sitemapindex") {
      for (const c of r.children) {
        if (visited.has(c) || queue.some((q) => q.url === c)) continue;
        if (opts.skipMediaSitemaps && /(image|video|news)[-_]?sitemap|sitemap[-_]?(image|video|news)/i.test(c)) continue;
        queue.push({ url: c, nested: true, seed: false });
      }
    }
    const added: SitemapUrlRecord[] = [];
    if (r.file.kind !== "sitemapindex") {
      for (const u of r.urls) {
        if (urls.length >= maxUrls) {
          truncated = true;
          break;
        }
        const rec = { ...u, file: r.file.url };
        urls.push(rec);
        added.push(rec);
      }
    }
    opts.onFile?.(r.file, urls.length, added);
  };

  // Dynamic pool of 4: a slow file never holds up the fast ones queued behind it.
  const worker = async () => {
    for (;;) {
      if (signal?.aborted) return;
      const item = queue.shift();
      if (!item) {
        if (active === 0) return;
        await new Promise<void>((r) => parked.push(r));
        continue;
      }
      if (visited.has(item.url)) continue;
      if (started >= maxFiles || Date.now() > deadline) {
        truncated = true;
        queue.length = 0;
        continue;
      }
      visited.add(item.url);
      started++;
      active++;
      try {
        handle(await fetchOne(item.url, item.nested, { validate, allowedHosts: opts.allowedHosts, deadline, signal }), item);
      } catch {
        /* fetchOne never throws; defensive */
      } finally {
        active--;
        wakeAll();
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return { files, urls, truncated };
}

async function fetchOne(
  url: string,
  nested: boolean,
  o: { validate: boolean; allowedHosts?: string[]; deadline: number; signal?: AbortSignal },
): Promise<{ file: CheckedFile; urls: ParsedUrl[]; children: string[] }> {
  const base: CheckedFile = { url, kind: "unknown", status: 0, urlCount: 0, bytes: 0, gzip: false, contentType: "", imageCount: 0, hreflangCount: 0, lastmodCount: 0, issues: [] };
  // The socket timeout only catches idle connections; this hard stop also catches slow trickles.
  const remaining = Math.max(1_000, o.deadline - Date.now());
  // (A plain AbortController + timer: AbortSignal.timeout() can be garbage-collected before it fires.)
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), remaining);
  const relay = () => ac.abort();
  o.signal?.addEventListener("abort", relay);
  const sig = ac.signal;
  const tooSlow = "Not fully downloaded within the time limit (the server is slow or the file is very large)";
  let res;
  try {
    res = await fetchBytes(url, { timeoutMs: Math.min(20_000, remaining), signal: sig });
  } catch (err) {
    return { file: { ...base, error: sig.aborted ? tooSlow : err instanceof Error ? err.message : "Could not fetch this sitemap." }, urls: [], children: [] };
  } finally {
    clearTimeout(timer);
    o.signal?.removeEventListener("abort", relay);
  }
  if (sig.aborted) return { file: { ...base, status: res.status, error: tooSlow }, urls: [], children: [] };
  const file: CheckedFile = {
    ...base,
    status: res.status,
    contentType: res.headers["content-type"] ?? "",
    redirectedTo: res.redirects.length ? res.finalUrl : undefined,
  };
  if (res.status !== 200) {
    file.error = `HTTP ${res.status}`;
    return { file, urls: [], children: [] };
  }
  const decoded = decodeSitemapBody(res.body);
  file.gzip = decoded.gzip;
  file.bytes = Buffer.byteLength(decoded.text, "utf8");
  if (decoded.error) {
    file.error = decoded.error;
    return { file, urls: [], children: [] };
  }
  if (res.truncated) file.error = "File exceeded 20 MB compressed transfer and was cut off";
  const head = decoded.text.slice(0, 1000);
  if (/<html[\s>]|<!doctype html/i.test(head)) {
    file.error = "The server returned an HTML page, not XML";
    return { file, urls: [], children: [] };
  }
  const doc = parseSitemapDoc(decoded.text);
  file.kind = doc.kind;
  file.urlCount = doc.kind === "sitemapindex" ? doc.children.length : doc.urls.length;
  file.imageCount = doc.urls.reduce((s, u) => s + u.images, 0);
  file.hreflangCount = doc.urls.reduce((s, u) => s + u.hreflang, 0);
  file.lastmodCount = (doc.kind === "sitemapindex" ? doc.children : doc.urls).filter((u) => u.lastmod).length;
  if (doc.wellFormed && !doc.urls.length && !doc.children.length) file.error = `Unreadable XML: ${doc.wellFormed.message} (line ${doc.wellFormed.line})`;
  if (o.validate) {
    file.issues = validateSitemapDoc(doc, { fileUrl: res.finalUrl, sizeBytes: file.bytes, nestedInIndex: nested, allowedHosts: o.allowedHosts });
  }
  const children = doc.children
    .map((c) => {
      try {
        return new URL(c.loc, res.finalUrl).href;
      } catch {
        return null;
      }
    })
    .filter((c): c is string => !!c);
  return { file, urls: doc.urls, children };
}
