import "server-only";
import { pool } from "@/lib/net/pool";
import { lexiconFor } from "./lexicon";
import { fetchSuggestions, marketFallback, SourceError, type Market } from "./sources";
import { normalizeKeyword, stemFor, words } from "./text";
import type { SourceStats, SuggestSource } from "./types";

/**
 * Expands a seed across several real autocomplete sources (Google, Bing, YouTube, DuckDuckGo, Amazon, eBay).
 * Query plan per source: the seed, seed + a-z / 0-9, a-z + seed, question words, prepositions, comparisons and
 * modifiers, then a second level that expands the strongest first-level suggestions while time remains.
 * Every request is bounded: per-source concurrency, a polite gap between requests, retry with backoff on
 * 429/5xx, a circuit breaker per source, and one overall time budget.
 */

type QueryKind = "seed" | "alpha" | "question" | "preposition" | "comparison" | "modifier" | "level2";

interface PlannedQuery {
  q: string;
  kind: QueryKind;
}

export interface Suggestion {
  keyword: string;
  sources: Set<SuggestSource>;
  rank: number;
  hits: number;
  /** Raw prominence score: sum over lists of weight / position. */
  score: number;
  depth: 1 | 2;
}

export interface ExpandResult {
  suggestions: Map<string, Suggestion>;
  requests: number;
  perSource: Partial<Record<SuggestSource, SourceStats>>;
  budgetHit: boolean;
  secondLevel: number;
}

interface SourcePolicy {
  concurrency: number;
  /** Minimum gap between request starts, per source (ms). */
  gapMs: number;
  kinds: QueryKind[];
  digits: boolean;
  prefixAlpha: boolean;
}

const POLICY: Record<SuggestSource, SourcePolicy> = {
  google: { concurrency: 5, gapMs: 35, kinds: ["seed", "alpha", "question", "preposition", "comparison", "modifier"], digits: true, prefixAlpha: true },
  bing: { concurrency: 4, gapMs: 50, kinds: ["seed", "alpha", "question", "preposition", "comparison", "modifier"], digits: true, prefixAlpha: false },
  youtube: { concurrency: 4, gapMs: 40, kinds: ["seed", "alpha", "question", "comparison", "modifier"], digits: false, prefixAlpha: false },
  duckduckgo: { concurrency: 2, gapMs: 150, kinds: ["seed", "alpha", "question"], digits: false, prefixAlpha: false },
  amazon: { concurrency: 4, gapMs: 60, kinds: ["seed", "alpha", "modifier"], digits: true, prefixAlpha: false },
  ebay: { concurrency: 3, gapMs: 60, kinds: ["seed", "alpha"], digits: false, prefixAlpha: false },
};

/** Weight of a list by how directly it reflects demand for the seed itself. */
const KIND_WEIGHT: Record<QueryKind, number> = {
  seed: 3,
  alpha: 1,
  question: 1,
  preposition: 1,
  comparison: 1,
  modifier: 1,
  level2: 0.6,
};

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const DIGITS = "0123456789".split("");
const MAX_FAILS_IN_ROW = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function planQueries(seed: string, language: string, policy: SourcePolicy, source: SuggestSource): PlannedQuery[] {
  const lex = lexiconFor(language);
  const year = new Date().getFullYear();
  const out: PlannedQuery[] = [{ q: seed, kind: "seed" }];
  const add = (q: string, kind: QueryKind) => {
    if (policy.kinds.includes(kind)) out.push({ q, kind });
  };
  for (const l of ALPHABET) add(`${seed} ${l}`, "alpha");
  if (policy.digits) for (const d of DIGITS) add(`${seed} ${d}`, "alpha");
  if (policy.prefixAlpha) for (const l of ALPHABET) add(`${l} ${seed}`, "alpha");
  for (const w of lex.questions) add(`${w} ${seed}`, "question");
  if (source === "youtube" && language.startsWith("en")) add(`how to ${seed}`, "question");
  for (const w of lex.prepositions) add(`${seed} ${w}`, "preposition");
  for (const w of lex.comparisons) add(`${seed} ${w}`, "comparison");
  for (const w of lex.modifiers.prefix) add(`${w} ${seed}`, "modifier");
  for (const w of lex.modifiers.suffix) add(`${seed} ${w}`, "modifier");
  if (source === "youtube" || source === "amazon") add(`${seed} ${year}`, "modifier");

  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.q) ? false : (seen.add(p.q), true)));
}

