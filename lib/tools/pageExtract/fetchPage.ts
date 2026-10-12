import "server-only";
import { BROWSER_UA, DEFAULT_UA, normalizeUrl, safeFetch } from "@/lib/net/safeFetch";
import { extractPage } from "@/lib/tools/pageExtract/extract";
import { probeImage } from "@/lib/tools/pageExtract/imageProbe";
import type { PageExtract } from "@/lib/tools/pageExtract/types";

export interface FetchPageOptions {
  /** Probe og:image / twitter:image (dimensions, size, type) like a social crawler would. */
  probeImages?: boolean;
}

const MAX_HTML_BYTES = 3_000_000;

/** Fetches a public page (SSRF-safe) and returns the structured extraction shared by the browser tools. */
export async function fetchAndExtract(input: string, opts: FetchPageOptions = {}): Promise<PageExtract> {
  const url = normalizeUrl(input);
  let res = await safeFetch(url.href, { maxBytes: MAX_HTML_BYTES, timeoutMs: 12_000, userAgent: DEFAULT_UA });
  // Some CDNs refuse unknown bots outright. Retry once as a regular browser so the user still sees their page.
  if ([403, 406, 429, 503].includes(res.status)) {
    const retry = await safeFetch(url.href, { maxBytes: MAX_HTML_BYTES, timeoutMs: 12_000, userAgent: BROWSER_UA }).catch(() => null);
    if (retry && retry.status < 400) res = retry;
  }
  const page = extractPage({
    requestedUrl: url.href,
    finalUrl: res.finalUrl,
    status: res.status,
    redirects: res.redirects,
    headers: res.headers,
    body: res.body,
    elapsedMs: res.elapsedMs,
    bytes: res.bytes,
    truncated: res.truncated,
  });

  if (opts.probeImages) {
    const candidates = [...(page.og["og:image"] ?? []), ...(page.og["og:image:url"] ?? []), ...(page.og["og:image:secure_url"] ?? []), ...(page.twitter["twitter:image"] ?? []), ...(page.twitter["twitter:image:src"] ?? [])]
      .map((u) => {
        try {
          return new URL(u.trim(), page.finalUrl).href;
        } catch {
          return null;
        }
      })
      .filter((u): u is string => !!u);
    const unique = [...new Set(candidates)].slice(0, 4);
    page.imageProbes = await Promise.all(unique.map((u) => probeImage(u)));
  }
  return page;
}
