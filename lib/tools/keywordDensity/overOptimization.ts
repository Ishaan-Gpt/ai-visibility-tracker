import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { ngramsFor, type NgramRow } from "@/lib/tools/keywordDensity/ngrams";
import { tokenize } from "@/lib/tools/keywordDensity/tokenizer";
import { stem } from "@/lib/tools/keywordDensity/stem";
import { isStopToken } from "@/lib/tools/keywordDensity/stopWords";

/**
 * Over-optimisation is flagged only where repetition is statistically unnatural. There is no "ideal
 * density": search engines don't rank on it. These thresholds sit well above what natural writing
 * produces (the most frequent content word in an ordinary article is typically 1-3% of words).
 */
export type OverOptFlag = {
  id: string;
  severity: "warning" | "info";
  title: string;
  detail: string;
  phrase?: string;
  /** Share of words (or of sentences, for sentence-based checks) behind the flag. */
  share: number;
};

export const THRESHOLDS = {
  /** Share of all words taken by one content word: worth a look / clearly unnatural. */
  wordShare: [0.05, 0.08] as const,
  /** Share of all words covered by one 2-4 word phrase (count × length ÷ words). */
  phraseShare: [0.06, 0.1] as const,
  /** Share of prose sentences containing the same word / phrase (needs ≥ minSentences). */
  wordSentences: [0.6, 0.8] as const,
  phraseSentences: [0.5, 0.7] as const,
  minSentences: 10,
  /** The same exact phrase in this many consecutive sentences (2 words / 3+ words). */
  run2: [6, 12] as const,
  run3: [4, 6] as const,
  minCount: 6,
  /** The same content word this many times in a title or H1. */
  titleRepeat: 3,
};

export type RepetitionStats = { n: number; count: number; words: number; inSentences: number; prose: number; run: number };

/**
 * Turns repetition statistics into a flag (or nothing). "info" = heavier than typical writing, worth a look;
 * "warning" = repetition no natural text produces. Several signals can fire; the strongest one is reported.
 */
export function repetitionFlag(label: string, st: RepetitionStats): Omit<OverOptFlag, "id" | "phrase"> | null {
  const T = THRESHOLDS;
  if (st.count < T.minCount || st.words < 100) return null;
  const share = (st.count * st.n) / st.words;
  const sentShare = st.prose ? st.inSentences / st.prose : 0;
  const [shareInfo, shareWarn] = st.n === 1 ? T.wordShare : T.phraseShare;
  const [sentInfo, sentWarn] = st.n === 1 ? T.wordSentences : T.phraseSentences;
  const [runInfo, runWarn] = st.n >= 3 ? T.run3 : T.run2;
  const signals: { sev: 0 | 1 | 2; weight: number; title: string; detail: string }[] = [];
  const tier = (v: number, lo: number, hi: number): 0 | 1 | 2 => (v >= hi ? 2 : v >= lo ? 1 : 0);

  const s1 = tier(share, shareInfo, shareWarn);
  if (s1)
    signals.push({
      sev: s1,
      weight: share / shareInfo,
      title: st.n === 1 ? `${label} is ${(share * 100).toFixed(1)}% of all words` : `${label} takes up ${(share * 100).toFixed(1)}% of the text`,
      detail: `${st.count} uses in ${st.words.toLocaleString()} words (${(share * 100).toFixed(1)}% of all words${st.n > 1 ? ", counting each word of the phrase" : ""}). Even a page's main topic word rarely tops 3% in natural writing.`,
    });
  if (st.prose >= T.minSentences) {
    const s2 = tier(sentShare, sentInfo, sentWarn);
    if (s2)
      signals.push({
        sev: s2,
        weight: sentShare / sentInfo,
        title: `${label} is in ${Math.round(sentShare * 100)}% of sentences`,
        detail: `${st.inSentences} of ${st.prose} sentences contain it.`,
      });
  }
  if (st.n > 1) {
    const s3 = tier(st.run, runInfo, runWarn);
    if (s3)
      signals.push({
        sev: s3,
        weight: st.run / runInfo,
        title: `${label} in ${st.run} sentences in a row`,
        detail: `The exact phrase appears in ${st.run} consecutive sentences.`,
      });
  }
  if (!signals.length) return null;
  signals.sort((x, y) => y.sev - x.sev || y.weight - x.weight);
  const top = signals[0];
  const advice =
    top.sev === 2
      ? " This much repetition reads as written for search engines. Use pronouns, synonyms and related terms."
      : " Heavier than typical writing; worth varying the wording. Not a problem on its own.";
  return {
    severity: top.sev === 2 ? "warning" : "info",
    title: top.title,
    detail: [top.detail, ...signals.slice(1).map((x) => x.detail)].join(" ") + advice,
    share: Math.max(share, sentShare),
  };
}

