import { tokenize } from "@/lib/tools/keywordDensity/tokenizer";

/**
 * Syllable estimate for an English word: counts vowel groups, then corrects for silent final -e,
 * -ed / -es endings that don't add a syllable, and common two-vowel splits ("me-di-a", "ac-tu-al").
 * Like every published Flesch implementation this is a heuristic: right for most words, off by one
 * on some. Treat all syllable-based numbers as estimates.
 */
const sylCache = new Map<string, number>();

export function countSyllables(word: string): number {
  let c = sylCache.get(word);
  if (c === undefined) {
    c = syllablesUncached(word);
    if (sylCache.size > 50000) sylCache.clear();
    sylCache.set(word, c);
  }
  return c;
}

function syllablesUncached(word: string): number {
  const w = word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const exc = EXCEPTIONS[w];
  if (exc) return exc;

  let s = w;
  if (/[^aeiouy]es$/.test(s) && !/(?:[sxzcg]|ch|sh)es$/.test(s) && !/[^aeiouy]les$/.test(s)) s = s.slice(0, -2);
  else if (/[^aeiouy]ed$/.test(s) && !/[td]ed$/.test(s)) s = s.slice(0, -2);
  else if (/[^aeiouy]e$/.test(s) && !/[^aeiouy]le$/.test(s)) s = s.slice(0, -1);
  s = s.replace(/^y/, "");

  let n = (s.match(/[aeiouy]+/g) ?? []).length;
  // Vowel pairs that are usually two syllables.
  n += (s.match(/(?:[^cgst]ia|[^q]ua|[^cgst]io|eo(?!p)|iu|uo|ii|[^aeiou]ie(?:r|t)|[^aeioucst]ien[tc]|ea(?:te|tion|tive)|ealit|eum$|[^aeiou]ism$)/g) ?? []).length;
  return Math.max(1, n);
}

const EXCEPTIONS: Record<string, number> = {
  people: 2, business: 2, every: 2, everything: 3, everyone: 3, different: 3, interesting: 3, family: 3, several: 3, evening: 2,
  something: 2, sometimes: 2, somewhere: 2, area: 3, idea: 3, ideas: 3, create: 2, created: 3, creates: 2, real: 1, really: 2,
  being: 2, doing: 2, going: 2, seeing: 2, science: 2, quiet: 2, poem: 2, lion: 2, diet: 2, client: 2, video: 3, radio: 3, ratio: 3,
  media: 3, recipe: 3, apple: 2, simple: 2, little: 2, table: 2, whole: 1, guide: 1, made: 1, make: 1, more: 1, there: 1, where: 1,
  here: 1, were: 1, fire: 1, hour: 1, our: 1, minutes: 2, tea: 1, unique: 2, technique: 2, antique: 2, colleague: 2,
  coffee: 2, theatre: 3, theater: 3, toward: 2, towards: 2, naive: 2, cafe: 2, maybe: 2, anyone: 3, someone: 2, everybody: 4, somebody: 3, therefore: 2,
  whereas: 2, however: 3, eaten: 2, beauty: 2, beautiful: 3, usually: 4, actually: 4, eventually: 5, especially: 4, naturally: 4,
};

export type ReadabilityResult = {
  score: number;
  label: string;
};

export function labelForFlesch(score: number): string {
  if (score >= 90) return "Very easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Plain English";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

/** Flesch Reading Ease — 206.835 − 1.015 × (words / sentences) − 84.6 × (syllables / words). */
export function calculateReadability(tokens: string[], sentenceCount: number): ReadabilityResult {
  const wordCount = tokens.length;
  if (wordCount === 0 || sentenceCount === 0) return { score: 0, label: labelForFlesch(0) };
  const totalSyllables = tokens.reduce((sum, token) => sum + countSyllables(token), 0);
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount);
  return { score: Math.round(score * 10) / 10, label: labelForFlesch(score) };
}

/* ───────────────────────── Full (Hemingway-style) readability report ───────────────────────── */

export type SentenceInfo = {
  text: string;
  words: number;
  /** Index of the paragraph / block it belongs to. */
  block: number;
  passive: boolean;
  adverbs: number;
};

