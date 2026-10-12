import { tokenize, generateNgrams, splitSentences } from "@/lib/tools/keywordDensity/tokenizer";
import { isStopToken } from "@/lib/tools/keywordDensity/stopWords";
import { stem } from "@/lib/tools/keywordDensity/stem";
import { analyzeReadability, calculateReadability, type ReadabilityBlock, type ReadabilityReport } from "@/lib/tools/keywordDensity/readability";
import { docFromPaste, isHeading, type DocBlock, type DocInput } from "@/lib/tools/keywordDensity/document";
import { ngramsFor, type NgramRow } from "@/lib/tools/keywordDensity/ngrams";
import { detectOverOptimization, type OverOptFlag } from "@/lib/tools/keywordDensity/overOptimization";
import { distinctiveTerms, type DistinctiveResult } from "@/lib/tools/keywordDensity/distinctive";

/* ───────────────────────── Full document analysis ───────────────────────── */

export type AnalyzedBlock = DocBlock & { start: number; end: number; words: number };
export type AnalyzedSentence = { text: string; block: number; start: number; end: number; heading: boolean };
export type Section = { heading: string | null; start: number; end: number };

export type DocAnalysis = {
  doc: DocInput;
  /** Every word in reading order (headings included), lowercased. */
  tokens: string[];
  /** Grouping key (light lemma) per token. */
  keys: string[];
  /** Whether each token is a stop word. */
  stop: boolean[];
  blocks: AnalyzedBlock[];
  sentences: AnalyzedSentence[];
  /** Sections split at H2/H3 (or paragraphs when the text has no subheadings). */
  sections: Section[];
  sectionKind: "headings" | "paragraphs";
  wordCount: number;
  uniqueWordCount: number;
  vocabularyDiversity: number;
  readability: ReadabilityReport;
  overOptimization: OverOptFlag[];
  distinctive: DistinctiveResult;
  /** Lazily computed n-gram tables, keyed by `${n}:${includeStopWords}`. */
  ngramCache: Map<string, NgramRow[]>;
};

export { isStopToken };

/** Reference-list entries ("Smith J (2007). Title. Retrieved 5 May 2020. doi:…") aren't prose. */
const isCitation = (t: string) => /\b(?:retrieved|archived from|isbn|doi|pmid|pmc|issn|accessed on)\b|^\^/i.test(t);

