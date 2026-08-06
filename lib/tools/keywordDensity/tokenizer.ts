/** Lowercases, strips punctuation (keeping internal apostrophes), and splits into word tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Generates overlapping n-grams (e.g. n=2 → every consecutive word pair) from a token stream. */
export function generateNgrams(tokens: string[], n: number): string[] {
  if (n <= 0 || tokens.length < n) return [];
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}

/** Rough sentence count via terminal punctuation — good enough for a readability estimate, not a linguistic parser. */
export function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(\s|$)/g);
  if (matches && matches.length > 0) return matches.length;
  return text.trim() ? 1 : 0;
}