export type ReadabilityReport = {
  words: number;
  sentences: number;
  paragraphs: number;
  syllables: number;
  fleschReadingEase: number;
  fleschLabel: string;
  fleschKincaidGrade: number;
  /** Gunning fog index (estimate). */
  fog: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  /** Sentence-length histogram (words per sentence). */
  histogram: { label: string; min: number; max: number; count: number }[];
  longSentences: SentenceInfo[];
  veryLongSentences: SentenceInfo[];
  longParagraphs: { text: string; words: number; block: number }[];
  passiveSentences: SentenceInfo[];
  adverbCount: number;
  adverbExamples: { word: string; count: number }[];
  complexWords: number;
  complexWordShare: number;
  readingMinutes: number;
};

export const LONG_SENTENCE = 25;
export const VERY_LONG_SENTENCE = 35;
export const LONG_PARAGRAPH = 150;

const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "1–10", min: 1, max: 10 },
  { label: "11–15", min: 11, max: 15 },
  { label: "16–20", min: 16, max: 20 },
  { label: "21–25", min: 21, max: 25 },
  { label: "26–35", min: 26, max: 35 },
  { label: "36+", min: 36, max: Infinity },
];

const BE_GET = new Set(["am", "is", "are", "was", "were", "be", "been", "being", "get", "gets", "got", "gotten", "getting", "isn't", "aren't", "wasn't", "weren't", "it's", "that's", "there's"]);
const IRREGULAR_PARTICIPLES = new Set(
  "known shown given taken made done seen written found built bought brought caught chosen drawn driven eaten fallen felt forgotten held hidden kept left lost meant paid put read run said sent set sold spent spoken stolen taught told thought understood won worn born begun broken cut hit hurt led let shut spread struck thrown torn beaten bitten blown bound bred dealt fed fought forbidden frozen grown heard hung laid lent lit proven sought shaken shot stuck swept withdrawn undertaken overtaken mistaken forgiven sung sunk sworn woken ridden risen hung".split(" "),
);
const NOT_PARTICIPLE = new Set(["need", "speed", "seed", "feed", "bed", "red", "shed", "hundred", "indeed", "interested", "tired", "excited", "worried", "pleased", "married", "used", "supposed", "concerned", "advanced", "detailed", "limited", "sophisticated", "talented", "experienced", "qualified", "dedicated", "complicated", "motivated", "related", "naked", "sacred", "wicked", "beloved", "ragged"]);
const SKIPPABLE = new Set(["not", "also", "often", "never", "always", "usually", "being", "then", "now", "still", "already", "just", "only", "even", "all", "both"]);
const NOT_ADVERB = new Set([
  "only", "early", "family", "daily", "reply", "supply", "apply", "rely", "fly", "july", "italy", "ugly", "holy", "belly", "jelly", "bully", "rally",
  "ally", "assembly", "friendly", "lovely", "lonely", "silly", "costly", "elderly", "curly", "oily", "chilly", "imply", "comply", "multiply",
  "anomaly", "monopoly", "lily", "holly", "jolly", "folly", "tally", "butterfly", "likely", "unlikely", "weekly", "monthly", "yearly", "hourly",
  "quarterly", "nightly", "kelly", "emily", "sally", "billy", "molly", "polly", "reilly", "lively", "deadly", "orderly", "scholarly", "homely",
  "comely", "manly", "womanly", "fly", "sly", "wily", "jelly", "smelly", "hilly", "woolly", "bubbly", "wobbly", "cuddly", "sparkly", "steely",
]);

function isParticiple(w: string): boolean {
  if (NOT_PARTICIPLE.has(w)) return false;
  if (IRREGULAR_PARTICIPLES.has(w)) return true;
  return w.length > 4 && w.endsWith("ed");
}

/** "be/get + (adverb) + past participle", e.g. "was written", "is often used", "got fired". */
export function isPassive(tokens: string[]): boolean {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (!BE_GET.has(tokens[i])) continue;
    let j = i + 1;
    while (j < tokens.length && j < i + 3 && (SKIPPABLE.has(tokens[j]) || (tokens[j].endsWith("ly") && !NOT_ADVERB.has(tokens[j])))) j++;
    const w = tokens[j];
    if (!w) continue;
    if (w === "used" && tokens[j + 1] === "to") continue;
    if (w === "supposed" && tokens[j + 1] === "to") continue;
    if (isParticiple(w)) return true;
  }
  return false;
}

