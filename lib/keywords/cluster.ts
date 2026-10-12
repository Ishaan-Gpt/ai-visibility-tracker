import { lexiconFor } from "./lexicon";
import { stemFor, words } from "./text";
import type { ClusterInfo } from "./types";

/**
 * Topic clustering by shared head terms (the approach Semrush's Keyword Magic uses for its groups):
 *  1. Strip each keyword down to the content words that DISTINGUISH it from the seed (no seed words, stopwords,
 *     question words or prepositions), stemmed so "shoe/shoes", "woman/women" and "review/reviews" match.
 *  2. Count how many keywords share each term. Terms shared by enough keywords become cluster heads.
 *  3. Each keyword joins the cluster of its most widely shared term. A cluster is labelled with the most common
 *     phrase around its head ("flat feet", "wide toe box") when one dominates, otherwise the head word itself.
 *  4. Keywords with only rare terms are paired by Jaccard overlap; leftovers form a "long tail" group.
 *     Keywords with nothing beyond the seed form the core cluster named after the seed.
 */

export interface ClusterInput {
  keyword: string;
  signal: number;
}

export interface ClusterOutput {
  assignment: Map<string, string>;
  clusters: ClusterInfo[];
}

const LONG_TAIL = "Long tail";

export function clusterKeywords(rows: ClusterInput[], seed: string, language: string): ClusterOutput {
  const lex = lexiconFor(language);
  const stem = stemFor(language);
  const stop = new Set([
    ...lex.stopwords,
    ...lex.questions.flatMap((q) => q.split(" ")),
    ...lex.questionDetect.flatMap((q) => q.split(" ")),
    ...lex.prepositions.filter((p) => p !== "near").flatMap((p) => p.split(" ")),
    ...lex.comparisons.flatMap((p) => p.split(" ")),
  ]);
  const seedStems = new Set(words(seed).map(stem));

  // Per keyword: ordered content tokens with their stems.
  const toks = new Map<string, { w: string; s: string }[]>();
  const df = new Map<string, number>();
  const surface = new Map<string, Map<string, number>>();
  for (const { keyword } of rows) {
    const list = words(keyword)
      .map((w) => ({ w, s: stem(w) }))
      .filter((t) => !stop.has(t.w) && !seedStems.has(t.s) && !(t.w.length === 1 && !/\d/.test(t.w)));
    toks.set(keyword, list);
    for (const s of new Set(list.map((t) => t.s))) df.set(s, (df.get(s) ?? 0) + 1);
    for (const t of list) {
      const m = surface.get(t.s) ?? new Map<string, number>();
      m.set(t.w, (m.get(t.w) ?? 0) + 1);
      surface.set(t.s, m);
    }
  }

  const n = rows.length;
  const minDf = n < 60 ? 2 : 3;
  // A term in (nearly) every keyword is part of the head phrase, not a topic.
  const maxDf = Math.max(minDf + 1, Math.floor(n * 0.6));
  const isHead = (s: string) => {
    const d = df.get(s) ?? 0;
    return d >= minDf && d <= maxDf;
  };

  const members = new Map<string, string[]>(); // head stem -> keywords
  const core: string[] = [];
  const rare: string[] = [];
  for (const { keyword } of rows) {
    const list = toks.get(keyword)!;
    if (list.length === 0) {
      core.push(keyword);
      continue;
    }
    let best: string | null = null;
    for (const t of list) {
      if (!isHead(t.s)) continue;
      if (!best || (df.get(t.s) ?? 0) > (df.get(best) ?? 0)) best = t.s;
    }
    if (best) members.set(best, [...(members.get(best) ?? []), keyword]);
    else rare.push(keyword);
  }

  // Rare-only keywords: greedy Jaccard pairing on their stems, so close variants still group together.
  const rareGroups: { stems: Set<string>; kws: string[] }[] = [];
  for (const kw of rare) {
    const st = new Set(toks.get(kw)!.map((t) => t.s));
    let target: (typeof rareGroups)[number] | null = null;
    let bestScore = 0;
    for (const g of rareGroups) {
      let inter = 0;
      for (const x of st) if (g.stems.has(x)) inter++;
      const score = inter / (st.size + g.stems.size - inter);
      if (score >= 0.5 && score > bestScore) {
        bestScore = score;
        target = g;
      }
    }
    if (target) target.kws.push(kw);
    else rareGroups.push({ stems: st, kws: [kw] });
  }
  const longTail: string[] = [];
  for (const g of rareGroups) {
    if (g.kws.length >= 2) {
      const head = [...g.stems].sort((a, b) => (df.get(b) ?? 0) - (df.get(a) ?? 0))[0];
      members.set(head, [...(members.get(head) ?? []), ...g.kws]);
    } else longTail.push(...g.kws);
  }

  const signalOf = new Map(rows.map((r) => [r.keyword, r.signal]));
  const bySignal = (a: string, b: string) => (signalOf.get(b) ?? 0) - (signalOf.get(a) ?? 0) || a.length - b.length;
  const commonSurface = (s: string) => [...(surface.get(s) ?? new Map([[s, 1]])).entries()].sort((a, b) => b[1] - a[1])[0][0];

  /** Most common contiguous content phrase around the head (e.g. "flat feet"), if it covers 60%+ of members. */
  const labelFor = (head: string, kws: string[]): string => {
    const counts = new Map<string, number>();
    for (const kw of kws) {
      const list = toks.get(kw)!;
      const ws = words(kw);
      const idx = list.findIndex((t) => t.s === head);
      if (idx < 0) continue;
      // Expand left/right over content words that are adjacent in the original keyword.
      const pos = (t: { w: string }) => ws.indexOf(t.w);
      let lo = idx;
      let hi = idx;
      while (lo > 0 && pos(list[lo - 1]) === pos(list[lo]) - 1 && hi - lo < 2) lo--;
      while (hi < list.length - 1 && pos(list[hi + 1]) === pos(list[hi]) + 1 && hi - lo < 2) hi++;
      if (hi > lo) {
        const phrase = list.slice(lo, hi + 1).map((t) => t.w).join(" ");
        counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
      }
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && kws.length >= 2 && top[1] >= Math.ceil(kws.length * 0.6)) return top[0];
    return commonSurface(head);
  };

  const subtermsFor = (head: string, kws: string[]) => {
    const c = new Map<string, number>();
    for (const kw of kws) for (const s of new Set(toks.get(kw)!.map((t) => t.s))) if (s !== head) c.set(s, (c.get(s) ?? 0) + 1);
    return [...c.entries()]
      .filter(([, v]) => v >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, count]) => ({ term: commonSurface(s), count }));
  };

  const clusters: ClusterInfo[] = [];
  const assignment = new Map<string, string>();
  const used = new Set<string>();
  const unique = (name: string) => {
    let out = name;
    for (let i = 2; used.has(out.toLowerCase()); i++) out = `${name} (${i})`;
    used.add(out.toLowerCase());
    return out;
  };

  const push = (name: string, head: string, kind: ClusterInfo["kind"], kws: string[]) => {
    if (kws.length === 0) return;
    const sorted = [...kws].sort(bySignal);
    const finalName = unique(name);
    for (const kw of kws) assignment.set(kw, finalName);
    clusters.push({
      name: finalName,
      nameBy: "rules",
      size: kws.length,
      term: head ? commonSurface(head) : "",
      kind,
      top: sorted.slice(0, 8),
      subterms: head ? subtermsFor(head, kws) : [],
    });
  };

  push(seed, "", "core", core);
  // Tiny groups are noise in big result sets; they join the long tail instead.
  const minSize = n >= 200 ? 3 : 2;
  for (const kws of members.values()) {
    if (kws.length < minSize) longTail.push(...kws);
  }
  for (const [head, kws] of [...members.entries()].filter(([, k]) => k.length >= minSize).sort((a, b) => b[1].length - a[1].length)) {
    push(labelFor(head, kws), head, "topic", kws);
  }
  push(LONG_TAIL, "", "longtail", longTail);

  return { assignment, clusters };
}
