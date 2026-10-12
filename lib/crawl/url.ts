/** URL normalisation, scope and trap rules for the crawler. Pure functions, safe to import in the browser. */

const TRACKING_PARAM =
  /^(utm_[a-z0-9_]+|gclid|gclsrc|dclid|fbclid|msclkid|yclid|gbraid|wbraid|twclid|ttclid|li_fat_id|mc_cid|mc_eid|_ga|_gl|_hsenc|_hsmi|__hstc|__hssc|__hsfp|hsctatracking|igshid|srsltid|mkt_tok|oly_enc_id|oly_anon_id|vero_id|ref_src|s_kwcid|ef_id|_branch_match_id)$/i;
const SESSION_PARAM = /^(sid|sessionid|session_id|phpsessid|jsessionid|aspsessionid|cfid|cftoken|zenid|osCsid)$/i;

/** Links that act (add to cart, reply, share) or duplicate content endlessly. Never page content. */
const ACTION_PARAM = /^(add-to-cart|add_to_cart|add_to_wishlist|remove_item|replytocom|share|wc-ajax|_wpnonce|nonce|ical|outlook-ical|tribe-bar-date|eventdisplay|logout|action|redirect_to|returnurl|return_url)$/i;

/** File types that are never HTML pages. Sitemaps are read separately, so .xml is skipped too. */
const ASSET_EXT =
  /\.(jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|heic|css|js|mjs|cjs|json|xml|rss|atom|txt|pdf|docx?|xlsx?|pptx?|odt|ods|csv|rtf|epub|zip|rar|7z|gz|tgz|tar|bz2|xz|exe|dmg|pkg|msi|apk|ipa|iso|bin|mp3|wav|ogg|oga|m4a|flac|aac|mp4|m4v|mov|avi|wmv|webm|mkv|flv|woff2?|ttf|otf|eot|map|ics|vcf|swf)$/i;
/** Paths that are machine endpoints on common stacks (WordPress feeds/REST, Next.js internals, CDN helpers). */
const NON_PAGE_PATH = /(\/feed\/?$|\/wp-json(\/|$)|\/xmlrpc\.php$|\/wp-admin(\/|$)|\/wp-login\.php$|\/_next\/|\/cdn-cgi\/|\/__\/|\/oembed(\/|$)|\/comments\/feed\/?$|\/embed\/?$)/i;

/**
 * Normalises a link for de-duplication: resolves against `base`, http(s) only, drops the fragment,
 * strips tracking and session parameters and sorts the rest. Trailing slashes are left alone on
 * purpose: `/about` and `/about/` are different URLs to a server, and the one that redirects is
 * reported as a redirect rather than silently merged.
 */
export function normalizeCrawlUrl(href: string, base?: string): string | null {
  const raw = href.trim();
  if (!raw || /^(javascript|mailto|tel|sms|data|blob|ftp|file|about|whatsapp|skype|callto):/i.test(raw)) return null;
  let u: URL;
  try {
    u = base ? new URL(raw, base) : new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  u.hash = "";
  if (/;jsessionid=/i.test(u.pathname)) u.pathname = u.pathname.replace(/;jsessionid=[^/?]*/gi, "");
  if (u.search) {
    const kept = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAM.test(k) && !SESSION_PARAM.test(k));
    kept.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
    u.search = kept.length ? new URLSearchParams(kept).toString() : "";
  }
  if (!u.pathname) u.pathname = "/";
  return u.href;
}

/** "www.example.com" and "example.com" are one site; the bare host is the scope key. */
export function siteKey(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function inScope(url: string, baseHost: string, includeSubdomains: boolean): boolean {
  let h: string;
  try {
    h = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (h === baseHost || h === `www.${baseHost}`) return true;
  return includeSubdomains && h.endsWith(`.${baseHost}`);
}

export function isAssetUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return ASSET_EXT.test(pathname) || NON_PAGE_PATH.test(pathname);
  } catch {
    return true;
  }
}

/** Returns a reason when a URL looks like an infinite space (calendars, repeating paths, action links). */
export function trapReason(url: string, now = new Date()): string | null {
  if (url.length > 400) return "URL longer than 400 characters";
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "Malformed URL";
  }
  const segments = u.pathname.split("/").filter(Boolean);
  if (segments.length > 15) return "Path deeper than 15 folders";
  const counts = new Map<string, number>();
  for (const s of segments) counts.set(s, (counts.get(s) ?? 0) + 1);
  for (const [s, n] of counts) if (n >= 3 && s.length > 1) return `Path segment "${s}" repeats ${n} times`;
  for (let i = 0; i + 3 < segments.length; i++) {
    if (segments[i] === segments[i + 2] && segments[i + 1] === segments[i + 3]) return "Repeating path pattern";
  }

  const params = [...u.searchParams.keys()];
  if (params.length > 6) return `${params.length} query parameters (faceted navigation)`;
  const action = params.find((k) => ACTION_PARAM.test(k));
  if (action) return `Action link (?${action}=)`;

  // Calendar traps page forward forever: any year well past next year is a generated page.
  const maxYear = now.getFullYear() + 1;
  const years = [...`${u.pathname}?${u.search}`.matchAll(/(?:^|\D)((?:19|20|21)\d{2})(?!\d)/g)].map((m) => m[1]);
  if (years.some((y) => Number(y) > maxYear) && /(calendar|event|date|month|year|day|week|archive|\/\d{4}\/\d{1,2}\b|[?&](y|m|d|yr|mo)=)/i.test(url)) {
    return "Calendar page far in the future";
  }
  return null;
}

/** Path + parameter names, used to cap how many query-string variants of one page we crawl. */
export function variantKey(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.search) return null;
    return `${u.host}${u.pathname}`;
  } catch {
    return null;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiles user exclude patterns. A pattern starting with "/" matches the path from the start
 * (robots.txt style, `*` wildcard, `$` end anchor); anything else matches anywhere in the URL.
 */
export function compilePatterns(patterns: string[]): ((url: string) => boolean) | null {
  const res = patterns
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((p) => {
      const anchoredEnd = p.endsWith("$");
      const body = (anchoredEnd ? p.slice(0, -1) : p).split("*").map(escapeRe).join(".*");
      return { pathOnly: p.startsWith("/"), re: new RegExp(`${p.startsWith("/") ? "^" : ""}${body}${anchoredEnd ? "$" : ""}`, "i") };
    });
  if (!res.length) return null;
  return (url: string) => {
    let path = url;
    try {
      const u = new URL(url);
      path = u.pathname + u.search;
    } catch {
      /* keep raw */
    }
    return res.some(({ pathOnly, re }) => re.test(pathOnly ? path : url));
  };
}

const W3C_DATETIME = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d))?)?)?$/;

/** sitemaps.org requires W3C Datetime: YYYY, YYYY-MM, YYYY-MM-DD, or a full timestamp with a timezone. */
export function isW3cDatetime(v: string): boolean {
  return W3C_DATETIME.test(v.trim());
}

/** Best-effort conversion of any parseable date to a W3C date (YYYY-MM-DD). */
export function toW3cDate(v: string | undefined | null): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s) && isW3cDatetime(s)) return s.slice(0, 10);
  const t = Date.parse(s);
  if (Number.isNaN(t)) return undefined;
  const d = new Date(t);
  if (d.getUTCFullYear() < 1995 || t > Date.now() + 86_400_000) return undefined;
  return d.toISOString().slice(0, 10);
}