export function isAdverb(w: string): boolean {
  return w.length > 4 && w.endsWith("ly") && !NOT_ADVERB.has(w);
}

export type ReadabilityBlock = { text: string; sentences: string[]; kind: "prose" | "list" | "heading" | "other" };

/**
 * Hemingway-style report over prose blocks (paragraphs, list items, quotes). Headings, table cells and code are
 * excluded so a page of short headings doesn't make the text look easier than it is.
 */
export function analyzeReadability(blocks: ReadabilityBlock[]): ReadabilityReport {
  const sentences: SentenceInfo[] = [];
  const longParagraphs: ReadabilityReport["longParagraphs"] = [];
  let words = 0;
  let syllables = 0;
  let complexWords = 0;
  let paragraphs = 0;
  const adverbCounts = new Map<string, number>();

  blocks.forEach((b, bi) => {
    if (b.kind !== "prose" && b.kind !== "list") return;
    let blockWords = 0;
    for (const s of b.sentences) {
      const toks = tokenize(s);
      if (!toks.length) continue;
      let adv = 0;
      for (const t of toks) {
        if (/^\d/.test(t)) continue;
        const syl = countSyllables(t);
        syllables += syl;
        // Gunning-fog style "complex": 3+ syllables, not counting -es/-ed/-ing endings or hyphenated compounds.
        if (syl >= 3 && !t.includes("-") && countSyllables(t.replace(/(?:es|ed|ing)$/, "")) >= 3) complexWords++;
        if (isAdverb(t)) {
          adv++;
          adverbCounts.set(t, (adverbCounts.get(t) ?? 0) + 1);
        }
      }
      words += toks.length;
      blockWords += toks.length;
      sentences.push({ text: s, words: toks.length, block: bi, passive: isPassive(toks), adverbs: adv });
    }
    if (blockWords > 0) paragraphs++;
    if (b.kind === "prose" && blockWords > LONG_PARAGRAPH) longParagraphs.push({ text: b.text, words: blockWords, block: bi });
  });

  const n = sentences.length;
  const asl = n ? words / n : 0;
  const asw = words ? syllables / words : 0;
  const fre = n && words ? 206.835 - 1.015 * asl - 84.6 * asw : 0;
  const fk = n && words ? 0.39 * asl + 11.8 * asw - 15.59 : 0;
  const fog = n && words ? 0.4 * (asl + 100 * (complexWords / words)) : 0;
  const adverbCount = [...adverbCounts.values()].reduce((a, b) => a + b, 0);

  return {
    words,
    sentences: n,
    paragraphs,
    syllables,
    fleschReadingEase: round1(fre),
    fleschLabel: labelForFlesch(fre),
    fleschKincaidGrade: round1(Math.max(0, fk)),
    fog: round1(fog),
    avgSentenceLength: round1(asl),
    avgSyllablesPerWord: Math.round(asw * 100) / 100,
    histogram: BUCKETS.map((bk) => ({ ...bk, count: sentences.filter((s) => s.words >= bk.min && s.words <= bk.max).length })),
    longSentences: sentences.filter((s) => s.words > LONG_SENTENCE && s.words <= VERY_LONG_SENTENCE),
    veryLongSentences: sentences.filter((s) => s.words > VERY_LONG_SENTENCE),
    longParagraphs,
    passiveSentences: sentences.filter((s) => s.passive),
    adverbCount,
    adverbExamples: [...adverbCounts.entries()].map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 12),
    complexWords,
    complexWordShare: words ? complexWords / words : 0,
    readingMinutes: words / 238,
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Plain-language reading level for a Flesch-Kincaid grade. */
export function gradeLabel(grade: number): string {
  if (grade < 6) return "elementary school";
  if (grade < 9) return `grade ${Math.round(grade)}`;
  if (grade < 13) return `grade ${Math.round(grade)}`;
  if (grade < 16) return "college level";
  return "post-graduate level";
}
