/*
 * Sample data for showing the real product UI on marketing pages. Fictional `.example` domains only.
 * Crawler verdicts are computed with the real robots.txt evaluator, not hand-written.
 */
import type { PageAuditReport } from "@/lib/tools/pageAudit/audit";
import type { BotResult } from "@/lib/tools/aiCrawlers/check";
import { AI_BOTS } from "@/lib/tools/aiCrawlers/bots";
import { evaluateAgent, parseRobots } from "@/lib/tools/aiCrawlers/robots";
import type { HistoryItem } from "@/lib/history";

export const SAMPLE_AUDIT: PageAuditReport = {
  url: "https://northside-dental.example/services",
  finalUrl: "https://northside-dental.example/services",
  status: 200,
  redirects: [],
  responseMs: 640,
  htmlBytes: 84_211,
  truncated: false,
  score: 64,
  summary: { errors: 1, warnings: 4, passes: 11 },
  facts: {
    title: "Services | Northside Dental",
    description: null,
    canonical: null,
    h1: ["Our services", "Book online"],
    lang: "en",
    wordCount: 412,
    images: { total: 9, missingAlt: 6 },
    links: { internal: 18, external: 2 },
    schemaTypes: ["WebSite"],
    ogTags: {},
  },
  checks: [],
  ai: {
    score: 46,
    checks: [
      { id: "ai-bots", severity: "error", weight: 30, title: "Blocked for OAI-SearchBot, PerplexityBot", detail: "robots.txt stops these crawlers, so their AI answers cannot cite the page.", fix: "Allow AI search crawlers in robots.txt." },
      { id: "ai-text", severity: "pass", weight: 20, title: "412 words readable without JavaScript", detail: "The content is in the raw HTML." },
      { id: "ai-schema", severity: "warning", weight: 15, title: "No entity-level structured data", detail: "Only generic site markup was found.", fix: "Add LocalBusiness and FAQPage JSON-LD." },
      { id: "ai-summary", severity: "warning", weight: 10, title: "No usable one-line summary", detail: "There is no meta description.", fix: "Write a factual meta description." },
      { id: "ai-questions", severity: "info", weight: 10, title: "Few question-style headings", detail: "6 H2/H3 headings, none phrased as questions.", fix: "Add a short FAQ." },
      { id: "ai-trust", severity: "pass", weight: 10, title: "Author declared", detail: "Authorship signals are present." },
      { id: "ai-llms", severity: "info", weight: 5, title: "No llms.txt", detail: "An optional, emerging convention.", fix: "Publish a short /llms.txt." },
    ],
  },
  topFixes: [
    { title: "Blocked for OAI-SearchBot, PerplexityBot", fix: "Allow AI search crawlers in robots.txt. One line, and ChatGPT and Perplexity can cite you again.", severity: "error", lens: "ai" },
    { title: "Missing meta description", fix: "Write a factual 70–160 character description of the services on offer.", severity: "warning", lens: "seo" },
    { title: "No entity-level structured data", fix: "Add LocalBusiness and FAQPage JSON-LD with the Schema Generator.", severity: "warning", lens: "ai" },
    { title: "2 H1 headings", fix: "Keep “Our services” as the single H1; make “Book online” an H2.", severity: "warning", lens: "seo" },
    { title: "6 of 9 images missing alt text", fix: "Describe each treatment photo in a few words.", severity: "warning", lens: "seo" },
  ],
  checkedAt: 1_790_000_000_000,
};

/** What each top fix is worth when applied, as [seo, ai] points. Mirrors the audit's scoring weights. */
export const FIX_GAINS: [number, number][] = [
  [0, 30],
  [5, 6],
  [0, 10],
  [5, 0],
  [5, 0],
];

export function scoresWith(fixed: Set<number>) {
  let seo = SAMPLE_AUDIT.score;
  let ai = SAMPLE_AUDIT.ai.score;
  fixed.forEach((i) => {
    seo += FIX_GAINS[i]?.[0] ?? 0;
    ai += FIX_GAINS[i]?.[1] ?? 0;
  });
  return { seo: Math.min(100, seo), ai: Math.min(100, ai) };
}

export const SAMPLE_ROBOTS_LINES = [
  "User-agent: *",
  "Disallow: /admin/",
  "",
  "User-agent: GPTBot",
  "Disallow: /",
  "",
  "User-agent: OAI-SearchBot",
  "Disallow: /",
  "",
  "User-agent: PerplexityBot",
  "Disallow: /",
  "",
  "User-agent: ClaudeBot",
  "Disallow: /",
];

/** Real evaluation of a robots.txt against the published AI user-agents. */
export function botsFor(robots: string): BotResult[] {
  const parsed = parseRobots(robots);
  return AI_BOTS.map((b) => ({ ...b, ...evaluateAgent(parsed, b.agent) }));
}

const H = 3600_000;
export const SAMPLE_REPORTS: HistoryItem[] = [
  { id: "s1", tool: "page-audit", title: "Northside Dental · Services", subtitle: "https://northside-dental.example/services", score: 64, aiScore: 46, createdAt: 1_790_000_000_000 - 2 * H },
  { id: "s2", tool: "ai-crawlers", title: "acme-bakery.example", subtitle: "https://acme-bakery.example/robots.txt", score: 41, aiScore: null, createdAt: 1_790_000_000_000 - 26 * H },
  { id: "s3", tool: "page-audit", title: "Fieldnotes Studio · Home", subtitle: "https://fieldnotes.example/", score: 94, aiScore: 90, createdAt: 1_790_000_000_000 - 80 * H },
];
