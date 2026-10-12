import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { ngramsFor } from "@/lib/tools/keywordDensity/ngrams";
import { englishRank, expectedRate } from "@/lib/tools/keywordDensity/englishFrequency";
import { dedupeSubsumed } from "@/lib/tools/keywordDensity/distinctive";
import { isNoiseTerm } from "@/lib/tools/keywordDensity/stopWords";

/** Each list is capped at this many terms (the strongest first). */
export const COMPARE_CAP = 40;

export type CompareTerm = {
  key: string;
  phrase: string;
  n: number;
  you: number;
  them: number;
  youPer1000: number;
  themPer1000: number;
  /** How topical the term is (average rarity of its words in typical English, 0-1). */
  weight: number;
  score: number;
};

export type CompareResult = {
  /** Important terms the competitor uses and you never do. */
  missing: CompareTerm[];
  /** Terms they use at least twice as often (per 1,000 words). */
  underused: CompareTerm[];
  /** Terms you use that they don't. */
  yoursOnly: CompareTerm[];
  /** Topical terms you both use, side by side. */
  shared: CompareTerm[];
  youWords: number;
  themWords: number;
};

type Entry = { phrase: string; n: number; count: number };

function table(a: DocAnalysis): Map<string, Entry> {
  const m = new Map<string, Entry>();
  for (const n of [1, 2, 3] as const) {
    for (const r of ngramsFor(a, n)) {
      if (r.count < 1 || isNoiseTerm(r.phrase)) continue;
      m.set(r.key, { phrase: r.phrase, n, count: r.count });
    }
  }
  return m;
}

/** 0-1: how topical a term is. Very common words score ~0, words outside the common list score 1. */
function topicality(phrase: string): number {
  const parts = phrase.split(" ");
  let best = 0;
  for (const p of parts) {
    if (p.length < 2) continue;
    const r = englishRank(p);
    // ln(1/expected) ranges from ~2.3 (rank 1) to ~11.7 (unknown). Normalise to 0-1 from rank 300 upward.
    const v = r === null ? 1 : Math.max(0, Math.min(1, (Math.log(1 / expectedRate(p)) - Math.log(3000)) / (Math.log(1 / expectedRate("zzzz")) - Math.log(3000))));
    best = Math.max(best, v);
  }
  return best;
}

/**
 * Term gaps between your text and a competitor's. Counts are normalised per 1,000 words so long and
 * short pages compare fairly. Terms are 1-3 word phrases (no stop-word edges), grouped by lemma.
 */
export function compareDocs(you: DocAnalysis, them: DocAnalysis): CompareResult {
  const Y = table(you);
  const C = table(them);
  const yw = you.wordCount || 1;
  const cw = them.wordCount || 1;
  const minThem = them.wordCount > 1500 ? 3 : 2;
  const minYou = you.wordCount > 1500 ? 3 : 2;

  const make = (key: string, y: Entry | undefined, c: Entry | undefined): CompareTerm => {
    const phrase = (c && (!y || c.count >= y.count) ? c.phrase : y?.phrase) ?? key;
    const weight = topicality(phrase);
    const youPer1000 = ((y?.count ?? 0) / yw) * 1000;
    const themPer1000 = ((c?.count ?? 0) / cw) * 1000;
    return { key, phrase, n: (y ?? c)!.n, you: y?.count ?? 0, them: c?.count ?? 0, youPer1000, themPer1000, weight, score: 0 };
  };

  const missing: CompareTerm[] = [];
  const underused: CompareTerm[] = [];
  const shared: CompareTerm[] = [];
  for (const [key, c] of C) {
    if (c.count < minThem) continue;
    const y = Y.get(key);
    const t = make(key, y, c);
    if (t.weight < 0.15) continue;
    const nBoost = 1 + 0.4 * (t.n - 1);
    if (!y) {
      t.score = t.themPer1000 * t.weight * nBoost;
      missing.push(t);
    } else if (t.themPer1000 >= 2 * t.youPer1000 && c.count >= 3) {
      t.score = (t.themPer1000 - t.youPer1000) * t.weight * nBoost;
      underused.push(t);
    } else if (y.count >= minYou) {
      t.score = (t.themPer1000 + t.youPer1000) * t.weight * nBoost;
      shared.push(t);
    }
  }
  const yoursOnly: CompareTerm[] = [];
  for (const [key, y] of Y) {
    if (y.count < minYou || C.has(key)) continue;
    const t = make(key, y, undefined);
    if (t.weight < 0.15) continue;
    t.score = t.youPer1000 * t.weight * (1 + 0.4 * (t.n - 1));
    yoursOnly.push(t);
  }

  const finish = (arr: CompareTerm[], countOf: (t: CompareTerm) => number) =>
    dedupeSubsumed(arr.sort((a, b) => b.score - a.score).slice(0, 120), countOf).slice(0, COMPARE_CAP);

  return {
    missing: finish(missing, (t) => t.them),
    underused: finish(underused, (t) => t.them),
    yoursOnly: finish(yoursOnly, (t) => t.you),
    shared: finish(shared, (t) => t.them + t.you),
    youWords: you.wordCount,
    themWords: them.wordCount,
  };
}
