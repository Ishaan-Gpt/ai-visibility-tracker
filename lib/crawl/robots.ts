import "server-only";
import { safeFetch, SafeFetchError } from "@/lib/net/safeFetch";
import { evaluatePath, parseRobots, type ParsedRobots } from "@/lib/tools/aiCrawlers/robots";

/** Our robots.txt product token (matches DEFAULT_UA "seowise-Bot/1.0"). */
export const BOT_TOKEN = "seowise-bot";

export interface SiteRobots {
  url: string;
  found: boolean;
  status: number | null;
  /** RFC 9309: a 5xx or unreachable robots.txt means "assume complete disallow". */
  disallowAll: boolean;
  parsed: ParsedRobots;
  crawlDelay: number | null;
  sitemaps: string[];
}

/** Crawl-delay for our token, falling back to "*" (the parser we share ignores this field). */
function parseCrawlDelay(text: string): number | null {
  let agents: string[] = [];
  let lastWasAgent = false;
  let ours: number | null = null;
  let star: number | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === "user-agent") {
      if (!lastWasAgent) agents = [];
      agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (field === "crawl-delay") {
      const d = Number(value);
      if (!Number.isFinite(d) || d <= 0) continue;
      if (agents.includes(BOT_TOKEN)) ours = d;
      else if (agents.includes("*")) star = d;
    }
  }
  return ours ?? star;
}

export async function loadRobots(origin: string, signal?: AbortSignal): Promise<SiteRobots> {
  const url = `${origin}/robots.txt`;
  try {
    if (signal?.aborted) throw new SafeFetchError("Cancelled.");
    const res = await safeFetch(url, { maxBytes: 500_000, timeoutMs: 10_000 });
    const looksHtml = /<html|<!doctype/i.test(res.body.slice(0, 600));
    if (res.status >= 500) {
      return { url, found: false, status: res.status, disallowAll: true, parsed: { groups: [], sitemaps: [] }, crawlDelay: null, sitemaps: [] };
    }
    if (res.status !== 200 || looksHtml) {
      return { url, found: false, status: res.status, disallowAll: false, parsed: { groups: [], sitemaps: [] }, crawlDelay: null, sitemaps: [] };
    }
    const parsed = parseRobots(res.body);
    return { url, found: true, status: res.status, disallowAll: false, parsed, crawlDelay: parseCrawlDelay(res.body), sitemaps: parsed.sitemaps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/ENOTFOUND|EAI_AGAIN|ENODATA/.test(msg)) throw new SafeFetchError("We couldn't find that domain. Check the spelling.");
    if (err instanceof SafeFetchError && /not allowed|valid URL|standard ports|public domain|Cancelled/i.test(msg)) throw err;
    // Unreachable robots.txt: RFC 9309 says assume complete disallow.
    return { url, found: false, status: null, disallowAll: true, parsed: { groups: [], sitemaps: [] }, crawlDelay: null, sitemaps: [] };
  }
}

export function allowedFor(robots: SiteRobots, agent: string, url: string): boolean {
  if (robots.disallowAll) return false;
  try {
    const u = new URL(url);
    return evaluatePath(robots.parsed, agent, u.pathname + u.search);
  } catch {
    return false;
  }
}
