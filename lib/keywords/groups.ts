import { lexiconFor } from "./lexicon";
import { words } from "./text";
import type { GroupType } from "./types";

/**
 * AnswerThePublic-style grouping from wording alone:
 *  - question: starts with a question word ("how", "can", "is"...) or contains "how to"-type phrases, or ends in "?"
 *  - comparison: vs / versus / or / and / like / alternative(s) / compared to / better than (not part of the seed)
 *  - preposition: for / with / without / to / near / can / is ... (not part of the seed)
 */
export function makeGrouper(seed: string, language: string) {
  const lex = lexiconFor(language);
  const seedWords = new Set(words(seed));
  const qWords = [...lex.questions, ...lex.questionDetect].sort((a, b) => b.length - a.length);
  const comps = [...lex.comparisons].sort((a, b) => b.length - a.length);
  const preps = [...lex.prepositions].sort((a, b) => b.length - a.length);
  const isEn = language.startsWith("en");

  const containsPhrase = (padded: string, phrase: string) => padded.includes(` ${phrase} `);
  /** A phrase counts only when it is not already part of the seed (e.g. "and" in "black and decker"). */
  const novel = (phrase: string) => !phrase.split(" ").every((w) => seedWords.has(w));

  return (keyword: string): { group: GroupType; groupWord: string | null } => {
    const padded = ` ${words(keyword).join(" ")} `;
    for (const q of qWords) {
      if (padded.startsWith(` ${q} `) && novel(q)) return { group: "question", groupWord: q };
    }
    if (isEn) {
      const m = padded.match(/ (how to|how much|how many|how long|what is|what are|why is|why do|why does|which is|is it|can you|can i|should i|do i|does it) /);
      if (m && novel(m[1])) return { group: "question", groupWord: m[1].split(" ")[0] };
    }
    if (keyword.trim().endsWith("?")) return { group: "question", groupWord: "?" };
    if (/ (vs\.?|v) /.test(padded) && !seedWords.has("vs")) return { group: "comparison", groupWord: "vs" };
    for (const c of comps) {
      if (containsPhrase(padded, c) && novel(c)) return { group: "comparison", groupWord: c };
    }
    for (const p of preps) {
      if (containsPhrase(padded, p) && novel(p)) return { group: "preposition", groupWord: p };
    }
    return { group: "other", groupWord: null };
  };
}
