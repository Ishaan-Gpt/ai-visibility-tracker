import { safeFetch, SafeFetchError, normalizeUrl, BROWSER_UA } from "@/lib/net/safeFetch";
import { pool } from "@/lib/net/pool";
import { validateLlmsTxt, type LlmsValidation } from "@/lib/tools/aiFiles/llms";
import { BOT_CATALOGUE, type BotInfo, type BotPurpose } from "./bots";
import {
  evaluateAgent,
  evaluatePath,
  explainPath,
  parseRobots,
  rulesForAgent,
  toTestPath,
  ROBOTS_MAX_BYTES,
  type AgentVerdict,
  type ParsedRobots,
  type PathExplanation,
  type RobotsLint,
} from "./robots";
import { classify, rawProbe, type ProbeResult, type RawProbe } from "./probe";
import { inspectSitemaps, type SitemapStatus } from "./sitemaps";
import { readPageSignals, type PageSignals } from "./signals";

export interface BotResult extends BotInfo, AgentVerdict {
  /** Live request with this bot's user-agent (absent on reports saved before live probing existed). */
  live?: ProbeResult;
  /** Live request to the user's test path. */
  livePath?: ProbeResult;
  /** robots.txt decision at "/" with the deciding rule. */
  root?: PathExplanation;
  /** robots.txt decision at the user's test path. */
  pathTest?: PathExplanation;
  /** Sampled sitemap paths this bot may not fetch. */
  blockedSamples?: string[];
  /** Disallow patterns that apply to this bot (excluding the root), for concrete "blocked from …" copy. */
  disallowed?: string[];
  /** robots.txt allows the bot but the server blocked or challenged its user-agent. */
  conflict?: boolean;
}

export type FindingLevel = "good" | "warn" | "bad" | "info";
export interface Finding {
  level: FindingLevel;
  text: string;
  /** Concrete next step. */
  fix?: string;
  /** Exact lines to paste (robots.txt etc.). */
  code?: string;
}

export type RobotsSemantics = "parsed" | "allow-all" | "disallow-all";
export type LivePattern = "none" | "ai-targeted" | "all-bots" | "verified-search" | "selective" | "inconclusive" | "not-run";

export interface AiCrawlerReport {
  domain: string;
  origin?: string;
  robots: {
    found: boolean;
    status: number | null;
    url: string;
    sitemaps: string[];
    bytes: number;
    finalUrl?: string;
    redirects?: string[];
    semantics?: RobotsSemantics;
    semanticsNote?: string;
    lint?: RobotsLint[];
    /** Raw file for the client-side path tester (capped). */
    text?: string;
    textCapped?: boolean;
    contentType?: string | null;
    html?: boolean;
    truncated?: boolean;
    groups?: number;
    /** robots.txt status when fetched with a browser user-agent, when it differed. */
    browserStatus?: number | null;
    contentSignals?: { agents: string[]; signals: Record<string, boolean> }[];
    /** RSL License: URLs. */
    licenses?: string[];
  };
  llmsTxt: {
    found: boolean;
    url: string;
    bytes: number;
    status?: number | null;
    contentType?: string | null;
    validation?: LlmsValidation;
    linkChecks?: { url: string; status: number | null; ok: boolean }[];
    full?: { found: boolean; url: string; status: number | null; bytes: number | null };
  };
  bots: BotResult[];
  findings: Finding[];
  checkedAt: number;
  /** 0-100 AI readiness. */
  score: number;
  scoreParts?: { label: string; earned: number; max: number }[];
  testPath?: string | null;
  samples?: { source: string | null; paths: string[] };
  sitemaps?: SitemapStatus[];
  live?: {
    url: string;
    baseline: ProbeResult | null;
    baselineAfter?: ProbeResult | null;
    pattern: LivePattern;
    note: string;
    vendor: string | null;
    probed: number;
    notRun: number;
    ms: number;
  };
  signals?: PageSignals & {
    aiTxt: { found: boolean; url: string; bytes: number };
    tdmrep: { found: boolean; url: string };
  };
}

const TOTAL_BUDGET_MS = 24_000;
const PROBE_CONCURRENCY = 5;
const ROBOTS_TEXT_CAP = 120_000;
/** Bots also probed at the user's test path (keeps the request count bounded). */
const PATH_PROBE_AGENTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "GPTBot", "ClaudeBot", "Googlebot", "Bingbot"];

const isAi = (p: BotPurpose) => p === "ai-search" || p === "ai-user";
const isBlockedLive = (r?: ProbeResult) => !r?.unreliable && (r?.verdict === "blocked" || r?.verdict === "challenge");
const isRefusal = (r?: ProbeResult | null) => !!r && (r.verdict === "blocked" || r.verdict === "challenge" || r.verdict === "rate-limited" || r.verdict === "error");
/** Probe order: establish the AI-vs-search pattern with the most important agents before any rate limit kicks in. */
const PRIORITY = ["OAI-SearchBot", "Googlebot", "ChatGPT-User", "Bingbot", "PerplexityBot", "Claude-SearchBot", "GPTBot", "Claude-User", "ClaudeBot", "Perplexity-User", "Applebot"];
const PROBE_BATCH = 8;

async function softFetch(url: string, opts: Parameters<typeof safeFetch>[1]) {
  try {
    return await safeFetch(url, opts);
  } catch (e) {
    return e instanceof Error ? e : new Error("fetch failed");
  }
}

