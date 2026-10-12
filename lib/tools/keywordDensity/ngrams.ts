import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";

export type NgramVariant = { form: string; count: number };

/** One row of the keyword table. With grouping, `variants` lists every surface form folded into the row. */
export type NgramRow = {
  /** Most frequent surface form. */
  phrase: string;
  /** Grouping key (light lemma per word). */
  key: string;
  n: number;
  count: number;
  /** count ÷ total words × 100. */
  density: number;
  /** count ÷ total words × 1,000. */
  per1000: number;
  /** Number of sentences containing it. */
  sentences: number;
  variants: NgramVariant[];
};

type Acc = { count: number; forms: Map<string, number>; lastSentence: number; sentences: number };

/**
 * Counts n-grams inside sentences (never across a sentence or block boundary) and groups surface
 * variants by their lemma key. Without stop words: 1-grams skip stop words and bare numbers, and
 * 2-4 word phrases may not start or end with one ("cup of tea" yes, "of the tea" no).
 */
export function computeNgrams(a: DocAnalysis, n: number, includeStopWords: boolean): NgramRow[] {
  const { tokens, keys, stop, sentences, wordCount } = a;
  const acc = new Map<string, Acc>();
  sentences.forEach((s, si) => {
    for (let i = s.start; i + n <= s.end; i++) {
      if (!includeStopWords) {
        if (stop[i] || stop[i + n - 1]) continue;
      } else if (n > 1) {
        // Even with stop words on, an all-stop-word phrase ("of the") is noise.
        let all = true;
        for (let j = i; j < i + n; j++) if (!stop[j]) all = false;
        if (all) continue;
      }
      let key = keys[i];
      let form = tokens[i];
      for (let j = i + 1; j < i + n; j++) {
        key += " " + keys[j];
        form += " " + tokens[j];
      }
      let e = acc.get(key);
      if (!e) {
        e = { count: 0, forms: new Map(), lastSentence: -1, sentences: 0 };
        acc.set(key, e);
      }
      e.count++;
      e.forms.set(form, (e.forms.get(form) ?? 0) + 1);
      if (e.lastSentence !== si) {
        e.lastSentence = si;
        e.sentences++;
      }
    }
  });

  const minCount = n === 1 || wordCount < 300 ? 1 : 2;
  const rows: NgramRow[] = [];
  const total = wordCount || 1;
  for (const [key, e] of acc) {
    if (e.count < minCount) continue;
    const variants = [...e.forms.entries()].map(([form, count]) => ({ form, count })).sort((x, y) => y.count - x.count || x.form.localeCompare(y.form));
    rows.push({
      phrase: variants[0].form,
      key,
      n,
      count: e.count,
      density: (e.count / total) * 100,
      per1000: (e.count / total) * 1000,
      sentences: e.sentences,
      variants,
    });
  }
  rows.sort((x, y) => y.count - x.count || x.phrase.localeCompare(y.phrase));
  return rows;
}

/** N-gram table (1-4 words), memoised on the analysis object. */
export function ngramsFor(a: DocAnalysis, n: number, includeStopWords = false): NgramRow[] {
  const k = `${n}:${includeStopWords}`;
  let rows = a.ngramCache.get(k);
  if (!rows) {
    rows = computeNgrams(a, n, includeStopWords);
    a.ngramCache.set(k, rows);
  }
  return rows;
}

/** Splits grouped rows back into one row per surface form (for the "group variants" toggle off). */
export function ungroup(rows: NgramRow[], wordCount: number): NgramRow[] {
  const total = wordCount || 1;
  const out: NgramRow[] = [];
  for (const r of rows) {
    if (r.variants.length === 1) {
      out.push({ ...r, variants: [] });
      continue;
    }
    for (const v of r.variants) {
      out.push({ ...r, phrase: v.form, count: v.count, density: (v.count / total) * 100, per1000: (v.count / total) * 1000, sentences: Math.min(r.sentences, v.count), variants: [] });
    }
  }
  return out.sort((x, y) => y.count - x.count || x.phrase.localeCompare(y.phrase));
}

/** CSV for the visible table. */
export function ngramsToCsv(rows: NgramRow[], grouped: boolean): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const head = ["phrase", "words", "count", "density_percent", "per_1000_words", "sentences", ...(grouped ? ["variants"] : [])];
  const lines = rows.map((r) =>
    [
      esc(r.phrase),
      String(r.n),
      String(r.count),
      r.density.toFixed(2),
      r.per1000.toFixed(1),
      String(r.sentences),
      ...(grouped ? [esc(r.variants.map((v) => `${v.form} (${v.count})`).join("; "))] : []),
    ].join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
