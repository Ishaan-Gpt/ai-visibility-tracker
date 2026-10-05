import { safeFetch, SafeFetchError, normalizeUrl } from "@/lib/net/safeFetch";
import { AI_BOTS, type BotInfo } from "./bots";
import { evaluateAgent, parseRobots, type AgentVerdict } from "./robots";

export interface BotResult extends BotInfo, AgentVerdict {}

export interface AiCrawlerReport {
  domain: string;
  robots: { found: boolean; status: number | null; url: string; sitemaps: string[]; bytes: number };
  llmsTxt: { found: boolean; url: string; bytes: number };
  bots: BotResult[];
  findings: { level: "good" | "warn" | "bad"; text: string }[];
  checkedAt: number;
  /** 0-100 AI-search readiness: share of AI-search/assistant bots that can reach the site, minus penalties. */
  score: number;
}

export async function checkAiCrawlers(input: string): Promise<AiCrawlerReport> {
  const base = normalizeUrl(input);
  const origin = `${base.protocol}//${base.hostname}`;
  const domain = base.hostname.replace(/^www\./, "");

  const [robotsRes, llmsRes] = await Promise.all([
    safeFetch(`${origin}/robots.txt`, { maxBytes: 500_000 }).catch((e) => {
      if (e instanceof SafeFetchError) throw e;
      return null;
    }),
    safeFetch(`${origin}/llms.txt`, { maxBytes: 500_000 }).catch(() => null),
  ]);

  const robotsOk = !!robotsRes && robotsRes.status === 200 && !/<html/i.test(robotsRes.body.slice(0, 500));
  const parsed = parseRobots(robotsOk ? robotsRes!.body : "");
  const llmsOk = !!llmsRes && llmsRes.status === 200 && !/<html/i.test(llmsRes.body.slice(0, 500)) && llmsRes.body.trim().length > 0;

  const bots: BotResult[] = AI_BOTS.map((b) => ({ ...b, ...evaluateAgent(parsed, b.agent) }));

  const findings: AiCrawlerReport["findings"] = [];
  const searchBots = bots.filter((b) => b.purpose === "ai-search" || b.purpose === "ai-user");
  const blockedSearch = searchBots.filter((b) => b.access === "blocked");
  const trainingBlocked = bots.filter((b) => b.purpose === "ai-training" && b.access === "blocked");

  if (!robotsOk) {
    findings.push({ level: "warn", text: "No robots.txt found. Every crawler is allowed by default, but you have no control or sitemap hint." });
  }
  if (blockedSearch.length === 0) {
    findings.push({ level: "good", text: "AI search and assistant crawlers can reach your site, so you are eligible to be cited in AI answers." });
  } else {
    findings.push({
      level: "bad",
      text: `${blockedSearch.map((b) => b.agent).join(", ")} ${blockedSearch.length === 1 ? "is" : "are"} blocked. You will not be cited by ${[...new Set(blockedSearch.map((b) => b.owner))].join(" / ")} AI search.`,
    });
  }
  if (trainingBlocked.length > 0) {
    findings.push({
      level: "good",
      text: `You opt out of AI training for ${trainingBlocked.length} crawler${trainingBlocked.length === 1 ? "" : "s"}${blockedSearch.length === 0 ? " while staying visible in AI search." : "."}`,
    });
  }
  const googlebot = bots.find((b) => b.agent === "Googlebot");
  if (googlebot?.access === "blocked") findings.push({ level: "bad", text: "Googlebot is blocked. Your site cannot appear in Google Search or AI Overviews." });
  if (robotsOk && parsed.sitemaps.length === 0) findings.push({ level: "warn", text: "robots.txt does not declare a Sitemap: URL." });
  if (llmsOk) findings.push({ level: "good", text: "llms.txt found. AI assistants get a curated map of your best content." });
  else findings.push({ level: "warn", text: "No llms.txt found. It is an emerging convention that helps AI tools find your key pages (adoption by AI vendors varies)." });

  let score = 100;
  score -= blockedSearch.length * 18;
  if (googlebot?.access === "blocked") score -= 30;
  score -= bots.filter((b) => b.access === "partial" && (b.purpose === "ai-search" || b.purpose === "search")).length * 5;
  if (!llmsOk) score -= 5;
  if (robotsOk && parsed.sitemaps.length === 0) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return {
    domain,
    robots: {
      found: robotsOk,
      status: robotsRes?.status ?? null,
      url: `${origin}/robots.txt`,
      sitemaps: parsed.sitemaps,
      bytes: robotsRes?.bytes ?? 0,
    },
    llmsTxt: { found: llmsOk, url: `${origin}/llms.txt`, bytes: llmsRes?.bytes ?? 0 },
    bots,
    findings,
    score,
    checkedAt: Date.now(),
  };
}
