import "server-only";

/** Real Google Autocomplete suggestions (unofficial public endpoint). No data is invented here. */

const QUESTION_PREFIXES = ["how", "what", "why", "when", "where", "which", "can", "does", "is", "are", "should"];
const MODIFIERS = ["best", "vs", "for", "near me", "price", "cost", "free", "online", "review", "alternative", "guide", "tools"];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

async function fetchSuggestions(query: string, country: string, language: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${encodeURIComponent(
    language,
  )}&gl=${encodeURIComponent(country)}&q=${encodeURIComponent(query)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; seowise/1.0)" } });
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1].filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export interface SuggestResult {
  suggestions: { keyword: string; from: "autocomplete" | "question" }[];
  requests: number;
}

/**
 * Expands a seed with: the seed itself, seed + a-z, a-z + seed, question prefixes, and commercial modifiers.
 * ~80 requests, 6 at a time.
 */
export async function expandSeed(seed: string, country: string, language: string): Promise<SuggestResult> {
  const queries: { q: string; from: "autocomplete" | "question" }[] = [
    { q: seed, from: "autocomplete" },
    ...ALPHABET.map((l) => ({ q: `${seed} ${l}`, from: "autocomplete" as const })),
    ...ALPHABET.map((l) => ({ q: `${l} ${seed}`, from: "autocomplete" as const })),
    ...MODIFIERS.flatMap((m) => [
      { q: `${seed} ${m}`, from: "autocomplete" as const },
      { q: `${m} ${seed}`, from: "autocomplete" as const },
    ]),
    ...QUESTION_PREFIXES.map((p) => ({ q: `${p} ${seed}`, from: "question" as const })),
  ];

  const results = await pool(queries, 6, async (item) => ({
    from: item.from,
    list: await fetchSuggestions(item.q, country, language),
  }));

  const seen = new Map<string, "autocomplete" | "question">();
  for (const r of results) {
    for (const s of r.list) {
      const k = s.trim().toLowerCase();
      if (!k || k.length > 120) continue;
      if (!seen.has(k) || (seen.get(k) === "autocomplete" && r.from === "question")) seen.set(k, r.from);
    }
  }
  return { suggestions: [...seen.entries()].map(([keyword, from]) => ({ keyword, from })), requests: queries.length };
}