/** A suggestion is kept when it shares at least one content word with the seed (drops unrelated drift). */
function relevanceFilter(seed: string, language: string): (kw: string) => boolean {
  const stem = stemFor(language);
  const stop = new Set(lexiconFor(language).stopwords);
  const seedStems = words(seed).filter((w) => !stop.has(w)).map(stem);
  if (seedStems.length === 0) return () => true;
  const compact = seed.replace(/\s+/g, "");
  return (kw) => {
    const ws = words(kw).map(stem);
    if (seedStems.some((s) => ws.includes(s))) return true;
    // Non-space-delimited scripts (Japanese, Thai...) or merged spellings: substring match.
    return kw.replace(/\s+/g, "").includes(compact) || seedStems.some((s) => s.length >= 3 && kw.includes(s));
  };
}

class SourceRunner {
  stats: SourceStats = { requests: 0, ok: 0, failed: 0, keywords: 0, ms: 0 };
  private failsInRow = 0;
  private tripped = false;
  private nextSlot = 0;
  /** Queries dropped because the time budget ran out. */
  skipped = 0;

  constructor(
    readonly source: SuggestSource,
    private readonly market: Market,
    private readonly deadline: number,
  ) {
    const fb = marketFallback(source, market.country);
    if (fb) this.stats.market = fb;
  }

  get usable() {
    return !this.tripped && Date.now() < this.deadline - 400;
  }

  /** Spaces requests out so a source never sees a burst. */
  private async waitTurn() {
    const gap = POLICY[this.source].gapMs;
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot);
    this.nextSlot = slot + gap + Math.floor(Math.random() * gap);
    if (slot > now) await sleep(slot - now);
  }

  async run(q: string): Promise<string[] | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!this.usable) {
        if (!this.tripped) this.skipped++;
        return null;
      }
      await this.waitTurn();
      const left = this.deadline - Date.now();
      if (left < 400) {
        this.skipped++;
        return null;
      }
      const t = Date.now();
      this.stats.requests++;
      try {
        const list = await fetchSuggestions(this.source, q, this.market, Math.min(4000, left));
        this.stats.ok++;
        this.stats.ms += Date.now() - t;
        this.failsInRow = 0;
        return list;
      } catch (err) {
        this.stats.ms += Date.now() - t;
        this.stats.failed++;
        this.failsInRow++;
        const status = err instanceof SourceError ? err.status : -1;
        if (this.failsInRow >= MAX_FAILS_IN_ROW || status === 403) {
          this.tripped = true;
          this.stats.error = status === 403 || status === 429 ? "Rate limited by the source; partial results" : `Stopped after repeated errors (${err instanceof Error ? err.message : "error"})`;
          return null;
        }
        const retryable = err instanceof SourceError ? err.retryable : true;
        if (!retryable || attempt === 1) return null;
        // Exponential backoff with jitter; also slows every other worker on this source.
        const backoff = 600 * 2 ** (this.failsInRow - 1) + Math.random() * 300;
        this.nextSlot = Math.max(this.nextSlot, Date.now() + backoff);
        await sleep(backoff);
      }
    }
    return null;
  }
}

export interface ExpandOptions {
  seed: string;
  country: string;
  language: string;
  ddgRegion: string;
  sources: SuggestSource[];
  /** Total time budget for all suggestion requests (ms). */
  budgetMs?: number;
  /** Max distinct keywords to collect. */
  maxKeywords?: number;
}

