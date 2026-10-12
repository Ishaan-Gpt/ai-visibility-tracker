import { safeFetch, BROWSER_UA, SafeFetchError } from "@/lib/net/safeFetch";

/**
 * Live access probe: requests a URL with a crawler's user-agent string and compares the response with a
 * normal browser request. Detects WAF / bot-management blocks (Cloudflare, Akamai, DataDome, HUMAN, Imperva,
 * Sucuri, AWS WAF, Vercel, Radware, Kasada, F5) and status-code blocks.
 *
 * Honesty note: requests come from our servers, not from each vendor's published IP ranges. Firewalls that
 * verify crawler IPs (common for Googlebot/Bingbot) may block us while letting the real crawler through.
 */

export type LiveVerdict = "ok" | "blocked" | "challenge" | "rate-limited" | "error" | "different" | "skipped";

export interface ProbeResult {
  verdict: LiveVerdict;
  status: number | null;
  bytes: number;
  ms: number;
  /** Detected protection vendor, if any. */
  vendor: string | null;
  /** Short human-readable reason. */
  reason: string;
  title?: string | null;
  finalUrl?: string;
  /** Response Content-Type (lowercased media type). */
  contentType?: string | null;
  /** The server answered this agent with Markdown / plain text instead of HTML (AI-friendly content negotiation). */
  markdown?: boolean;
  /** The site refused a browser request at the same time, so this result may reflect rate limiting, not the user-agent. */
  unreliable?: boolean;
}

const MAX_BYTES = 300_000;

interface Marker {
  vendor: string;
  kind: "challenge" | "blocked";
  test: (body: string, h: Record<string, string>, status: number) => boolean;
  label: string;
}

const lower = (s: string) => s.toLowerCase();

