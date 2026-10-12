import "server-only";
import { aiConfigured, aiLabel } from "./ai";
import { clusterKeywords } from "./cluster";
import { dataforseoConfigured, enrichKeywords } from "./dataforseo";
import { makeGrouper } from "./groups";
import { classifyIntent } from "./intent";
import { hasLexicon } from "./lexicon";
import { expandSeed } from "./suggest";
import { words } from "./text";
import { COUNTRIES, type KeywordRow, type ResearchResponse, type SuggestSource } from "./types";

export const MAX_KEYWORDS = 1200;
const AI_TOP_KEYWORDS = 150;
const AI_TOP_CLUSTERS = 40;

export interface RunOptions {
  seed: string;
  country: string;
  language: string;
  sources: SuggestSource[];
  budgetMs?: number;
  /** Skip the optional AI pass (tests). */
  skipAi?: boolean;
}

/** Full pipeline: expand -> rank -> group -> cluster -> optional AI labels -> optional provider data. */
export async function runResearch(opts: RunOptions): Promise<ResearchResponse> {
  const started = Date.now();
  const { seed, country, language, sources } = opts;
  const ddg = COUNTRIES.find((c) => c.code === country)?.ddg ?? "wt-wt";
  const notes: string[] = [];

  const expanded = await expandSeed({
    seed,
    country,
    language,
    ddgRegion: ddg,
    sources,
    budgetMs: opts.budgetMs ?? 22_000,
    maxKeywords: MAX_KEYWORDS * 2,
  });

  // Strongest first, then cap. The seed is always row one.
  const seedHit = expanded.suggestions.get(seed);
  const others = [...expanded.suggestions.values()].filter((s) => s.keyword !== seed).sort((a, b) => b.score - a.score);
  const kept = others.slice(0, MAX_KEYWORDS - 1);
  if (others.length > kept.length) notes.push(`Showing the strongest ${MAX_KEYWORDS} of ${others.length + 1} unique suggestions.`);

  // Signal: square-root scaled share of the strongest non-seed score, so the long tail stays distinguishable.
  const maxScore = kept[0]?.score || 1;
  const signal = (score: number) => Math.max(1, Math.min(100, Math.round(100 * Math.sqrt(score / maxScore))));

  const group = makeGrouper(seed, language);
  const base = [
    {
      keyword: seed,
      sources: seedHit ? [...seedHit.sources] : [],
      rank: seedHit?.rank ?? null,
      hits: seedHit?.hits ?? 0,
      signal: 100,
      depth: 0 as const,
    },
    ...kept.map((s) => ({ keyword: s.keyword, sources: [...s.sources], rank: s.rank, hits: s.hits, signal: signal(s.score), depth: s.depth })),
  ];

  const { assignment, clusters } = clusterKeywords(base.map((b) => ({ keyword: b.keyword, signal: b.signal })), seed, language);

  let rows: KeywordRow[] = base.map((b) => {
    const g = group(b.keyword);
    return {
      ...b,
      intent: classifyIntent(b.keyword, { group: g.group, sources: b.sources }),
      intentBy: "rules",
      cluster: assignment.get(b.keyword) ?? seed,
      group: g.group,
      groupWord: g.groupWord,
      words: words(b.keyword).length || 1,
    };
  });

  if (expanded.budgetHit) notes.push("The time budget ran out before every query finished; results are slightly less complete than usual.");
  if (!hasLexicon(language)) notes.push("Question and preposition grouping is tuned for English, Spanish, French, German, Italian, Portuguese and Dutch.");
  if (sources.includes("bing") && language === "en") notes.push("Bing localises English suggestions by the server's location, so they may lean towards the US market.");

  // Optional AI pass (cluster names + intent for the strongest keywords) and optional provider data run in
  // parallel. Both are fail-soft; provider numbers are never estimated.
  // The route has 60 s; keep the AI pass inside what is left after expansion.
  const aiBudget = Math.min(10_000, 48_000 - (Date.now() - started));
  const wantAi = !opts.skipAi && aiConfigured() && rows.length > 5 && aiBudget >= 4000;
  const topics = clusters.filter((c) => c.kind === "topic").slice(0, AI_TOP_CLUSTERS);
  const [aiOut, enriched] = await Promise.all([
    wantAi
      ? aiLabel({
          seed,
          language,
          clusters: topics.map((c) => ({ name: c.name, samples: c.top.slice(0, 6) })),
          keywords: rows.slice(0, AI_TOP_KEYWORDS).map((r) => r.keyword),
        }, aiBudget)
      : Promise.resolve(null),
    dataforseoConfigured()
      ? enrichKeywords(rows.map((r) => r.keyword), country, language).catch((err: unknown) => (err instanceof Error ? err : new Error("Data provider failed")))
      : Promise.resolve(null),
  ]);

  const ai: ResearchResponse["ai"] = { used: false };
  if (aiOut) {
    ai.used = true;
    const rename = new Map<string, string>();
    const taken = new Set(clusters.map((c) => c.name.toLowerCase()));
    for (const c of clusters) {
      const next = aiOut.clusterNames.get(c.name);
      if (!next || next.toLowerCase() === c.name.toLowerCase() || taken.has(next.toLowerCase())) continue;
      taken.add(next.toLowerCase());
      rename.set(c.name, next);
      c.name = next;
      c.nameBy = "ai";
    }
    rows = rows.map((r) => {
      const intent = aiOut.intents.get(r.keyword);
      return { ...r, cluster: rename.get(r.cluster) ?? r.cluster, ...(intent ? { intent, intentBy: "ai" as const } : {}) };
    });
  } else if (wantAi) {
    ai.error = "AI labelling was unavailable; rule-based labels are shown.";
  }

  const provider: ResearchResponse["provider"] = { volume: false, name: null };
  if (enriched instanceof Error) {
    provider.error = enriched.message;
  } else if (enriched) {
    rows = rows.map((r) => {
      const e = enriched.data.get(r.keyword);
      return e ? { ...r, ...e } : { ...r, volume: null, kd: null, cpc: null, competition: null, trend: null };
    });
    provider.volume = true;
    provider.name = "DataForSEO";
    if (enriched.errors.length) provider.error = `Partial data: ${enriched.errors.join("; ")}`;
  }

  return {
    seed,
    country,
    language,
    sources,
    keywords: rows,
    clusters,
    provider,
    ai,
    stats: {
      suggestRequests: expanded.requests,
      elapsedMs: Date.now() - started,
      perSource: expanded.perSource,
      budgetHit: expanded.budgetHit,
      secondLevel: expanded.secondLevel,
    },
    notes,
  };
}
