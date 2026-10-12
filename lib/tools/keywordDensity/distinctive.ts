import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { ngramsFor, type NgramRow } from "@/lib/tools/keywordDensity/ngrams";
import { englishRank, expectedRate } from "@/lib/tools/keywordDensity/englishFrequency";
import { isNoiseTerm } from "@/lib/tools/keywordDensity/stopWords";

export type DistinctiveTerm = {
  phrase: string;
  key: string;
  n: number;
  count: number;
  per1000: number;
  /** Observed rate ÷ expected rate in typical English (estimate; phrases use their rarest word). */
  ratio: number;
  /** count × ln(ratio): how much this term sets the text apart. */
  score: number;
  /** True when no word of it is in the built-in common-word list. */
  rare: boolean;
};

export type DistinctiveResult = { words: DistinctiveTerm[]; phrases: DistinctiveTerm[] };

/**
 * "Terms used notably more than in typical English" (TF-IDF style). For each word the observed rate in
 * this text is compared with its expected rate from a built-in English frequency list (Zipf estimate);
 * words not in the list count as rare. score = count × ln(observed / expected). Estimates, not truth.
 */
export function distinctiveTerms(a: DocAnalysis): DistinctiveResult {
  const total = a.wordCount;
  if (total < 20) return { words: [], phrases: [] };
  const minCount = total > 800 ? 3 : 2;

  const score1 = (r: NgramRow) => {
    const exp = expectedRate(r.phrase);
    const obs = r.count / total;
    const ratio = obs / exp;
    return { ratio, score: r.count * Math.log(ratio), rare: englishRank(r.phrase) === null };
  };

  const words: DistinctiveTerm[] = [];
  for (const r of ngramsFor(a, 1)) {
    if (r.count < minCount || r.phrase.length < 2 || isNoiseTerm(r.phrase)) continue;
    const s = score1(r);
    if (s.ratio < 4) continue;
    words.push({ phrase: r.phrase, key: r.key, n: 1, count: r.count, per1000: r.per1000, ...s });
  }
  words.sort((x, y) => y.score - x.score);

  const phrases: DistinctiveTerm[] = [];
  for (const n of [2, 3] as const) {
    for (const r of ngramsFor(a, n)) {
      if (r.count < minCount || isNoiseTerm(r.phrase)) continue;
      const parts = r.phrase.split(" ");
      // Expected rate of the phrase ≈ that of its rarest word (generous, so phrases aren't over-scored).
      const exp = Math.min(...parts.map(expectedRate));
      const obs = r.count / total;
      const ratio = obs / exp;
      if (ratio < 4) continue;
      phrases.push({
        phrase: r.phrase,
        key: r.key,
        n,
        count: r.count,
        per1000: r.per1000,
        ratio,
        score: r.count * Math.log(ratio) * (1 + 0.35 * (n - 1)),
        rare: parts.every((p) => englishRank(p) === null),
      });
    }
  }
  phrases.sort((x, y) => y.score - x.score);
  return { words: words.slice(0, 30), phrases: dedupeSubsumed(phrases.slice(0, 60)).slice(0, 20) };
}

/**
 * Drops a phrase when a longer phrase containing it accounts for most of its uses
 * ("tea extract" inside "green tea extract"), and vice versa keeps both when the shorter one stands alone often.
 */
export function dedupeSubsumed<T extends { key: string }>(items: T[], countOf: (t: T) => number = (t) => (t as unknown as { count: number }).count): T[] {
  const out: T[] = [];
  for (const it of items) {
    const longer = items.find((o) => o !== it && o.key.length > it.key.length && ` ${o.key} `.includes(` ${it.key} `) && countOf(o) >= countOf(it) * 0.7);
    if (!longer) out.push(it);
  }
  return out;
}
