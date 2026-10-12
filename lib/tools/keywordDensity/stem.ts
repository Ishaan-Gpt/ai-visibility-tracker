/**
 * Light English lemmatiser used only to GROUP word variants ("study", "studies", "studied",
 * "studying" → one key). The key is never shown; the most frequent surface form is.
 * Deliberately conservative: it strips plurals, -ing, -ed, -ly and possessives, and
 * normalises a final -e / -y so "make"/"making" and "study"/"studied" meet. It does not
 * touch -er/-est/-ion, which would merge unrelated words ("user" / "use").
 */

const IRREGULAR: Record<string, string> = {
  children: "child", men: "man", women: "woman", feet: "foot", teeth: "tooth", mice: "mouse", geese: "goose",
  made: "make", using: "use", used: "use", uses: "use", went: "go", gone: "go", ran: "run", running: "run",
  data: "data", media: "media", news: "news",
  series: "series", species: "species", analysis: "analysis", analyses: "analysis", basis: "basis", crisis: "crisis",
  potatoes: "potato", tomatoes: "tomato", heroes: "hero", echoes: "echo", lives: "life", knives: "knife", leaves: "leaf",
  wives: "wife", wolves: "wolf", halves: "half", shelves: "shelf", loaves: "loaf", thieves: "thief",
  bought: "buy", brought: "bring", thought: "think", taught: "teach", caught: "catch", found: "find",
  ate: "eat", eaten: "eat", wrote: "write", written: "write", took: "take", taken: "take", gave: "give", given: "give",
  saw: "see", seen: "see", knew: "know", known: "know", grew: "grow", grown: "grow", chose: "choose", chosen: "choose",
  began: "begin", begun: "begin", spoke: "speak", spoken: "speak", sold: "sell", told: "tell", felt: "feel", kept: "keep",
  left: "left", built: "build", sent: "send", spent: "spend", lost: "lose", paid: "pay", said: "say", held: "hold",
};

const NO_STRIP = new Set([
  "this", "his", "was", "has", "is", "as", "us", "gas", "bus", "plus", "thus", "yes", "its", "always", "perhaps", "news", "lens", "series",
  "species", "physics", "mathematics", "economics", "politics", "ethics", "basis", "crisis", "analysis", "thesis", "chaos", "canvas",
  "bias", "atlas", "alias", "status", "campus", "virus", "bonus", "focus", "census", "corpus", "genus", "minus", "versus", "radius",
  "bring", "thing", "king", "ring", "sing", "spring", "string", "swing", "wing", "sting", "nothing", "something", "anything", "everything",
  "morning", "evening", "during", "ceiling", "pudding", "wedding", "sibling", "darling", "herring", "duckling",
  "need", "seed", "feed", "speed", "breed", "weed", "bleed", "greed", "deed", "red", "bed", "wed", "shed", "hundred", "sacred",
  "only", "early", "family", "daily", "reply", "supply", "apply", "rely", "fly", "july", "italy", "ugly", "holy", "belly", "jelly",
  "bully", "rally", "ally", "assembly", "friendly", "lovely", "lonely", "silly", "costly", "elderly", "curly", "oily", "chilly",
  "imply", "comply", "multiply", "anomaly", "monopoly", "lily", "holly", "jolly", "folly", "tally", "butterfly", "likely", "unlikely",
]);

const cache = new Map<string, string>();

const hasVowel = (s: string) => /[aeiouy]/.test(s);

function undouble(s: string): string {
  // "stopp" → "stop", but keep "add", "fall", "pass", "buzz".
  if (s.length > 3 && /([^aeiouylsz])\1$/.test(s)) return s.slice(0, -1);
  return s;
}

function compute(word: string): string {
  let w = word.toLowerCase().replace(/’/g, "'");
  w = w.replace(/'s$|s'$/, (m) => (m === "s'" ? "s" : ""));
  if (IRREGULAR[w]) return finalize(IRREGULAR[w]);
  if (w.length <= 3 || NO_STRIP.has(w) || /\d/.test(w)) return finalize(w);
  if (w.includes("-")) return w.split("-").map((p) => compute(p)).join("-");

  // Plurals / 3rd person.
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (/(?:x|ch|sh|zz)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !/(?:ss|us|is|ous)$/.test(w) && w.length > 3) w = w.slice(0, -1);

  // -ing / -ed.
  if (w.endsWith("ing") && w.length > 5) {
    const base = w.slice(0, -3);
    if (hasVowel(base)) w = undouble(base);
  } else if (w.endsWith("ed") && !w.endsWith("eed") && w.length > 4) {
    const base = w.endsWith("ied") ? w.slice(0, -3) + "y" : w.slice(0, -2);
    if (hasVowel(base) && base.length >= 3) w = undouble(base);
  }

  // -ly adverbs → adjective ("quickly" → "quick", "easily" → "easy").
  if (w.endsWith("ily") && w.length > 5) w = w.slice(0, -3) + "y";
  else if (w.endsWith("ly") && w.length > 5 && !NO_STRIP.has(w)) w = w.slice(0, -2);

  return finalize(w);
}

function finalize(w: string): string {
  // Normalise endings that inflection changes: "make"/"mak(ing)", "study"/"studi(ed)".
  if (w.length > 3 && w.endsWith("e") && !w.endsWith("ee")) w = w.slice(0, -1);
  if (w.length > 2 && w.endsWith("y")) w = w.slice(0, -1) + "i";
  return w;
}

/** Grouping key for one word. Cached; safe to call on every token. */
export function stem(word: string): string {
  let k = cache.get(word);
  if (k === undefined) {
    k = compute(word);
    if (cache.size > 50000) cache.clear();
    cache.set(word, k);
  }
  return k;
}

/** Grouping key for a phrase (space-separated words). */
export function stemPhrase(phrase: string): string {
  return phrase.split(" ").map(stem).join(" ");
}
