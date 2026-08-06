/**
 * Standard vowel-group syllable-counting heuristic (the same approach used
 * by most published Flesch-score implementations) — not perfect for every
 * irregular English word, but accurate enough for a content-quality signal.
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;

  let processed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  processed = processed.replace(/^y/, "");

  const matches = processed.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export type ReadabilityResult = {
  score: number;
  label: string;
};

function labelForFlesch(score: number): string {
  if (score >= 90) return "Very easy";
  if (score >= 70) return "Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

/** Flesch Reading Ease — a standard, published readability formula (206.835 − 1.015×ASL − 84.6×ASW), not a proprietary metric. */
export function calculateReadability(tokens: string[], sentenceCount: number): ReadabilityResult {
  const wordCount = tokens.length;
  if (wordCount === 0 || sentenceCount === 0) {
    return { score: 0, label: labelForFlesch(0) };
  }

  const totalSyllables = tokens.reduce((sum, token) => sum + countSyllables(token), 0);
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount);

  return { score: Math.round(score * 10) / 10, label: labelForFlesch(score) };
}