export async function expandSeed(opts: ExpandOptions): Promise<ExpandResult> {
  const { seed, country, language, sources } = opts;
  const started = Date.now();
  const budget = opts.budgetMs ?? 22_000;
  const deadline = started + budget;
  const maxKeywords = opts.maxKeywords ?? 1500;
  const market: Market = { country, language, ddg: opts.ddgRegion };
  const relevant = relevanceFilter(seed, language);
  const found = new Map<string, Suggestion>();
  const perSourceKeywords = new Map<SuggestSource, Set<string>>();

  const record = (source: SuggestSource, list: string[], kind: QueryKind, depth: 1 | 2, query: string) => {
    const echo = normalizeKeyword(query, language);
    // "b running shoes" queries are for discovering "brooks running shoes"; a suggestion that still starts with the
    // bare letter ("b tennis shoes") is a fuzzy match on the letter, not a real query.
    const letterPrefix = kind === "alpha" && /^[\p{L}\p{N}] /u.test(echo) && !seed.startsWith(echo.slice(0, 2)) ? echo.slice(0, 2) : null;
    const weight = KIND_WEIGHT[kind];
    const set = perSourceKeywords.get(source) ?? new Set<string>();
    perSourceKeywords.set(source, set);
    list.forEach((raw, i) => {
      const k = normalizeKeyword(raw, language);
      // Sources often echo the query itself first; for synthetic queries ("a running shoes") that is not a suggestion.
      if (!k || (k === echo && kind !== "seed") || (letterPrefix && k.startsWith(letterPrefix)) || !relevant(k)) return;
      let s = found.get(k);
      if (!s) {
        if (found.size >= maxKeywords) return;
        s = { keyword: k, sources: new Set(), rank: i + 1, hits: 0, score: 0, depth };
        found.set(k, s);
      }
      s.sources.add(source);
      s.rank = Math.min(s.rank, i + 1);
      s.hits++;
      s.score += weight / (i + 1);
      if (depth < s.depth) s.depth = depth;
      set.add(k);
    });
  };

  const synthetic = new Set<string>();
  for (const l of [...ALPHABET, ...DIGITS]) {
    synthetic.add(normalizeKeyword(`${seed} ${l}`, language));
    synthetic.add(normalizeKeyword(`${l} ${seed}`, language));
  }

  const runners = new Map(sources.map((s) => [s, new SourceRunner(s, market, deadline)] as const));

  // Level 1: every source in parallel, each with its own concurrency limit.
  await Promise.all(
    sources.map(async (source) => {
      const runner = runners.get(source)!;
      const plan = planQueries(seed, language, POLICY[source], source);
      await pool(plan, POLICY[source].concurrency, async (p) => {
        const list = await runner.run(p.q);
        if (list) record(source, list, p.kind, 1, p.q);
      });
    }),
  );

  const level1Skipped = [...runners.values()].reduce((n, r) => n + r.skipped, 0);

  // Level 2: expand the strongest suggestions with web sources while at least ~5 s remain.
  let secondLevel = 0;
  const level2Sources = sources.filter((s) => s === "google" || s === "bing" || s === "youtube");
  if (level2Sources.length && deadline - Date.now() > 5000 && found.size < maxKeywords) {
    const remainingMs = deadline - Date.now();
    const count = Math.max(8, Math.min(40, Math.floor(remainingMs / 400)));
    const seedWords = words(seed).length;
    const candidates = [...found.values()]
      .filter((s) => s.keyword !== seed && words(s.keyword).length <= seedWords + 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map((s) => s.keyword);
    secondLevel = candidates.length;
    const jobs = level2Sources.flatMap((source) => candidates.map((q) => ({ source, q })));
    await pool(jobs, 8, async ({ source, q }) => {
      const runner = runners.get(source)!;
      const list = await runner.run(q);
      if (list) record(source, list, "level2", 2, q);
    });
  }

  const perSource: ExpandResult["perSource"] = {};
  let requests = 0;
  for (const [source, runner] of runners) {
    runner.stats.keywords = perSourceKeywords.get(source)?.size ?? 0;
    perSource[source] = runner.stats;
    requests += runner.stats.requests;
  }

  // "running shoes c" style phrases are usually our own alphabet queries echoed back by a source. Keep them only
  // when at least two sources agree ("vitamin c" is real; "laufschuhe c" is not).
  for (const q of synthetic) {
    const s = found.get(q);
    if (s && s.sources.size < 2) found.delete(q);
  }

  return { suggestions: found, requests, perSource, budgetHit: level1Skipped > 0, secondLevel };
}
