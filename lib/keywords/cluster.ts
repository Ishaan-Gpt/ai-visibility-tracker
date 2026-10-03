const STOP = new Set([
  "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "with", "is", "are", "do", "does", "how", "what",
  "why", "when", "where", "which", "who", "can", "i", "my", "me", "you", "your", "best", "top", "vs", "near", "from",
]);

function stem(word: string): string {
  return word.replace(/(ing|ers|er|ies|es|s)$/i, (m) => (m === "ies" ? "y" : "")).toLowerCase();
}

function tokens(keyword: string): string[] {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

/**
 * Greedy topical clustering on the words that DISTINGUISH a keyword from the seed. Words shared by the seed
 * are ignored (they are in every keyword, so they carry no topic signal). A keyword joins the first cluster
 * whose head it overlaps with (Jaccard >= 0.5); keywords with nothing distinguishing fall under the seed itself.
 * Cluster heads do not grow, so clusters cannot drift into unrelated topics.
 */
export function clusterKeywords(keywords: string[], seed: string): Map<string, string> {
  const seedTokens = new Set(tokens(seed));
  const distinguishing = (kw: string) => new Set(tokens(kw).filter((w) => !seedTokens.has(w)));
  const clusters: { name: string; tokens: Set<string> }[] = [];
  const assignment = new Map<string, string>();
  const ordered = [...keywords].sort((a, b) => a.split(" ").length - b.split(" ").length || a.length - b.length);

  for (const kw of ordered) {
    const t = distinguishing(kw);
    if (t.size === 0) {
      assignment.set(kw, seed);
      continue;
    }
    let best: { idx: number; score: number } | null = null;
    clusters.forEach((c, idx) => {
      let inter = 0;
      for (const x of t) if (c.tokens.has(x)) inter++;
      const score = inter / (t.size + c.tokens.size - inter);
      if (score >= 0.5 && (!best || score > best.score)) best = { idx, score };
    });
    if (best) {
      assignment.set(kw, clusters[(best as { idx: number }).idx].name);
    } else {
      clusters.push({ name: kw, tokens: t });
      assignment.set(kw, kw);
    }
  }
  return assignment;
}