export function analyzeDocument(doc: DocInput): DocAnalysis {
  const tokens: string[] = [];
  const blocks: AnalyzedBlock[] = [];
  const sentences: AnalyzedSentence[] = [];
  const readBlocks: ReadabilityBlock[] = [];

  doc.blocks.forEach((b, bi) => {
    const start = tokens.length;
    const heading = isHeading(b.type);
    const sents = heading ? [b.text] : splitSentences(b.text);
    for (const s of sents) {
      const toks = tokenize(s);
      if (!toks.length) continue;
      sentences.push({ text: s, block: bi, start: tokens.length, end: tokens.length + toks.length, heading });
      for (const t of toks) tokens.push(t);
    }
    blocks.push({ ...b, start, end: tokens.length, words: tokens.length - start });
    const words = tokens.length - start;
    // Fragments (menu-like list items, captions, "Share on Pinterest", bylines) would make the text look easier
    // than it is, so readability only counts blocks that read as sentences.
    const sentenceLike = (/[.!?:;…]["'”’)\]]*$/.test(b.text.trim()) || words >= 8) && !isCitation(b.text);
    const kind: ReadabilityBlock["kind"] = heading
      ? "heading"
      : !sentenceLike
        ? "other"
        : b.type === "li"
          ? "list"
          : b.type === "p" || b.type === "blockquote" || (b.type === "other" && words >= 8)
            ? "prose"
            : "other";
    readBlocks.push({ text: b.text, sentences: sents, kind });
  });

  const keys = tokens.map(stem);
  const stop = tokens.map(isStopToken);

  // Sections: split at H2/H3. Fall back to paragraphs if there are fewer than 3 subheadings.
  let sections: Section[] = [];
  let sectionKind: DocAnalysis["sectionKind"] = "headings";
  const subIdx = blocks.map((b, i) => (b.type === "h2" || b.type === "h3" ? i : -1)).filter((i) => i >= 0);
  if (subIdx.length >= 2) {
    let cur: Section = { heading: null, start: 0, end: 0 };
    blocks.forEach((b) => {
      if (b.type === "h2" || b.type === "h3") {
        cur.end = b.start;
        if (cur.end > cur.start) sections.push(cur);
        cur = { heading: b.text, start: b.start, end: b.end };
      }
      cur.end = b.end;
    });
    if (cur.end > cur.start) sections.push(cur);
  } else {
    sectionKind = "paragraphs";
    sections = blocks.filter((b) => !isHeading(b.type) && b.words > 0).map((b) => ({ heading: null, start: b.start, end: b.end }));
  }

  const unique = new Set(tokens).size;
  const base = {
    doc,
    tokens,
    keys,
    stop,
    blocks,
    sentences,
    sections,
    sectionKind,
    wordCount: tokens.length,
    uniqueWordCount: unique,
    vocabularyDiversity: tokens.length ? unique / tokens.length : 0,
    readability: analyzeReadability(readBlocks),
    ngramCache: new Map<string, NgramRow[]>(),
  };
  const partial = base as DocAnalysis;
  partial.distinctive = distinctiveTerms(partial);
  partial.overOptimization = detectOverOptimization(partial);
  return partial;
}

export { ngramsFor };

/* ───────────────────────── Legacy API (kept for existing callers) ───────────────────────── */

export type NgramEntry = { phrase: string; count: number; density: number };

export type StuffingFlag = { phrase: string; density: number; reason: string };

export type ContentAnalysis = {
  wordCount: number;
  sentenceCount: number;
  uniqueWordCount: number;
  vocabularyDiversity: number;
  readabilityScore: number;
  readabilityLabel: string;
  ngrams: { 1: NgramEntry[]; 2: NgramEntry[]; 3: NgramEntry[]; 4: NgramEntry[] };
  stuffingFlags: StuffingFlag[];
  /** The full analysis this summary was derived from. */
  full: DocAnalysis;
};

/**
 * One-call analysis of pasted text. Stuffing flags are statistical (unnatural repetition), never a
 * "target density" — density is not a ranking factor.
 */
export function analyzeContent(body: string): ContentAnalysis {
  const full = analyzeDocument(docFromPaste(body));
  const toEntries = (n: 1 | 2 | 3 | 4): NgramEntry[] => ngramsFor(full, n).slice(0, 20).map((r) => ({ phrase: r.phrase, count: r.count, density: r.density }));
  const r = full.readability;
  return {
    wordCount: full.wordCount,
    sentenceCount: Math.max(1, r.sentences),
    uniqueWordCount: full.uniqueWordCount,
    vocabularyDiversity: full.vocabularyDiversity,
    readabilityScore: r.fleschReadingEase,
    readabilityLabel: r.fleschLabel,
    ngrams: { 1: toEntries(1), 2: toEntries(2), 3: toEntries(3), 4: toEntries(4) },
    stuffingFlags: full.overOptimization
      .filter((f) => f.severity === "warning" && f.phrase)
      .map((f) => ({ phrase: f.phrase!, density: f.share * 100, reason: f.detail })),
    full,
  };
}

export type TargetKeywordResult = {
  keyword: string;
  count: number;
  density: number;
  inFirst100Words: boolean;
  inHeading: boolean;
};

/** Legacy diagnostic for one phrase in plain text: count, density and two placement checks. */
export function analyzeTargetKeyword(body: string, headings: string[], keyword: string): TargetKeywordResult {
  const tokens = tokenize(body);
  const kw = tokenize(keyword);
  const n = kw.length || 1;
  const target = kw.join(" ");
  const grams = generateNgrams(tokens, n);
  const count = grams.filter((g) => g === target).length;
  return {
    keyword: keyword.trim(),
    count,
    density: tokens.length ? (count / tokens.length) * 100 : 0,
    inFirst100Words: generateNgrams(tokens.slice(0, 100 + n - 1), n).includes(target),
    inHeading: headings.some((h) => generateNgrams(tokenize(h), n).includes(target)),
  };
}

export { calculateReadability };