/** Which prose sentences contain the key sequence (exact grouping key match). */
export function sentenceHits(a: DocAnalysis, key: string): boolean[] {
  const parts = key.split(" ");
  const n = parts.length;
  return a.sentences.map((s) => {
    if (s.heading) return false;
    for (let i = s.start; i + n <= s.end; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) if (a.keys[i + j] !== parts[j]) {
        ok = false;
        break;
      }
      if (ok) return true;
    }
    return false;
  });
}

/** Longest run of consecutive prose sentences that all contain it. */
export function longestRun(a: DocAnalysis, hits: boolean[]): number {
  let best = 0;
  let cur = 0;
  a.sentences.forEach((s, i) => {
    if (s.heading) return; // headings neither break nor extend a run
    if (hits[i]) best = Math.max(best, ++cur);
    else cur = 0;
  });
  return best;
}

export function proseSentenceCount(a: DocAnalysis): number {
  return a.sentences.filter((s) => !s.heading).length;
}

export function detectOverOptimization(a: DocAnalysis): OverOptFlag[] {
  const flags: OverOptFlag[] = [];
  const words = a.wordCount;
  if (words < 100) return flags;
  const T = THRESHOLDS;
  const prose = proseSentenceCount(a);
  const seen = new Set<string>();
  // Once a phrase is flagged, its shorter parts ("tea" inside "green tea") are not flagged again.
  const markSeen = (key: string) => {
    const p = key.split(" ");
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j <= p.length; j++) seen.add(p.slice(i, j).join(" "));
  };

  const check = (r: NgramRow) => {
    if (seen.has(r.key)) return;
    const hits = sentenceHits(a, r.key);
    const f = repetitionFlag(`"${r.phrase}"`, {
      n: r.n,
      count: r.count,
      words,
      inSentences: hits.filter(Boolean).length,
      prose,
      run: r.n > 1 ? longestRun(a, hits) : 0,
    });
    if (!f) return;
    markSeen(r.key);
    flags.push({ id: `rep:${r.key}`, phrase: r.phrase, ...f });
  };

  for (const n of [4, 3, 2, 1] as const) {
    for (const r of ngramsFor(a, n).slice(0, 40)) {
      if (r.count < T.minCount) break;
      check(r);
    }
  }

  // Title / H1 stuffing: one content word 3+ times, or the same 2-word phrase twice.
  const field = (name: string, text: string | null) => {
    if (!text) return;
    const toks = tokenize(text);
    const counts = new Map<string, { n: number; form: string }>();
    toks.forEach((t) => {
      if (isStopToken(t)) return;
      const k = stem(t);
      const e = counts.get(k) ?? { n: 0, form: t };
      e.n++;
      counts.set(k, e);
    });
    const worst = [...counts.values()].sort((x, y) => y.n - x.n)[0];
    const bi = new Map<string, number>();
    for (let i = 0; i + 1 < toks.length; i++) {
      if (isStopToken(toks[i]) || isStopToken(toks[i + 1])) continue;
      const k = stem(toks[i]) + " " + stem(toks[i + 1]);
      bi.set(k, (bi.get(k) ?? 0) + 1);
    }
    const repeatedPhrase = [...bi.entries()].find(([, c]) => c >= 2);
    if ((worst && worst.n >= T.titleRepeat) || repeatedPhrase) {
      flags.push({
        id: `field:${name}`,
        severity: "warning",
        title: `The ${name} repeats itself`,
        detail: repeatedPhrase
          ? `A phrase appears twice in the ${name}: "${text}". One clear mention is enough.`
          : `"${worst!.form}" appears ${worst!.n} times in the ${name}: "${text}". One clear mention is enough.`,
        phrase: worst?.form,
        share: 0,
      });
    }
  };
  field("title", a.doc.title);
  a.doc.h1.slice(0, 1).forEach((h) => field("H1", h));

  return flags.sort((x, y) => (x.severity === y.severity ? y.share - x.share : x.severity === "warning" ? -1 : 1));
}