export async function checkAiCrawlers(input: string, opts: { path?: string | null } = {}): Promise<AiCrawlerReport> {
  const started = Date.now();
  const deadline = started + TOTAL_BUDGET_MS;
  const base = normalizeUrl(input);
  const origin = `${base.protocol}//${base.host}`;
  const domain = base.hostname.replace(/^www\./, "");
  const homeUrl = `${origin}/`;
  const inputPath = base.pathname + base.search;
  const testPath = opts.path?.trim() ? toTestPath(opts.path) : inputPath !== "/" ? inputPath : null;

  // ── Phase 1: robots.txt, browser baseline, llms.txt and other files in parallel ───────────────
  const [robotsRes, baselineRaw, llmsRes, llmsFullRes, aiTxtRes, tdmRes] = await Promise.all([
    safeFetch(`${origin}/robots.txt`, { maxBytes: ROBOTS_MAX_BYTES + 1024, timeoutMs: 9000, maxRedirects: 5, headers: { accept: "text/plain,*/*;q=0.5" } }).catch((e) => {
      if (e instanceof SafeFetchError && /not allowed|valid URL|standard ports|public domain|credentials/i.test(e.message)) throw e;
      if ((e as NodeJS.ErrnoException)?.code === "ENOTFOUND") throw e;
      return e instanceof Error ? e : new Error("fetch failed");
    }),
    rawProbe(homeUrl, BROWSER_UA, 9000),
    softFetch(`${origin}/llms.txt`, { maxBytes: 500_000, timeoutMs: 8000, headers: { accept: "text/markdown,text/plain;q=0.9,*/*;q=0.5" } }),
    softFetch(`${origin}/llms-full.txt`, { maxBytes: 16_384, timeoutMs: 8000, headers: { accept: "text/markdown,text/plain;q=0.9,*/*;q=0.5" } }),
    softFetch(`${origin}/ai.txt`, { maxBytes: 32_768, timeoutMs: 6000 }),
    softFetch(`${origin}/.well-known/tdmrep.json`, { maxBytes: 32_768, timeoutMs: 6000, headers: { accept: "application/json" } }),
  ]);

  // DNS failure on every request means the domain does not exist.
  if (robotsRes instanceof Error && !baselineRaw.ok && /ENOTFOUND|EAI_AGAIN/.test(`${robotsRes.message} ${baselineRaw.error}`)) {
    throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
  }

  // ── robots.txt status semantics (RFC 9309 §2.3.1, Google) ───────────────────────────────────────
  let semantics: RobotsSemantics;
  let semanticsNote: string;
  let parsed: ParsedRobots = { groups: [], sitemaps: [] };
  let robotsText = "";
  let browserStatus: number | null | undefined;
  const robotsStatus = robotsRes instanceof Error ? null : robotsRes.status;
  if (robotsRes instanceof Error) {
    semantics = "disallow-all";
    semanticsNote = `robots.txt could not be fetched (${robotsRes.message.replace(/\.$/, "")}). RFC 9309 tells crawlers to treat an unreachable robots.txt as "disallow everything"; Google pauses crawling and retries.`;
  } else if (robotsRes.status >= 200 && robotsRes.status < 300) {
    semantics = "parsed";
    robotsText = robotsRes.body;
    parsed = parseRobots(robotsText);
    semanticsNote = parsed.looksLikeHtml
      ? "robots.txt returned an HTML page. Crawlers find no valid rules in it and treat the site as fully allowed."
      : `robots.txt returned ${robotsRes.status}; its rules apply.`;
  } else if (robotsRes.status === 429 || robotsRes.status >= 500) {
    semantics = "disallow-all";
    semanticsNote = `robots.txt returned ${robotsRes.status}. RFC 9309 and Google treat server errors${robotsRes.status === 429 ? " (Google counts 429 as one)" : ""} as "disallow everything" until the file is reachable again.`;
  } else if (robotsRes.status >= 400) {
    semantics = "allow-all";
    semanticsNote = `robots.txt returned ${robotsRes.status}. Any 4xx means "no restrictions": crawlers may fetch everything.`;
  } else {
    // 3xx that safeFetch did not follow (missing Location or too many hops)
    semantics = "allow-all";
    semanticsNote = `robots.txt returned ${robotsRes.status} without a usable redirect target. Google treats this like a missing file (allow everything).`;
  }
  if (!(robotsRes instanceof Error) && (robotsRes.status === 401 || robotsRes.status === 403 || robotsRes.status === 429 || robotsRes.status >= 500)) {
    const viaBrowser = await softFetch(`${origin}/robots.txt`, { maxBytes: 4096, timeoutMs: 6000, userAgent: BROWSER_UA });
    browserStatus = viaBrowser instanceof Error ? null : viaBrowser.status;
  }
  const robotsFound = semantics === "parsed" && !parsed.looksLikeHtml;

  // ── Phase 2: sitemaps + live probes + llms link checks, all against the same deadline ──────────
  const baseline = classify(baselineRaw, null);
  // Probe the URL a browser ends up on (saves redirect hops per probe); crawlers follow the same redirects.
  const probeUrl = baselineRaw.ok && baselineRaw.finalUrl ? baselineRaw.finalUrl : homeUrl;
  const probeable = BOT_CATALOGUE.filter((b) => b.ua);
  let notRun = 0;
  const timeLeft = () => deadline - Date.now();

  const runProbe = async (url: string, ua: string, against: RawProbe): Promise<ProbeResult> => {
    const left = timeLeft() - 1500;
    if (left < 2000) {
      notRun++;
      return { verdict: "skipped", status: null, bytes: 0, ms: 0, vendor: null, reason: "Not run: time budget reached" };
    }
    const raw = await rawProbe(url, ua, Math.min(8000, left));
    return classify(raw, against);
  };

  const testUrl = testPath ? `${origin}${testPath}` : null;
  const pathBaselineP = testUrl ? rawProbe(testUrl, BROWSER_UA, 8000) : Promise.resolve(null);

  const llmsOk = !(llmsRes instanceof Error) && llmsRes.status === 200 && llmsRes.body.trim().length > 0 && !/^\s*<(!doctype|html)/i.test(llmsRes.body.slice(0, 500));
  const llmsValidation = llmsOk ? validateLlmsTxt((llmsRes as { body: string }).body, { origin }) : undefined;

  // Probes run in batches; whenever a batch sees refusals we re-check with a browser UA. If the browser is now
  // refused too, the site has started rate-limiting our server: we stop (politely) and flag that batch as unreliable.
  let tripped: ProbeResult | null = null;
  let lastCheck: ProbeResult | null = null;
  const probeHome = async (): Promise<Map<string, ProbeResult>> => {
    const rank = (b: BotInfo) => (PRIORITY.indexOf(b.agent) === -1 ? 99 : PRIORITY.indexOf(b.agent));
    const ordered = [...probeable].sort((a, b) => rank(a) - rank(b));
    const out = new Map<string, ProbeResult>();
    for (let i = 0; i < ordered.length; i += PROBE_BATCH) {
      const batch = ordered.slice(i, i + PROBE_BATCH);
      if (tripped) {
        notRun += batch.length;
        batch.forEach((b) => out.set(b.agent, { verdict: "skipped", status: null, bytes: 0, ms: 0, vendor: null, reason: "Not run: the site began refusing our server, so we stopped" }));
        continue;
      }
      const res = await pool(batch, PROBE_CONCURRENCY, (b) => runProbe(probeUrl, b.ua!, baselineRaw));
      batch.forEach((b, j) => out.set(b.agent, res[j]));
      if (res.some((r) => isRefusal(r)) && timeLeft() > 3000) {
        lastCheck = classify(await rawProbe(probeUrl, BROWSER_UA, Math.min(6000, timeLeft() - 500)), null);
        if (isRefusal(lastCheck)) {
          tripped = lastCheck;
          batch.forEach((b) => {
            const r = out.get(b.agent)!;
            if (isRefusal(r)) out.set(b.agent, { ...r, unreliable: true, reason: `${r.reason} (a browser was refused at the same time)` });
          });
        }
      }
    }
    return out;
  };

  const [sitemapInfo, homeProbes, pathProbes, linkChecks] = await Promise.all([
    inspectSitemaps(origin, parsed.sitemaps, {
      max: 10,
      deadline: deadline - 2000,
      hosts: [robotsRes instanceof Error ? null : robotsRes.finalUrl, baselineRaw.finalUrl].filter((u): u is string => !!u),
    }),
    baselineRaw.ok ? probeHome() : Promise.resolve(null),
    (async () => {
      const pb = await pathBaselineP;
      if (!testUrl || !pb) return null;
      const targets = probeable.filter((b) => PATH_PROBE_AGENTS.includes(b.agent));
      const results = await pool(targets, 3, (b) => runProbe(testUrl, b.ua!, pb));
      return { baseline: classify(pb, null), byAgent: new Map(targets.map((b, i) => [b.agent, results[i]])) };
    })(),
    llmsValidation ? checkLinks(llmsValidation, deadline - 2500) : Promise.resolve(undefined),
  ]);

  const baselineAfter: ProbeResult | null = tripped ?? lastCheck;

  // ── Per-bot verdicts ────────────────────────────────────────────────────────────────────────────
  const samplePaths = sitemapInfo.samplePaths;
  const liveByAgent = homeProbes ?? new Map<string, ProbeResult>();

  const bots: BotResult[] = BOT_CATALOGUE.map((b) => {
    let verdict: AgentVerdict;
    let root: PathExplanation | undefined;
    let pathTest: PathExplanation | undefined;
    let blockedSamples: string[] | undefined;
    let disallowed: string[] | undefined;
    if (semantics === "parsed") {
      verdict = evaluateAgent(parsed, b.agent);
      root = explainPath(parsed, b.agent, "/");
      if (testPath) pathTest = explainPath(parsed, b.agent, testPath);
      blockedSamples = samplePaths.filter((p) => !evaluatePath(parsed, b.agent, p));
      const applied = rulesForAgent(parsed, b.agent);
      disallowed = [...new Set(applied.rules.filter((r) => !r.allow && r.pattern && r.pattern !== "/" && r.pattern !== "/*").map((r) => r.pattern))];
      const disallowedTotal = disallowed.length;
      if (verdict.access === "partial" && root.allowed) {
        const shown = disallowed.slice(0, 3).join(", ");
        const more = disallowedTotal > 3 ? ` and ${disallowedTotal - 3} more` : "";
        const sampled = samplePaths.length ? ` ${blockedSamples.length} of ${samplePaths.length} sampled sitemap URLs are blocked.` : "";
        verdict = { ...verdict, detail: `Allowed at /, but disallowed from ${shown}${more}.${sampled}` };
      } else if (verdict.access === "partial") {
        const sampled = samplePaths.length ? ` ${samplePaths.length - blockedSamples.length} of ${samplePaths.length} sampled sitemap URLs are allowed.` : "";
        verdict = { ...verdict, detail: `${verdict.detail}${sampled}` };
      }
      if (root.rule?.line && verdict.access === "blocked") verdict = { ...verdict, detail: `${verdict.detail.replace(/\.$/, "")} (line ${root.rule.line}).` };
    } else if (semantics === "allow-all") {
      verdict = { access: "allowed", basis: "none", detail: robotsStatus ? `robots.txt returned ${robotsStatus}, so everything is allowed.` : "No robots.txt, so everything is allowed." };
    } else {
      verdict = { access: "blocked", basis: "none", detail: `robots.txt ${robotsStatus ? `returned ${robotsStatus}` : "was unreachable"}, so compliant crawlers treat the whole site as disallowed.` };
    }
    const live = liveByAgent.get(b.agent) ?? (b.ua ? undefined : { verdict: "skipped" as const, status: null, bytes: 0, ms: 0, vendor: null, reason: b.controlOnly ? "Control token only: no crawler of its own" : "No reliable user-agent string published" });
    const livePath = pathProbes?.byAgent.get(b.agent);
    const conflict = verdict.access !== "blocked" && (isBlockedLive(live) || isBlockedLive(livePath));
    return { ...b, ...verdict, live, livePath, root, pathTest, blockedSamples, disallowed, conflict };
  });

  // ── Live pattern ──────────────────────────────────────────────────────────────────────────────
  const live = summariseLive(bots, baseline, tripped, baselineAfter, homeProbes !== null, probeUrl, notRun, Date.now() - started);
  // A refusal only counts as "firewall overrides robots.txt" when the comparison is trustworthy.
  for (const b of bots) {
    if (live.pattern === "inconclusive" || live.pattern === "not-run" || (live.pattern === "verified-search" && b.purpose === "search")) b.conflict = false;
    // Keep saved reports small: the detail panel shows at most a couple of dozen patterns.
    if (b.disallowed && b.disallowed.length > 25) b.disallowed = b.disallowed.slice(0, 25);
  }

  // ── Signals ───────────────────────────────────────────────────────────────────────────────────
  const pageSignals = readPageSignals(baselineRaw.ok && /html/i.test(baselineRaw.headers["content-type"] ?? "html") ? baselineRaw.body : "", baselineRaw.headers);
  const aiTxtOk = !(aiTxtRes instanceof Error) && aiTxtRes.status === 200 && !/^\s*<(!doctype|html)/i.test(aiTxtRes.body.slice(0, 300)) && aiTxtRes.body.trim().length > 0;
  const tdmOk = !(tdmRes instanceof Error) && tdmRes.status === 200 && /^\s*[[{]/.test(tdmRes.body);
  const signals: AiCrawlerReport["signals"] = {
    ...pageSignals,
    aiTxt: { found: aiTxtOk, url: `${origin}/ai.txt`, bytes: aiTxtOk ? (aiTxtRes as { bytes: number }).bytes : 0 },
    tdmrep: { found: tdmOk, url: `${origin}/.well-known/tdmrep.json` },
  };

  const llmsFullOk = !(llmsFullRes instanceof Error) && llmsFullRes.status === 200 && !/^\s*<(!doctype|html)/i.test(llmsFullRes.body.slice(0, 300)) && llmsFullRes.body.trim().length > 0;
  const llmsTxt: AiCrawlerReport["llmsTxt"] = {
    found: llmsOk,
    url: `${origin}/llms.txt`,
    bytes: llmsRes instanceof Error ? 0 : llmsRes.bytes,
    status: llmsRes instanceof Error ? null : llmsRes.status,
    contentType: llmsRes instanceof Error ? null : (llmsRes.headers["content-type"] ?? null),
    validation: llmsValidation,
    linkChecks,
    full: {
      found: llmsFullOk,
      url: `${origin}/llms-full.txt`,
      status: llmsFullRes instanceof Error ? null : llmsFullRes.status,
      bytes: llmsFullOk ? Number((llmsFullRes as { headers: Record<string, string> }).headers["content-length"]) || null : null,
    },
  };

  const robots: AiCrawlerReport["robots"] = {
    found: robotsFound,
    status: robotsStatus,
    url: `${origin}/robots.txt`,
    sitemaps: parsed.sitemaps,
    bytes: robotsRes instanceof Error ? 0 : robotsRes.bytes,
    finalUrl: robotsRes instanceof Error ? undefined : robotsRes.finalUrl,
    redirects: robotsRes instanceof Error ? [] : robotsRes.redirects,
    semantics,
    semanticsNote,
    lint: parsed.lint ?? [],
    text: robotsText.slice(0, ROBOTS_TEXT_CAP),
    textCapped: robotsText.length > ROBOTS_TEXT_CAP,
    contentType: robotsRes instanceof Error ? null : (robotsRes.headers["content-type"] ?? null),
    html: !!parsed.looksLikeHtml,
    truncated: !!parsed.truncated,
    groups: parsed.groups.length,
    browserStatus,
    contentSignals: parsed.groups.filter((g) => g.contentSignals).map((g) => ({ agents: g.agents, signals: g.contentSignals! })),
    licenses: parsed.licenses ?? [],
  };

  const report: AiCrawlerReport = {
    domain,
    origin,
    robots,
    llmsTxt,
    bots,
    findings: [],
    checkedAt: Date.now(),
    score: 0,
    testPath,
    samples: { source: sitemapInfo.source, paths: samplePaths },
    sitemaps: sitemapInfo.sitemaps,
    live,
    signals,
  };
  const { score, parts } = scoreReport(report);
  report.score = score;
  report.scoreParts = parts;
  report.findings = buildFindings(report, parsed);
  return report;
}

async function checkLinks(v: LlmsValidation, deadline: number) {
  const links = v.sections.flatMap((s) => s.links).filter((l) => /^https?:\/\//i.test(l.url));
  const sample = [...new Map(links.map((l) => [l.url, l])).values()].slice(0, 6);
  return pool(sample, 3, async (l) => {
    const left = deadline - Date.now();
    if (left < 1500) return { url: l.url, status: null, ok: false };
    let res = await softFetch(l.url, { method: "HEAD", timeoutMs: Math.min(5000, left), maxBytes: 4096 });
    if (!(res instanceof Error) && [403, 405, 501].includes(res.status)) res = await softFetch(l.url, { timeoutMs: Math.min(5000, left), maxBytes: 4096 });
    const status = res instanceof Error ? null : res.status;
    return { url: l.url, status, ok: status !== null && status < 400 };
  });
}

function summariseLive(
  bots: BotResult[],
  baseline: ProbeResult,
  tripped: ProbeResult | null,
  baselineAfter: ProbeResult | null,
  ran: boolean,
  url: string,
  notRun: number,
  ms: number,
): NonNullable<AiCrawlerReport["live"]> {
  const probed = bots.filter((b) => b.live && b.live.verdict !== "skipped");
  const reliable = probed.filter((b) => !b.live?.unreliable);
  const vendor = baseline.vendor ?? probed.find((b) => b.live?.vendor)?.live?.vendor ?? null;
  const common = { url, baseline, baselineAfter, vendor, probed: probed.length, notRun, ms };
  if (!ran || baseline.verdict === "error") {
    return { ...common, pattern: "not-run", note: `Our browser request to your homepage failed (${baseline.reason}), so we could not compare crawler access.` };
  }
  if (baseline.verdict === "blocked" || baseline.verdict === "challenge" || baseline.verdict === "rate-limited") {
    return { ...common, pattern: "inconclusive", note: `Even a normal browser request from our server was refused (${baseline.reason}). Your firewall treats our data-centre IP as a bot, so the per-crawler results cannot be compared reliably.` };
  }
  const ai = reliable.filter((b) => b.purpose !== "search");
  const search = reliable.filter((b) => b.purpose === "search");
  const stopNote = tripped
    ? ` After ${reliable.length} requests the site started refusing our server even with a browser user-agent (${tripped.reason}), so we stopped; ${probed.length - reliable.length + notRun} crawler${probed.length - reliable.length + notRun === 1 ? " was" : "s were"} not tested reliably.`
    : "";
  if (tripped && (ai.length < 2 || search.length < 1)) {
    return { ...common, pattern: "inconclusive", note: `The site started refusing our server (${tripped.reason}) before we could test enough crawlers. Blocks shown may be rate limiting, not rules about the user-agent.` };
  }
  const aiBlocked = ai.filter((b) => isBlockedLive(b.live));
  const searchBlocked = search.filter((b) => isBlockedLive(b.live));
  if (aiBlocked.length === 0 && searchBlocked.length === 0) {
    return { ...common, pattern: "none", note: `All ${reliable.length} crawler user-agents tested got the same kind of response as a browser.${stopNote}` };
  }
  // The big two search engines getting through while AI agents are refused is the signature of an AI-bot rule.
  const majorSearchOk = search.filter((b) => b.agent === "Googlebot" || b.agent === "Bingbot").every((b) => !isBlockedLive(b.live));
  if (searchBlocked.length === 0 || (majorSearchOk && aiBlocked.length >= ai.length * 0.5)) {
    return {
      ...common,
      pattern: "ai-targeted",
      note: `${aiBlocked.length} AI user-agent${aiBlocked.length === 1 ? " was" : "s were"} refused while ${search.map((b) => b.agent).slice(0, 2).join(" and ")} and a browser got through. That pattern points to a rule aimed at AI bots${vendor ? ` (for example ${vendor} bot settings)` : ""}, which real AI crawlers will most likely hit too.${stopNote}`,
    };
  }
  if (aiBlocked.length === 0) {
    return {
      ...common,
      pattern: "verified-search",
      note: `Only search-engine user-agents (${searchBlocked.map((b) => b.agent).join(", ")}) were refused. That is typical fake-crawler protection: the firewall checks that "Googlebot" really comes from Google's IPs, which the real crawler passes.${stopNote}`,
    };
  }
  if (aiBlocked.length >= ai.length * 0.8 && searchBlocked.length >= search.length * 0.8) {
    return {
      ...common,
      pattern: "all-bots",
      note: `Nearly every crawler user-agent was refused while a browser got through. This is either a general bot block or impersonation protection that verifies crawler IPs; real crawlers from verified IP ranges pass the second kind, so treat these results as a warning, not proof.${stopNote}`,
    };
  }
  return {
    ...common,
    pattern: "selective",
    note: `Some crawler user-agents were refused (${[...aiBlocked, ...searchBlocked].slice(0, 6).map((b) => b.agent).join(", ")}${aiBlocked.length + searchBlocked.length > 6 ? "…" : ""}) while others and a browser got through, which suggests rules for specific bots.${stopNote}`,
  };
}

// ── Scoring ─────────────────────────────────────────────────────────────────────────────────────

function liveFactor(b: BotResult, pattern: LivePattern): number {
  const v = b.live?.verdict;
  if (!v || v === "ok" || v === "skipped") return 1;
  if (v === "different") return 0.8;
  if (v === "error" || v === "rate-limited") return 0.9;
  // blocked / challenge
  if (pattern === "inconclusive" || pattern === "not-run") return 1;
  if (pattern === "verified-search" && b.purpose === "search") return 1;
  if (pattern === "all-bots") return 0.5;
  return 0;
}

function robotsFactor(b: BotResult, sampleCount: number): number {
  if (b.access === "blocked") return 0;
  if (b.access === "partial") {
    if (sampleCount > 0 && b.blockedSamples && b.root?.allowed !== false) {
      // Use the sitemap sample when we have one: share of real URLs it can fetch.
      return 0.6 + 0.4 * (1 - b.blockedSamples.length / sampleCount);
    }
    // No sample: some paths are off-limits but we cannot tell how much content that is; small penalty.
    return b.root?.allowed === false ? 0.3 : 0.9;
  }
  return 1;
}

function weightedReach(bots: BotResult[], pattern: LivePattern, sampleCount: number): number {
  const total = bots.reduce((n, b) => n + (b.weight ?? 1), 0);
  if (!total) return 1;
  return bots.reduce((n, b) => n + (b.weight ?? 1) * robotsFactor(b, sampleCount) * liveFactor(b, pattern), 0) / total;
}

export function scoreReport(r: AiCrawlerReport): { score: number; parts: { label: string; earned: number; max: number }[] } {
  const pattern = r.live?.pattern ?? "not-run";
  const aiBots = r.bots.filter((b) => isAi(b.purpose) && !b.controlOnly);
  const searchBots = r.bots.filter((b) => b.purpose === "search");
  const s = r.signals;

  const n = r.samples?.paths.length ?? 0;
  let ai = 45 * weightedReach(aiBots, pattern, n);
  let search = 30 * weightedReach(searchBots, pattern, n);
  let snippets = 10;
  if (s?.noindex) {
    snippets = 0;
    search *= 0.3;
    ai *= 0.7;
  } else if (s?.nosnippet || s?.maxSnippet === 0) snippets = 0;
  else if (s?.maxSnippet !== null && s?.maxSnippet !== undefined && s.maxSnippet >= 0 && s.maxSnippet < 50) snippets = 5;

  const v = r.llmsTxt.validation;
  const llms = !r.llmsTxt.found ? 0 : !v ? 3 : !v.valid ? 2 : v.linkCount === 0 ? 3 : v.issues.some((i) => i.level === "warning") ? 4 : 5;

  const sem = r.robots.semantics;
  const lintErrors = (r.robots.lint ?? []).filter((l) => l.level === "error").length;
  const robotsHygiene = sem === "disallow-all" ? 0 : sem === "allow-all" || r.robots.html ? 2 : lintErrors ? 2 : 4;
  const sm = r.sitemaps ?? [];
  const smOk = sm.some((x) => x.isXml);
  const sitemapPts = smOk ? (sm.some((x) => x.declared && x.isXml) ? 6 : 4) : sm.some((x) => x.declared) ? 2 : 0;

  const parts = [
    { label: "AI search & assistants can reach you", earned: Math.round(ai), max: 45 },
    { label: "Google & Bing can reach you", earned: Math.round(search), max: 30 },
    { label: "Snippets usable in AI answers", earned: snippets, max: 10 },
    { label: "robots.txt & sitemap hygiene", earned: robotsHygiene + sitemapPts, max: 10 },
    { label: "llms.txt", earned: llms, max: 5 },
  ];
  const score = Math.max(0, Math.min(100, Math.round(parts.reduce((n, p) => n + p.earned, 0))));
  return { score, parts };
}

// ── Findings ────────────────────────────────────────────────────────────────────────────────────

/** "A, B, C, D and 10 more" so long lists stay readable. */
const names = (bs: BotResult[]) => (bs.length > 5 ? `${bs.slice(0, 4).map((b) => b.agent).join(", ")} and ${bs.length - 4} more` : bs.map((b) => b.agent).join(", "));
const owners = (bs: BotResult[]) => [...new Set(bs.map((b) => b.owner))].join(" / ");

function allowBlock(bs: BotResult[]): string {
  return [...bs.map((b) => `User-agent: ${b.agent}`), "Allow: /"].join("\n");
}

function vendorFix(vendor: string | null): string {
  switch (vendor) {
    case "Cloudflare":
      return "In Cloudflare, open AI Crawl Control (or Security → Bots) and set the AI search and assistant crawlers to Allow; also check WAF custom rules that match on user-agent. Cloudflare's \"Block AI bots\" setting blocks AI search crawlers too, not just training.";
    case "Vercel":
      return "In the Vercel dashboard, check Firewall → Bot Management and any custom rules matching user-agent; allow the AI search and assistant crawlers.";
    case "Akamai":
      return "In Akamai Bot Manager, move the AI search and assistant crawlers (or the AI bot category) from Deny/Challenge to Allow or Monitor.";
    case "Imperva":
      return "In Imperva, review Bot Protection / Advanced Bot Protection policy for AI crawlers and allow the search and assistant ones.";
    case "DataDome":
      return "In DataDome, allow the AI search and assistant crawlers in your bot policy (they are usually listed as known bots).";
    default:
      return "Check your CDN / firewall bot rules and any server rules matching user-agent strings, and allow the AI search and assistant crawlers.";
  }
}

function buildFindings(r: AiCrawlerReport, parsed: ParsedRobots): Finding[] {
  const f: Finding[] = [];
  const bots = r.bots;
  const pattern = r.live?.pattern ?? "not-run";
  const aiBots = bots.filter((b) => isAi(b.purpose) && !b.controlOnly);
  const majorAi = aiBots.filter((b) => (b.weight ?? 1) >= 1);
  const google = bots.find((b) => b.agent === "Googlebot");
  const bing = bots.find((b) => b.agent === "Bingbot");
  const sem = r.robots.semantics;

  // robots.txt fetch problems first: they override everything else.
  if (sem === "disallow-all") {
    f.push({
      level: "bad",
      text: r.robots.semanticsNote ?? "robots.txt is unreachable, so crawlers treat the whole site as disallowed.",
      fix: r.robots.browserStatus && r.robots.browserStatus < 400
        ? `A browser gets ${r.robots.browserStatus} for /robots.txt but a bot user-agent gets ${r.robots.status}. Exempt /robots.txt from bot protection so every crawler can read it.`
        : "Make /robots.txt return 200 (or 404 if you want no rules). Never let it return 5xx or 429.",
    });
  }
  if (r.robots.html) f.push({ level: "warn", text: "Your /robots.txt URL serves an HTML page, so crawlers see no rules at all.", fix: "Serve a plain-text robots.txt (Content-Type: text/plain) at the root of the domain." });

  if (google?.access === "blocked" && sem !== "disallow-all") {
    f.push({ level: "bad", text: `Googlebot is blocked by robots.txt${google.root?.rule?.line ? ` (line ${google.root.rule.line})` : ""}. The site cannot appear in Google Search, AI Overviews or AI Mode.`, fix: "Remove the Disallow: / that applies to Googlebot, or add an explicit allow group.", code: allowBlock([google]) });
  }
  if (bing?.access === "blocked" && sem !== "disallow-all") {
    f.push({ level: "bad", text: "Bingbot is blocked by robots.txt. That removes you from Bing and from Copilot answers grounded in Bing.", code: allowBlock([bing]) });
  }

  const blockedAi = majorAi.filter((b) => b.access === "blocked");
  if (blockedAi.length && sem !== "disallow-all") {
    const lines = [...new Set(blockedAi.map((b) => b.root?.rule?.line).filter(Boolean))] as number[];
    f.push({
      level: "bad",
      text: `${names(blockedAi)} ${blockedAi.length === 1 ? "is" : "are"} blocked by robots.txt${lines.length ? ` (line ${lines.slice(0, 4).join(", ")})` : ""}. ${owners(blockedAi)} AI answers cannot fetch or cite your pages.`,
      fix: blockedAi.some((b) => b.basis === "specific")
        ? "Delete the Disallow: / under these crawlers' User-agent lines, or add this group (an Allow of the same length wins ties):"
        : "They fall under your User-agent: * block. Add a group that allows them (copy any private paths from your * group into it):",
      code: allowBlock(blockedAi),
    });
    const ignoring = blockedAi.filter((b) => b.mayIgnoreRobots);
    if (ignoring.length) {
      f.push({ level: "info", text: `${names(ignoring)} fetch pages on a person's request, and their operators say robots.txt may not apply to those fetches. Blocking them in robots.txt is a signal, not a guarantee.` });
    }
  }

  // WAF vs robots conflicts.
  const conflicts = aiBots.filter((b) => b.conflict);
  if (conflicts.length && (pattern === "ai-targeted" || pattern === "selective")) {
    f.push({
      level: "bad",
      text: `robots.txt allows ${names(conflicts)}, but your server${r.live?.vendor ? ` (${r.live.vendor})` : ""} refused ${conflicts.length === 1 ? "its" : "their"} user-agent while serving a browser normally. Real crawlers will very likely hit the same wall.`,
      fix: vendorFix(r.live?.vendor ?? null),
    });
  } else if (conflicts.length && pattern === "all-bots") {
    f.push({
      level: "warn",
      text: `Your server refused every crawler user-agent we tried (including ${names(conflicts.slice(0, 3))}) while serving a browser. This may be impersonation protection that real crawlers pass from their verified IPs, or a blanket bot block.`,
      fix: `Check your firewall's bot settings. ${vendorFix(r.live?.vendor ?? null)}`,
    });
  }
  if (pattern === "verified-search") f.push({ level: "info", text: r.live!.note });
  if (pattern === "inconclusive" || pattern === "not-run") f.push({ level: "info", text: r.live?.note ?? "Live access was not tested." });
  const md = bots.filter((b) => b.live?.markdown || b.livePath?.markdown);
  if (md.length) f.push({ level: "good", text: `Your server answers ${names(md)} with Markdown instead of HTML. That is a clean, AI-friendly version of your content.` });
  const different = aiBots.filter((b) => b.live?.verdict === "different");
  if (different.length) {
    f.push({ level: "warn", text: `${names(different)} received a much smaller page than a browser did. Check whether your server serves a stripped or placeholder page to these bots.` });
  }

  // Partial access, made concrete.
  const partialAi = majorAi.filter((b) => b.access === "partial");
  if (partialAi.length) {
    const b = partialAi[0];
    const where = (b.disallowed ?? []).slice(0, 3).join(", ");
    const sampled = r.samples?.paths.length ? ` ${b.blockedSamples?.length ?? 0} of ${r.samples.paths.length} sampled sitemap URLs are off-limits to ${b.agent}.` : "";
    f.push({
      level: (b.blockedSamples?.length ?? 0) > 0 || b.root?.allowed === false ? "warn" : "info",
      text: `${names(partialAi)} ${partialAi.length === 1 ? "is" : "are"} blocked from part of the site${where ? ` (${where})` : ""}.${sampled}`,
      fix: "Fine if those paths are private (cart, account, search). If they hold content you want cited, remove the Disallow lines for them.",
    });
  }

  // User's test path.
  if (r.testPath) {
    const blockedAtPath = bots.filter((b) => (isAi(b.purpose) || b.purpose === "search") && !b.controlOnly && b.pathTest && !b.pathTest.allowed);
    if (blockedAtPath.length) {
      const rule = blockedAtPath[0].pathTest?.rule;
      f.push({
        level: "warn",
        text: `${r.testPath} is blocked for ${names(blockedAtPath.slice(0, 6))}${blockedAtPath.length > 6 ? ` and ${blockedAtPath.length - 6} more` : ""}${rule ? ` by "${rule.allow ? "Allow" : "Disallow"}: ${rule.pattern}"${rule.line ? ` on line ${rule.line}` : ""}` : ""}.`,
      });
    } else f.push({ level: "good", text: `${r.testPath} is allowed for every AI search, assistant and search crawler.` });
  }

  // Good news on AI search.
  if (!blockedAi.length && sem !== "disallow-all" && !(conflicts.length && pattern !== "all-bots")) {
    f.push({ level: "good", text: "AI search and assistant crawlers can reach your site, so you are eligible to be cited in AI answers." });
  }

  // Snippet / indexing controls.
  const s = r.signals;
  if (s?.noindex) f.push({ level: "bad", text: "Your homepage has a noindex directive. It will drop out of Google and Bing, and with them out of AI Overviews and Copilot answers.", fix: "Remove noindex from the meta robots tag / X-Robots-Tag header." });
  if (s?.nosnippet) f.push({ level: "bad", text: "Your homepage uses nosnippet. Google will not show text from it in results, AI Overviews or AI Mode.", fix: "Remove nosnippet, or use data-nosnippet on just the elements you want kept out." });
  else if (s?.maxSnippet === 0) f.push({ level: "bad", text: "max-snippet:0 on the homepage works like nosnippet: Google will not use its text in AI Overviews or AI Mode.", fix: "Raise max-snippet (or use -1 for no limit)." });
  else if (s?.maxSnippet !== null && s?.maxSnippet !== undefined && s.maxSnippet > 0 && s.maxSnippet < 50) f.push({ level: "warn", text: `max-snippet:${s.maxSnippet} limits how much text Google can quote, including in AI features.` });
  if (s?.noai || s?.noimageai) {
    f.push({ level: "info", text: `Your page sets ${[s.noai && "noai", s.noimageai && "noimageai"].filter(Boolean).join(" and ")}. These are non-standard: OpenAI, Google, Anthropic and Perplexity do not document support. Use the robots.txt tokens (GPTBot, Google-Extended, ClaudeBot…) to opt out of training.` });
  }
  if (s?.dataNosnippet) f.push({ level: "info", text: `${s.dataNosnippet} element${s.dataNosnippet === 1 ? " is" : "s are"} marked data-nosnippet and will not be quoted in Google snippets or AI Overviews.` });

  // Training choice (neutral).
  const training = bots.filter((b) => b.purpose === "ai-training");
  const trainingBlocked = training.filter((b) => b.access === "blocked");
  if (trainingBlocked.length && sem !== "disallow-all") {
    f.push({ level: "good", text: `You opt out of AI training for ${trainingBlocked.length} of ${training.length} training agents${blockedAi.length === 0 ? " while staying visible in AI search." : "."}` });
  } else if (sem !== "disallow-all") {
    const fw = training.filter((b) => isBlockedLive(b.live));
    f.push({
      level: "info",
      text: fw.length && (pattern === "ai-targeted" || pattern === "selective")
        ? `robots.txt does not opt out of AI training, though your firewall currently refuses ${fw.length} training crawler${fw.length === 1 ? "" : "s"}. To state the opt-out in robots.txt too (and keep AI search), add:`
        : "Training crawlers may use your content. That is a business choice; if you want to opt out without losing AI search visibility, add:",
      code: [...training.filter((b) => (b.weight ?? 1) >= 1).slice(0, 8).map((b) => `User-agent: ${b.agent}`), "Disallow: /"].join("\n"),
    });
  }
  if (r.robots.contentSignals?.length) {
    const cs = r.robots.contentSignals[0];
    f.push({ level: "info", text: `robots.txt declares Content Signals (${Object.entries(cs.signals).map(([k, v]) => `${k}=${v ? "yes" : "no"}`).join(", ")}). This is Cloudflare's policy format: it states your terms but does not technically block anything.` });
  }
  if (r.robots.licenses?.length) f.push({ level: "info", text: `robots.txt points to RSL licensing terms (${r.robots.licenses[0]}). RSL states the terms on which AI companies may use your content; it does not block crawlers by itself.` });
  if (s?.tdmReservation || s?.tdmrep.found) f.push({ level: "info", text: `TDM Reservation Protocol ${s.tdmReservation ? `header/meta says tdm-reservation: ${s.tdmReservation}` : "file found at /.well-known/tdmrep.json"}. Relevant for EU text-and-data-mining opt-outs.` });
  if (s?.aiTxt.found) f.push({ level: "info", text: "An ai.txt file was found. It is a Spawning convention for media permissions; major AI search crawlers do not read it." });

  // robots.txt hygiene.
  if (sem === "allow-all" && r.robots.status && r.robots.status >= 400 && r.robots.status !== 404 && r.robots.status !== 410) {
    f.push({ level: "warn", text: `robots.txt returns ${r.robots.status}. Crawlers read that as "no rules", which may not be what you intend.`, fix: "Serve robots.txt with 200, or 404 if you truly have no rules." });
  } else if (!r.robots.found && sem === "allow-all") {
    f.push({ level: "warn", text: "No robots.txt found. Every crawler is allowed by default, but you have no control and no sitemap hint.", fix: "Generate one with the robots.txt & llms.txt generator." });
  }
  const lintErrors = (r.robots.lint ?? []).filter((l) => l.level === "error");
  const lintWarns = (r.robots.lint ?? []).filter((l) => l.level === "warning");
  if (lintErrors.length || lintWarns.length) {
    const first = lintErrors[0] ?? lintWarns[0];
    f.push({ level: lintErrors.length ? "warn" : "info", text: `robots.txt has ${lintErrors.length} error${lintErrors.length === 1 ? "" : "s"} and ${lintWarns.length} warning${lintWarns.length === 1 ? "" : "s"}. First: ${first.line ? `line ${first.line}: ` : ""}${first.message}` });
  }
  if (r.robots.redirects?.length) f.push({ level: "info", text: `robots.txt redirects (${r.robots.redirects.length} hop${r.robots.redirects.length === 1 ? "" : "s"}) to ${r.robots.finalUrl}. Crawlers follow up to 5 redirects, so this works, but serving it directly is safer.` });

  const sm = r.sitemaps ?? [];
  if (r.robots.found && parsed.sitemaps.length === 0) {
    const fallback = sm.find((x) => !x.declared && x.isXml);
    f.push({ level: "warn", text: fallback ? `robots.txt does not declare a sitemap, though one exists at ${fallback.url}.` : "robots.txt does not declare a Sitemap: URL.", code: fallback ? `Sitemap: ${fallback.url}` : undefined });
  }
  const broken = sm.filter((x) => x.declared && !x.isXml);
  if (broken.length) f.push({ level: "warn", text: `${broken.length === 1 ? "Declared sitemap" : `${broken.length} declared sitemaps`} ${broken.map((x) => x.url).slice(0, 2).join(", ")} ${broken.length === 1 ? "is" : "are"} not a readable XML sitemap (${broken[0].note ?? `HTTP ${broken[0].status ?? "error"}`}).` });

  // llms.txt.
  const v = r.llmsTxt.validation;
  if (r.llmsTxt.found && v) {
    const errs = v.counts?.error ?? v.issues.filter((i) => i.level === "error").length;
    const warns = v.counts?.warning ?? v.issues.filter((i) => i.level === "warning").length;
    const deadLinks = (r.llmsTxt.linkChecks ?? []).filter((l) => !l.ok);
    if (errs || warns) f.push({ level: "warn", text: `llms.txt found with ${errs} error${errs === 1 ? "" : "s"} and ${warns} warning${warns === 1 ? "" : "s"} against the llmstxt.org format.`, fix: "See the llms.txt section below, or rebuild it with the generator." });
    else f.push({ level: "good", text: `llms.txt follows the llmstxt.org format: ${v.sections.length} section${v.sections.length === 1 ? "" : "s"}, ${v.linkCount} link${v.linkCount === 1 ? "" : "s"}.` });
    if (deadLinks.length) f.push({ level: "warn", text: `${deadLinks.length} of ${r.llmsTxt.linkChecks!.length} sampled llms.txt links did not resolve (${deadLinks.slice(0, 2).map((l) => `${l.url} → ${l.status ?? "no response"}`).join("; ")}).` });
  } else {
    f.push({ level: "info", text: "No llms.txt found. It is a proposed convention that gives AI tools a curated map of your key pages; no major AI search engine has confirmed using it, so treat it as low-cost and optional.", fix: "Build one with the llms.txt generator." });
  }
  if (r.llmsTxt.full?.found) f.push({ level: "good", text: "llms-full.txt is published too, giving AI tools your full content in one file." });

  const order: Record<FindingLevel, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  return f.map((x, i) => ({ x, i })).sort((a, b) => order[a.x.level] - order[b.x.level] || a.i - b.i).map(({ x }) => x);
}

