import { tokenize, generateNgrams, countSentences } from "@/lib/tools/keywordDensity/tokenizer";
import { STOP_WORDS } from "@/lib/tools/keywordDensity/stopWords";
import { calculateReadability } from "@/lib/tools/keywordDensity/readability";

export type NgramEntry = { phrase: string; count: number; density: number };

export type StuffingFlag = { phrase: string; density: number; reason: string };

export type ContentAnalysis = {
  wordCount: number;
  sentenceCount: number;
  uniqueWordCount: number;
  vocabularyDiversity: number;
  readabilityScore: number;
  readabilityLabel: string;
  ngrams: { 1: NgramEntry[]; 2: NgramEntry[]; 3: NgramEntry[] };
  stuffingFlags: StuffingFlag[];
};

const STUFFING_DENSITY_THRESHOLD = 5;
const STUFFING_MIN_COUNT = 5;

function topNgrams(tokens: string[], n: number, filterStopWords: boolean): NgramEntry[] {
  const grams = generateNgrams(tokens, n);
  const counts = new Map<string, number>();
  for (const gram of grams) {
    if (filterStopWords && n === 1 && STOP_WORDS.has(gram)) continue;
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  const total = grams.length || 1;
  return Array.from(counts.entries())
    .map(([phrase, count]) => ({ phrase, count, density: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * Orchestrates tokenization, n-gram frequency, readability, and a stuffing
 * heuristic into one analysis. The stuffing check is explicitly a heuristic
 * (density statistically far above natural repetition, not a fixed "ideal
 * density" target) — the whole point of this tool is not repeating the
 * fake-precision myth every competitor sells.
 */
export function analyzeContent(body: string): ContentAnalysis {
  const tokens = tokenize(body);
  const wordCount = tokens.length;
  const sentenceCount = Math.max(1, countSentences(body));
  const uniqueWordCount = new Set(tokens).size;
  const vocabularyDiversity = wordCount > 0 ? uniqueWordCount / wordCount : 0;

  const { score: readabilityScore, label: readabilityLabel } = calculateReadability(tokens, sentenceCount);

  const ngrams = {
    1: topNgrams(tokens, 1, true),
    2: topNgrams(tokens, 2, false),
    3: topNgrams(tokens, 3, false),
  };

  const stuffingFlags: StuffingFlag[] = ngrams[1]
    .filter((g) => g.count >= STUFFING_MIN_COUNT && g.density > STUFFING_DENSITY_THRESHOLD)
    .map((g) => ({
      phrase: g.phrase,
      density: g.density,
      reason: `"${g.phrase}" appears ${g.count} times (${g.density.toFixed(1)}% of words) — well above typical natural-language repetition.`,
    }));

  return { wordCount, sentenceCount, uniqueWordCount, vocabularyDiversity, readabilityScore, readabilityLabel, ngrams, stuffingFlags };
}

export type TargetKeywordResult = {
  keyword: string;
  count: number;
  density: number;
  inFirst100Words: boolean;
  inHeading: boolean;
};

/** Diagnostic (not target-driven) tracking for a specific phrase: where it appears, not whether it hits a percentage. */
export function analyzeTargetKeyword(body: string, headings: string[], keyword: string): TargetKeywordResult {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const tokens = tokenize(body);
  const keywordTokens = tokenize(normalizedKeyword);
  const n = keywordTokens.length || 1;
  const grams = generateNgrams(tokens, n);
  const target = keywordTokens.join(" ");

  const count = grams.filter((g) => g === target).length;
  const density = grams.length > 0 ? (count / grams.length) * 100 : 0;

  const first100 = generateNgrams(tokens.slice(0, 100 + n - 1), n);
  const inFirst100Words = first100.includes(target);

  const inHeading = headings.some((h) => generateNgrams(tokenize(h), n).includes(target));

  return { keyword: keyword.trim(), count, density, inFirst100Words, inHeading };
}