const MARKERS: Marker[] = [
  { vendor: "Cloudflare", kind: "challenge", label: "Cloudflare challenge (\"Just a moment…\")", test: (b, h) => h["cf-mitigated"] === "challenge" || /<title>\s*just a moment\.\.\.\s*<\/title>/i.test(b) || /_cf_chl_opt|cf-chl-widget|cf_chl_prog/i.test(b) },
  { vendor: "Cloudflare", kind: "blocked", label: "Cloudflare block page (\"Attention Required\")", test: (b) => /attention required! \| cloudflare|sorry, you have been blocked|cf-error-details/i.test(b) },
  { vendor: "Vercel", kind: "challenge", label: "Vercel Security Checkpoint", test: (b, h) => /challenge/.test(h["x-vercel-mitigated"] ?? "") || /vercel security checkpoint/i.test(b) },
  { vendor: "Vercel", kind: "blocked", label: "Vercel firewall deny", test: (_b, h) => /deny/.test(h["x-vercel-mitigated"] ?? "") },
  { vendor: "DataDome", kind: "challenge", label: "DataDome captcha", test: (b, h) => /captcha-delivery\.com|geo\.captcha/i.test(b) || ("x-datadome" in h && /captcha|block/i.test(b)) || /datadome/i.test(h["x-dd-b"] ?? "") },
  { vendor: "HUMAN (PerimeterX)", kind: "challenge", label: "HUMAN / PerimeterX \"Press & Hold\"", test: (b) => /px-captcha|_pxhd|perimeterx|press & hold/i.test(b) },
  { vendor: "Imperva", kind: "blocked", label: "Imperva / Incapsula block", test: (b, h) => /_incapsula_resource|incapsula incident id/i.test(b) || ("x-iinfo" in h && b.length < 5000 && /request unsuccessful|incident/i.test(b)) },
  { vendor: "Akamai", kind: "blocked", label: "Akamai \"Access Denied\"", test: (b, h, s) => (/akamaighost/i.test(h["server"] ?? "") && s === 403) || (/you don't have permission to access/i.test(b) && /reference\s*#?\s*[\d.a-f]+/i.test(b)) },
  { vendor: "Sucuri", kind: "blocked", label: "Sucuri firewall block", test: (b, h) => /sucuri website firewall - access denied/i.test(b) || ("x-sucuri-block" in h) },
  { vendor: "AWS WAF", kind: "challenge", label: "AWS WAF challenge", test: (b, h) => /^(challenge|captcha)$/i.test(h["x-amzn-waf-action"] ?? "") || /awswaf|aws-waf-token/i.test(b) },
  { vendor: "Radware", kind: "challenge", label: "Radware bot manager", test: (b) => /validate\.perfdrive\.com|shieldsquare/i.test(b) },
  { vendor: "Kasada", kind: "challenge", label: "Kasada challenge", test: (b, h) => "x-kpsdk-ct" in h || /ips\.js\?|kpsdk/i.test(b.slice(0, 4000)) },
  { vendor: "F5", kind: "blocked", label: "F5 / BIG-IP ASM rejection", test: (b) => /the requested url was rejected\. please consult with your administrator/i.test(b) },
];

const GENERIC_BLOCK_TITLE = /access denied|forbidden|blocked|captcha|are you a robot|verify you are human|bot detected|unusual traffic|security check|not authorized|request rejected/i;

export function detectVendor(h: Record<string, string>): string | null {
  const server = lower(h["server"] ?? "");
  if (h["cf-ray"] || server.includes("cloudflare")) return "Cloudflare";
  if (h["x-vercel-id"] || server.includes("vercel")) return "Vercel";
  if (server.includes("akamai") || h["x-akamai-transformed"] || h["akamai-grn"]) return "Akamai";
  if (h["x-iinfo"] || h["x-cdn"] === "Incapsula") return "Imperva";
  if (h["x-sucuri-id"]) return "Sucuri";
  if (h["x-datadome"] || h["x-datadome-cid"]) return "DataDome";
  if (h["x-amz-cf-id"] || server.includes("cloudfront")) return "AWS CloudFront";
  if (h["x-served-by"]?.includes("cache-") || h["fastly-debug-digest"] || server.includes("fastly")) return "Fastly";
  if (server.includes("netlify") || h["x-nf-request-id"]) return "Netlify";
  return null;
}

function titleOf(body: string): string | null {
  const m = body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

export interface RawProbe {
  ok: boolean;
  status: number | null;
  bytes: number;
  ms: number;
  headers: Record<string, string>;
  body: string;
  finalUrl?: string;
  error?: string;
}

export async function rawProbe(url: string, userAgent: string, timeoutMs: number): Promise<RawProbe> {
  const started = Date.now();
  try {
    const res = await safeFetch(url, {
      userAgent,
      timeoutMs,
      maxBytes: MAX_BYTES,
      maxRedirects: 5,
      // gzip only: a truncated gzip stream can still be partially decoded, brotli cannot.
      headers: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "accept-encoding": "gzip" },
    });
    return { ok: true, status: res.status, bytes: res.bytes, ms: res.elapsedMs, headers: res.headers, body: res.body, finalUrl: res.finalUrl };
  } catch (e) {
    const msg = e instanceof SafeFetchError ? e.message : (e as NodeJS.ErrnoException)?.code ?? (e as Error)?.message ?? "error";
    return { ok: false, status: null, bytes: 0, ms: Date.now() - started, headers: {}, body: "", error: String(msg) };
  }
}

/** Classifies a single response, optionally against the browser baseline. */
export function classify(p: RawProbe, baseline: RawProbe | null): ProbeResult {
  const contentType = (p.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase() || null;
  const base = { status: p.status, bytes: p.bytes, ms: p.ms, finalUrl: p.finalUrl, contentType };
  if (!p.ok || p.status === null) {
    const timeout = /too long/i.test(p.error ?? "");
    return { ...base, verdict: "error", vendor: null, reason: timeout ? "Timed out (some firewalls silently drop bot traffic)" : `Connection failed (${p.error ?? "unknown"})` };
  }
  const vendor = detectVendor(p.headers);
  const body = p.body;
  const baseType = (baseline?.headers["content-type"] ?? "").toLowerCase();
  if (p.status >= 200 && p.status < 300 && /markdown|text\/plain/.test(contentType ?? "") && /html/.test(baseType) && p.bytes > 200) {
    return { ...base, title: null, verdict: "ok", vendor, markdown: true, reason: `Served Markdown (${contentType}, ${fmtKb(p.bytes)}) instead of HTML: an AI-friendly version of the page` };
  }
  const title = titleOf(body);
  for (const m of MARKERS) {
    // Only trust body markers on small or non-2xx pages: a normal page can mention "captcha" in passing.
    const plausible = p.status >= 400 || p.bytes < 30_000;
    if (plausible && m.test(body, p.headers, p.status)) {
      return { ...base, title, verdict: m.kind, vendor: m.vendor, reason: `${m.label}, HTTP ${p.status}` };
    }
  }
  if (p.status === 429) return { ...base, title, verdict: "rate-limited", vendor, reason: "HTTP 429 Too Many Requests" };
  if ([401, 403, 406, 451].includes(p.status)) return { ...base, title, verdict: "blocked", vendor, reason: `HTTP ${p.status}${vendor ? ` from ${vendor}` : ""}` };
  if (p.status >= 500) {
    const baseOk = baseline?.ok && baseline.status !== null && baseline.status < 400;
    return { ...base, title, verdict: baseOk ? "blocked" : "error", vendor, reason: `HTTP ${p.status}${baseOk ? " (the browser request got " + baseline!.status + ")" : ""}` };
  }
  if (p.status >= 400) {
    const baseSame = baseline?.status === p.status;
    return { ...base, title, verdict: baseSame ? "ok" : "blocked", vendor, reason: baseSame ? `HTTP ${p.status}, same as a browser` : `HTTP ${p.status} (a browser got ${baseline?.status ?? "?"})` };
  }
  if (title && GENERIC_BLOCK_TITLE.test(title) && !(baseline && titleOf(baseline.body) === title)) {
    return { ...base, title, verdict: "blocked", vendor, reason: `Block page titled "${title.slice(0, 60)}", HTTP ${p.status}` };
  }
  if (baseline?.ok && baseline.status !== null && baseline.status < 400 && baseline.bytes > 8_000 && p.bytes < baseline.bytes * 0.25) {
    return {
      ...base,
      title,
      verdict: "different",
      vendor,
      reason: `Got ${fmtKb(p.bytes)} vs ${fmtKb(baseline.bytes)} for a browser. Possibly a stripped or placeholder page`,
    };
  }
  return { ...base, title, verdict: "ok", vendor, reason: `HTTP ${p.status}, ${fmtKb(p.bytes)}${baseline?.bytes ? ` (browser ${fmtKb(baseline.bytes)})` : ""}` };
}

function fmtKb(n: number) {
  return n < 1024 ? `${n} B` : `${Math.round(n / 1024)} KB`;
}

export { BROWSER_UA };
