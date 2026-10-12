/**
 * Common English function words. Excluded from the 1-word table by default, and a 2-4 word phrase
 * may not start or end with one ("of the green" is not a phrase; "cup of tea" is).
 */
export const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each",
  "few", "for", "from", "further",
  "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
  "let's",
  "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not",
  "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these",
  "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up",
  "very",
  "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
  "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't",
  "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
  // Extra function words / auxiliaries that never make a useful phrase edge.
  "also", "although", "among", "an", "another", "anyone", "anything", "around", "away", "can", "could've", "either", "else", "even", "ever",
  "every", "however", "just", "less", "may", "might", "must", "neither", "often", "per", "rather", "shall", "should've", "since",
  "still", "though", "thus", "toward", "towards", "upon", "us", "via", "whether", "will", "within", "without", "would've", "yet",
  "s", "t", "d", "ll", "m", "re", "ve", "isnt", "dont", "doesnt", "didnt", "cant", "wont", "im", "ive", "youre", "thats", "theres",
]);

const isNumeric = (w: string) => /^[\d.,'-]+$/.test(w);

/** Stop word or bare number: never a 1-word keyword, never the first/last word of a phrase. */
export const isStopToken = (w: string) => STOP_WORDS.has(w) || isNumeric(w);

/** Reference-list and page-chrome tokens (citations, edit links) that say nothing about the topic. */
const NOISE = new Set([
  "retrieved", "archived", "edit", "pmid", "pmc", "doi", "isbn", "issn", "s2cid", "jstor", "bibcode", "arxiv", "oclc", "lccn", "cite", "citation",
  "et", "al", "ibid", "vol", "pp", "eds", "url", "http", "https", "www", "com", "html", "accessed", "wayback",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
]);

/**
 * True for terms that shouldn't be suggested as topical gaps or distinctive terms: citation boilerplate,
 * phrases containing bare numbers, and phrases that just repeat one word ("heiss heiss").
 */
export function isNoiseTerm(phrase: string): boolean {
  const parts = phrase.split(" ");
  if (parts.some((p) => NOISE.has(p) || isNumeric(p))) return true;
  return parts.length > 1 && parts.every((p) => p === parts[0]);
}
