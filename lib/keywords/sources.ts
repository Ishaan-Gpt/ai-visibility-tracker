import "server-only";
import type { SuggestSource } from "./types";

/*
 * Public autocomplete endpoints. Every endpoint here was called and verified to return suggestions
 * (October 2026). Nothing is invented: a source either returns its real list or an empty one.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

export interface Market {
  country: string;
  /** Google `hl` / language code. */
  language: string;
  ddg: string;
}

/** Amazon completion hosts are regional; the marketplace id selects the store. */
const AMAZON: Record<string, { host: string; mid: string }> = {
  us: { host: "completion.amazon.com", mid: "ATVPDKIKX0DER" },
  ca: { host: "completion.amazon.com", mid: "A2EUQ1WTGCTBG2" },
  mx: { host: "completion.amazon.com", mid: "A1AM78C64UM0Y8" },
  br: { host: "completion.amazon.com", mid: "A2Q3Y263D00KWC" },
  gb: { host: "completion.amazon.co.uk", mid: "A1F83G8C2ARO7P" },
  de: { host: "completion.amazon.co.uk", mid: "A1PA6795UKMFR9" },
  fr: { host: "completion.amazon.co.uk", mid: "A13V1IB3VIYZZH" },
  it: { host: "completion.amazon.co.uk", mid: "APJ6JRA9NG5V4" },
  es: { host: "completion.amazon.co.uk", mid: "A1RKKUPIHCS9HS" },
  nl: { host: "completion.amazon.co.uk", mid: "A1805IZSGTT6HS" },
  be: { host: "completion.amazon.co.uk", mid: "AMEN7PMS3EDWL" },
  se: { host: "completion.amazon.co.uk", mid: "A2NODRKZP88ZB9" },
  pl: { host: "completion.amazon.co.uk", mid: "A1C3SOZRARQ6R3" },
  tr: { host: "completion.amazon.co.uk", mid: "A33AVAJ2PDY3EV" },
  in: { host: "completion.amazon.co.uk", mid: "A21TJRUUN4KGV" },
  ae: { host: "completion.amazon.co.uk", mid: "A2VIGQ35RCS4UG" },
  sa: { host: "completion.amazon.co.uk", mid: "A17E79C6D8DWNP" },
  jp: { host: "completion.amazon.co.jp", mid: "A1VC38T7YXB528" },
  au: { host: "completion.amazon.com.au", mid: "A39IBJ37TRP1C6" },
  sg: { host: "completion.amazon.sg", mid: "A19VAU5U5O7RUS" },
};

/** eBay site ids that were verified to return suggestions. */
const EBAY: Record<string, number> = {
  us: 0, ca: 2, gb: 3, au: 15, at: 16, fr: 71, de: 77, it: 101, nl: 146, es: 186, ch: 193, ie: 205, pl: 212,
};

/** The marketplace a source will actually use for this country, when it differs (for honest labelling). */
export function marketFallback(source: SuggestSource, country: string): string | undefined {
  if (source === "amazon" && !AMAZON[country]) return "amazon.com (no local Amazon store)";
  if (source === "ebay" && EBAY[country] === undefined) return "ebay.com (no local eBay site)";
  return undefined;
}

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
  get retryable() {
    return this.status === 429 || this.status === 503 || this.status === 502 || this.status === 0;
  }
}

async function getText(url: string, timeoutMs: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json, text/javascript, */*;q=0.1", "accept-language": "en;q=0.8" },
      signal: AbortSignal.timeout(Math.max(500, timeoutMs)),
      cache: "no-store",
    });
  } catch (err) {
    throw new SourceError(err instanceof Error ? err.message : "network error", 0);
  }
  if (!res.ok) throw new SourceError(`HTTP ${res.status}`, res.status);
  return res.text();
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);

/** Google `client=firefox` JSON: ["q", ["s1","s2",...], ...]. */
function parseOpenSearch(text: string): string[] {
  const data = JSON.parse(text) as unknown[];
  return strings(data?.[1]);
}

const BING_LANG: Record<string, string> = { "zh-TW": "zh-TW", no: "nb" };

export async function fetchSuggestions(
  source: SuggestSource,
  query: string,
  m: Market,
  timeoutMs: number,
): Promise<string[]> {
  const q = encodeURIComponent(query);
  const hl = encodeURIComponent(m.language);
  const gl = encodeURIComponent(m.country);
  switch (source) {
    case "google":
      return parseOpenSearch(
        await getText(`https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${q}`, timeoutMs),
      );
    case "youtube":
      return parseOpenSearch(
        await getText(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=${hl}&gl=${gl}&q=${q}`, timeoutMs),
      );
    case "bing": {
      const lang = BING_LANG[m.language] ?? m.language.slice(0, 2);
      const market = `${lang}-${m.country.toUpperCase()}`;
      return parseOpenSearch(await getText(`https://api.bing.com/osjson.aspx?query=${q}&market=${market}`, timeoutMs));
    }
    case "duckduckgo": {
      const data = JSON.parse(await getText(`https://duckduckgo.com/ac/?q=${q}&kl=${encodeURIComponent(m.ddg)}`, timeoutMs)) as unknown;
      return Array.isArray(data) ? data.map((d) => (d as { phrase?: unknown })?.phrase).filter((s): s is string => typeof s === "string") : [];
    }
    case "amazon": {
      const mk = AMAZON[m.country] ?? AMAZON.us;
      const url = `https://${mk.host}/api/2017/suggestions?limit=11&prefix=${q}&suggestion-type=KEYWORD&page-type=Gateway&site-variant=desktop&client-info=amazon-search-ui&mid=${mk.mid}&alias=aps`;
      const data = JSON.parse(await getText(url, timeoutMs)) as { suggestions?: { value?: unknown; type?: string }[] };
      return (data.suggestions ?? [])
        .filter((s) => !s.type || s.type === "KEYWORD")
        .map((s) => s.value)
        .filter((s): s is string => typeof s === "string");
    }
    case "ebay": {
      const sid = EBAY[m.country] ?? 0;
      const text = await getText(`https://autosug.ebay.com/autosug?kwd=${q}&_jgr=1&sId=${sid}&_ch=0`, timeoutMs);
      const json = text.replace(/^[^{]*\(/, "").replace(/\)\s*;?\s*$/, "");
      const data = JSON.parse(json) as { res?: { sug?: unknown } };
      return strings(data.res?.sug);
    }
  }
}
