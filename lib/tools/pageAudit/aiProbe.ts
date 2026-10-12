/*
 * Live AI-crawler access probe: fetch the page with each AI bot's published user-agent string and compare the response
 * with a normal-browser baseline. Catches WAF / CDN rules ("Block AI bots", bot-fight modes, challenge pages) that
 * robots.txt checks cannot see.
 *
 * Honesty caveat (surfaced in the UI): requests come from our server's IP with the bot's user-agent. Real crawlers come
 * from their operator's verified IP ranges, and some WAFs allow verified bots while challenging impostors (or vice versa),
 * so results can differ from what the real bot sees.
 */
import * as cheerio from "cheerio";
import type { SafeResponse } from "@/lib/net/safeFetch";
import { evaluatePath, type ParsedRobots } from "@/lib/tools/aiCrawlers/robots";
import { tryFetch, type Probe } from "./net";
import type { AiAccessReport, BotProbe } from "./types";

interface BotSpec {
  bot: string;
  operator: string;
  purpose: BotProbe["purpose"];
  ua: string;
}

/** Published user-agent strings (operator documentation, 2025–2026). */
export const PROBE_BOTS: BotSpec[] = [
  { bot: "OAI-SearchBot", operator: "OpenAI", purpose: "search", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot" },
  { bot: "ChatGPT-User", operator: "OpenAI", purpose: "user", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" },
  { bot: "GPTBot", operator: "OpenAI", purpose: "training", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot" },
  { bot: "PerplexityBot", operator: "Perplexity", purpose: "search", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
  { bot: "Claude-SearchBot", operator: "Anthropic", purpose: "search", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com/claude-searchbot)" },
  { bot: "ClaudeBot", operator: "Anthropic", purpose: "training", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
];

const CHALLENGE_MARKERS: [RegExp, string][] = [
  [/<title>\s*Just a moment\.\.\.\s*<\/title>|challenges\.cloudflare\.com|_cf_chl_opt|cf-browser-verification/i, "Cloudflare challenge"],
  [/Attention Required! \| Cloudflare|cf-error-details|Sorry, you have been blocked/i, "Cloudflare block page"],
  [/Vercel Security Checkpoint/i, "Vercel Security Checkpoint"],
  [/_Incapsula_Resource|Incapsula incident ID/i, "Imperva / Incapsula"],
  [/captcha-delivery\.com|datadome/i, "DataDome"],
  [/px-captcha|_pxAppId|perimeterx/i, "HUMAN / PerimeterX"],
  [/Pardon Our Interruption/i, "Imperva (Distil)"],
  [/<title>\s*Access Denied\s*<\/title>[\s\S]{0,2000}Reference #/i, "Akamai"],
  [/aws-waf-token|awswaf/i, "AWS WAF"],
  [/sgcaptcha|\.well-known\/sgcaptcha/i, "SiteGround anti-bot"],
];

export function detectChallenge(res: SafeResponse): string | null {
  const h = res.headers;
  if (/challenge/i.test(h["cf-mitigated"] ?? "")) return "Cloudflare challenge";
  if (/challenge|deny/i.test(h["x-vercel-mitigated"] ?? "")) return "Vercel firewall";
  if (h["x-amzn-waf-action"]) return "AWS WAF";
  if (h["x-datadome"] && res.status >= 400) return "DataDome";
  // Only sniff bodies on small or error responses: big real pages can mention vendors in passing.
  if (res.status >= 400 || res.body.length < 60_000) {
    const head = res.body.slice(0, 60_000);
    for (const [re, name] of CHALLENGE_MARKERS) if (re.test(head)) return name;
  }
  return null;
}

export function visibleWords(html: string): number {
  if (!html) return 0;
  const $ = cheerio.load(html);
  const text = $("body").find("script,style,noscript,svg,template").remove().end().text().replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function pathOf(u: string): string {
  try {
    const x = new URL(u);
    return `${x.pathname}${x.search}` || "/";
  } catch {
    return "/";
  }
}

/**
 * Runs every probe in parallel. `baseline` is the main audit fetch (desktop Chrome UA) so we don't fetch twice.
 */
export async function probeAiAccess(url: string, baseline: SafeResponse | null, robots: ParsedRobots, hardMs: number): Promise<AiAccessReport> {
  const path = pathOf(baseline?.finalUrl ?? url);
  const baseChallenge = baseline ? detectChallenge(baseline) : null;
  const baseWords = baseline && baseline.status < 400 && !baseChallenge ? visibleWords(baseline.body) : 0;
  const baseOk = !!baseline && baseline.status >= 200 && baseline.status < 400 && !baseChallenge;

  const results = await Promise.all(
    PROBE_BOTS.map((b) =>
      // gzip only: a truncated brotli stream can't be partially decoded, which would look like "different content".
      tryFetch(url, { userAgent: b.ua, maxBytes: 2_000_000, headers: { "accept-encoding": "gzip" } }, hardMs).then((p) => ({ b, p })),
    ),
  );

  const probes: BotProbe[] = results.map(({ b, p }) => judge(b, p, robots, path, baseOk, baseWords));
  return {
    baseline: { status: baseline?.status ?? null, words: baseWords, challenged: !!baseChallenge },
    probes,
    note: "Requested from our server with each bot's user-agent. Real crawlers come from their operator's verified IP ranges, so a firewall may treat them differently.",
  };
}

function judge(b: BotSpec, p: Probe, robots: ParsedRobots, path: string, baseOk: boolean, baseWords: number): BotProbe {
  const robotsAllowed = evaluatePath(robots, b.bot, path);
  const common = { bot: b.bot, operator: b.operator, purpose: b.purpose, robotsAllowed, ms: p.ms };
  if (!p.ok) {
    return { ...common, status: null, verdict: "no-response", detail: p.timeout ? "No response within the time limit (the connection may be tarpitted for this user-agent)." : `Connection failed: ${p.error}` };
  }
  const res = p.res;
  const challenge = detectChallenge(res);
  if (challenge) return { ...common, status: res.status, verdict: "challenge", detail: `${challenge} served instead of the page. Crawlers can't solve challenges, so they see nothing.` };
  if (res.status === 429) return { ...common, status: 429, verdict: "rate-limited", detail: "Rate-limited (HTTP 429). This can be our burst of test requests; re-run before acting." };
  if (res.status === 401 || res.status === 403 || res.status === 451 || res.status === 406) {
    return { ...common, status: res.status, verdict: "blocked", detail: `HTTP ${res.status} for this user-agent${baseOk ? " while a normal browser gets the page" : ""}.` };
  }
  if (res.status >= 500) return { ...common, status: res.status, verdict: baseOk ? "blocked" : "inconclusive", detail: `HTTP ${res.status}${baseOk ? " for this user-agent while a normal browser gets the page. Some firewalls answer bots with 5xx." : "."}` };
  if (res.status >= 400) return { ...common, status: res.status, verdict: baseOk ? "blocked" : "inconclusive", detail: `HTTP ${res.status}.` };
  if (!baseOk) return { ...common, status: res.status, verdict: "inconclusive", detail: `HTTP ${res.status}. Our browser baseline was blocked or failed, so we can't compare.` };
  const words = visibleWords(res.body);
  if (baseWords >= 80 && words < baseWords * 0.4) {
    return { ...common, status: res.status, words, verdict: "different", detail: `HTTP ${res.status}, but only ${words} words versus ${baseWords} for a browser. The server may be serving bots a stripped or placeholder page.` };
  }
  return { ...common, status: res.status, words, verdict: "ok", detail: `HTTP ${res.status}, ${words.toLocaleString()} words, same page a browser gets.` };
}
