/* Text helpers shared by expansion, grouping and clustering: normalisation, tokenising and a Porter stemmer. */

const ZERO_WIDTH = /[​-‍⁠﻿­]/g;
const EDGE_PUNCT = /^[\s"'`“”‘’«».,;:!?¿¡\-–—_*|/\\()[\]{}]+|[\s"'`“”‘’«».,;:!?¿¡\-–—_*|/\\()[\]{}]+$/gu;

/**
 * Canonical form used for de-duplication: Unicode NFKC, lowercase, unified quotes and dashes, no zero-width
 * characters, single spaces, no punctuation at the edges. Returns "" for anything that is not a usable keyword.
 */
export function normalizeKeyword(raw: string, language = "en"): string {
  if (typeof raw !== "string") return "";
  let s = raw.normalize("NFKC").replace(ZERO_WIDTH, "");
  try {
    s = s.toLocaleLowerCase(language);
  } catch {
    s = s.toLowerCase();
  }
  s = s
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(EDGE_PUNCT, "")
    .trim();
  if (s.length < 2 || s.length > 100) return "";
  if (!/[\p{L}\p{N}]/u.test(s)) return "";
  return s;
}

/** Word tokens (letters, digits, apostrophes and inner hyphens kept). */
export function words(keyword: string): string[] {
  return keyword
    .split(/[^\p{L}\p{N}'+#.-]+/u)
    .map((w) => w.replace(/^['.-]+|['.-]+$/g, ""))
    .filter(Boolean);
}

/* ---------- Porter stemmer (M.F. Porter, 1980), compact implementation for English ---------- */

const isCons = (w: string, i: number): boolean => {
  const ch = w[i];
  if ("aeiou".includes(ch)) return false;
  if (ch === "y") return i === 0 ? true : !isCons(w, i - 1);
  return true;
};

/** m() = number of VC sequences in the stem. */
function measure(stem: string): number {
  let m = 0;
  let i = 0;
  const n = stem.length;
  while (i < n && isCons(stem, i)) i++;
  while (i < n) {
    while (i < n && !isCons(stem, i)) i++;
    if (i >= n) break;
    while (i < n && isCons(stem, i)) i++;
    m++;
  }
  return m;
}

const hasVowel = (stem: string) => [...stem].some((_, i) => !isCons(stem, i));
const endsDoubleCons = (w: string) => w.length > 1 && w[w.length - 1] === w[w.length - 2] && isCons(w, w.length - 1);
const cvc = (w: string) => {
  const n = w.length;
  if (n < 3) return false;
  if (!isCons(w, n - 3) || isCons(w, n - 2) || !isCons(w, n - 1)) return false;
  return !"wxy".includes(w[n - 1]);
};

function replaceSuffix(w: string, rules: [string, string][], minM: number): string {
  for (const [suf, rep] of rules) {
    if (w.endsWith(suf)) {
      const stem = w.slice(0, -suf.length);
      return measure(stem) > minM ? stem + rep : w;
    }
  }
  return w;
}

const STEP2: [string, string][] = [
  ["ational", "ate"], ["tional", "tion"], ["enci", "ence"], ["anci", "ance"], ["izer", "ize"], ["bli", "ble"],
  ["alli", "al"], ["entli", "ent"], ["eli", "e"], ["ousli", "ous"], ["ization", "ize"], ["ation", "ate"],
  ["ator", "ate"], ["alism", "al"], ["iveness", "ive"], ["fulness", "ful"], ["ousness", "ous"], ["aliti", "al"],
  ["iviti", "ive"], ["biliti", "ble"], ["logi", "log"],
];
const STEP3: [string, string][] = [
  ["icate", "ic"], ["ative", ""], ["alize", "al"], ["iciti", "ic"], ["ical", "ic"], ["ful", ""], ["ness", ""],
];
const STEP4 = [
  "al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement", "ment", "ent", "ion", "ou", "ism", "ate", "iti",
  "ous", "ive", "ize",
];

const IRREGULAR: Record<string, string> = {
  women: "woman", men: "man", children: "child", feet: "foot", teeth: "tooth", mice: "mouse", people: "person",
  kids: "kid", best: "best", news: "news",
};

const stemCache = new Map<string, string>();

export function porterStem(input: string): string {
  // Possessives: "men's" -> "men", "runners'" -> "runners".
  const word = input.toLowerCase().replace(/'s$|'$/, "");
  if (IRREGULAR[word]) return IRREGULAR[word];
  // Irregular plural + s ("mens", "womens") is a common way people type the possessive.
  if (word.endsWith("s") && IRREGULAR[word.slice(0, -1)]) return IRREGULAR[word.slice(0, -1)];
  if (word.length <= 2 || !/^[a-z]+$/.test(word)) return word;
  const cached = stemCache.get(word);
  if (cached) return cached;

  let w = word;
  if (w[0] === "y") w = "Y" + w.slice(1);

  // Step 1a
  if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("ies")) w = w.slice(0, -2);
  else if (w.endsWith("ss")) {
    /* keep */
  } else if (w.endsWith("s")) w = w.slice(0, -1);

  // Step 1b
  let extra = false;
  if (w.endsWith("eed")) {
    if (measure(w.slice(0, -3)) > 0) w = w.slice(0, -1);
  } else if (w.endsWith("ed") && hasVowel(w.slice(0, -2))) {
    w = w.slice(0, -2);
    extra = true;
  } else if (w.endsWith("ing") && hasVowel(w.slice(0, -3))) {
    w = w.slice(0, -3);
    extra = true;
  }
  if (extra) {
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
    else if (endsDoubleCons(w) && !"lsz".includes(w[w.length - 1])) w = w.slice(0, -1);
    else if (measure(w) === 1 && cvc(w)) w += "e";
  }

  // Step 1c
  if (w.endsWith("y") && hasVowel(w.slice(0, -1))) w = w.slice(0, -1) + "i";

  w = replaceSuffix(w, STEP2, 0);
  w = replaceSuffix(w, STEP3, 0);

  // Step 4
  for (const suf of STEP4) {
    if (w.endsWith(suf)) {
      const stem = w.slice(0, -suf.length);
      if (measure(stem) > 1 && (suf !== "ion" || /[st]$/.test(stem))) w = stem;
      break;
    }
  }

  // Step 5
  if (w.endsWith("e")) {
    const stem = w.slice(0, -1);
    const m = measure(stem);
    if (m > 1 || (m === 1 && !cvc(stem))) w = stem;
  }
  if (measure(w) > 1 && endsDoubleCons(w) && w.endsWith("l")) w = w.slice(0, -1);

  w = w.replace(/^Y/, "y");
  if (stemCache.size > 20_000) stemCache.clear();
  stemCache.set(word, w);
  return w;
}

/** Stemmer for the result language: Porter for English, a light plural strip elsewhere. */
export function stemFor(language: string): (w: string) => string {
  if (language.startsWith("en")) return porterStem;
  return (w) => (w.length > 4 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
}
