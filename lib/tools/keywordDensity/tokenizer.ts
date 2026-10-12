/**
 * Unicode-aware tokenisation and sentence / paragraph splitting.
 *
 * A word is a run of letters (any script, incl. accents and combining marks) or digits,
 * optionally joined by internal apostrophes or hyphens: "café", "naïve", "don't", "e-commerce", "covid-19".
 * Curly apostrophes are normalised to straight ones so "don’t" and "don't" count as one word.
 */

const WORD_RE = /[\p{L}\p{M}\p{N}]+(?:(?:['’‐‑-]|(?<=\d)[.,](?=\d))[\p{L}\p{M}\p{N}]+)*/gu;

export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[’‐‑]/g, (c) => (c === "’" ? "'" : "-"));
}

/** Lowercased word tokens. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(WORD_RE)) out.push(normalizeWord(m[0]));
  return out;
}

/** Word tokens with their character offsets in `text` (used to map sentences back to the editor). */
export function tokenizeWithOffsets(text: string): { word: string; start: number; end: number }[] {
  const out: { word: string; start: number; end: number }[] = [];
  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    out.push({ word: normalizeWord(m[0]), start, end: start + m[0].length });
  }
  return out;
}

/** Generates overlapping n-grams (e.g. n=2 → every consecutive word pair) from a token stream. */
export function generateNgrams(tokens: string[], n: number): string[] {
  if (n <= 0 || tokens.length < n) return [];
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) grams.push(tokens.slice(i, i + n).join(" "));
  return grams;
}

/** Words that end with a period but don't end a sentence. Lowercase, without the trailing period. */
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "mt", "ft", "vs", "etc", "e.g", "i.e", "eg", "ie", "inc", "ltd", "co", "corp", "llc",
  "fig", "figs", "approx", "dept", "vol", "vols", "pp", "eds", "gov", "sen", "lt", "sgt", "capt",
  "jan", "feb", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "tue", "thu", "fri",
  "u.s", "u.k", "u.s.a", "a.m", "p.m", "al", "cf", "ca", "avg", "tbsp", "tsp", "oz", "lb", "lbs", "hr", "hrs", "sq", "ave", "blvd",
]);

const TERMINATOR_RE = /([.!?…]+|[。！？])(["'”’)\]]*)(\s+|$)/g;

/**
 * Splits one block of text into sentences. Handles common abbreviations ("Dr.", "e.g."),
 * initials ("J. K. Rowling"), decimals ("3.5", no space after the dot) and closing quotes.
 */
export function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const out: string[] = [];
  let start = 0;
  TERMINATOR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TERMINATOR_RE.exec(t))) {
    const end = m.index + m[1].length + m[2].length;
    const after = m.index + m[0].length;
    if (/^[.…]+$/.test(m[1])) {
      // Word immediately before the period.
      const before = t.slice(start, m.index);
      const lastWord = (before.match(/([\p{L}.]+)$/u)?.[1] ?? "").toLowerCase();
      const next = t.slice(after, after + 2);
      if (m[1] === ".") {
        const isAbbr = ABBREVIATIONS.has(lastWord) || ((lastWord === "no" || lastWord === "nos") && /^\d/.test(next));
        const isInitial = /(^|[\s(])\p{Lu}$/u.test(before);
        if ((isAbbr || isInitial) && !(lastWord === "etc" && /^\p{Lu}/u.test(next))) continue;
      }
      // Lowercase continuation ("approx. three") is not a new sentence.
      if (next && /^\p{Ll}/u.test(next)) continue;
    }
    const s = t.slice(start, end).trim();
    if (s) out.push(s);
    start = after;
  }
  const rest = t.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

/** Rough sentence count across all blocks of text. */
export function countSentences(text: string): number {
  return splitParagraphs(text).reduce((n, p) => n + splitSentences(p).length, 0);
}

/**
 * Splits pasted text into paragraphs. Blank lines always separate paragraphs; single line breaks
 * separate them too unless the text looks hard-wrapped (line ends mid-sentence and the next line
 * continues in lowercase).
 */
export function splitParagraphs(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let cur = "";
    for (const line of lines) {
      if (!cur) {
        cur = line;
        continue;
      }
      const wrapped = !/[.!?:;"”’)\]…]$/.test(cur) && /^\p{Ll}/u.test(line);
      if (wrapped) cur += " " + line;
      else {
        out.push(cur);
        cur = line;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}
