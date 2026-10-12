/*
 * Per-language word lists used to expand seeds (AnswerThePublic style) and to group keywords by wording.
 * Languages without a table still get alphabet/digit expansion and topic clustering, but no
 * question/preposition expansion (English prefixes would only add noise to, say, Japanese results).
 */

export interface Lexicon {
  /** Question words used as query prefixes ("how running shoes"). */
  questions: string[];
  /** Extra words that also mark a keyword as a question when it starts with them. */
  questionDetect: string[];
  prepositions: string[];
  /** Comparison words appended to the seed ("running shoes vs"). Multi-word entries are allowed. */
  comparisons: string[];
  /** Commercial / research modifiers used as prefix or suffix. */
  modifiers: { prefix: string[]; suffix: string[] };
  stopwords: string[];
}

const EN: Lexicon = {
  questions: ["how", "what", "why", "when", "where", "which", "who", "can", "will", "are", "is", "does", "should"],
  questionDetect: ["do", "did", "could", "would", "was", "were", "whose", "whom", "has", "have", "how much", "how many"],
  prepositions: ["for", "with", "without", "to", "near", "can", "is", "in", "under", "from"],
  comparisons: ["vs", "versus", "or", "and", "like", "alternative", "alternatives", "compared to", "better than"],
  modifiers: {
    prefix: ["best", "top", "cheap", "buy", "free", "new"],
    suffix: ["price", "cost", "review", "reviews", "near me", "online", "guide", "ideas", "tips", "for beginners", "brands", "examples"],
  },
  stopwords: [
    "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "by", "with", "without", "from", "into", "under",
    "is", "are", "was", "were", "be", "been", "do", "does", "did", "can", "could", "will", "would", "should", "has", "have",
    "how", "what", "why", "when", "where", "which", "who", "whom", "whose", "i", "my", "me", "you", "your", "it", "its",
    "this", "that", "these", "those", "vs", "versus", "like", "than", "as", "so", "if", "not", "no", "much", "many", "get",
  ],
};

const ES: Lexicon = {
  questions: ["cómo", "qué", "por qué", "cuándo", "dónde", "cuál", "quién", "cuánto", "se puede", "es"],
  questionDetect: ["como", "que", "cual", "cuales", "cuáles", "quien", "donde", "cuando", "cuanto", "cuánta", "puedo"],
  prepositions: ["para", "con", "sin", "a", "cerca de", "en", "de"],
  comparisons: ["vs", "o", "y", "como", "alternativa", "mejor que"],
  modifiers: { prefix: ["mejores", "comprar", "barato"], suffix: ["precio", "opiniones", "online", "cerca de mi"] },
  stopwords: ["el", "la", "los", "las", "un", "una", "de", "del", "y", "o", "para", "con", "sin", "en", "a", "al", "es", "que", "por", "se", "mi", "tu", "vs", "como", "cómo", "qué", "cuál", "dónde", "cuándo", "quién"],
};

const FR: Lexicon = {
  questions: ["comment", "quel", "quelle", "pourquoi", "quand", "où", "qui", "combien", "est-ce que", "peut-on"],
  questionDetect: ["quels", "quelles", "est ce que", "ou"],
  prepositions: ["pour", "avec", "sans", "à", "près de", "en", "de"],
  comparisons: ["vs", "ou", "et", "comme", "alternative", "meilleur que"],
  modifiers: { prefix: ["meilleur", "acheter", "pas cher"], suffix: ["prix", "avis", "en ligne", "pas cher"] },
  stopwords: ["le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "pour", "avec", "sans", "en", "à", "au", "aux", "est", "que", "qui", "par", "mon", "ma", "vs", "comme", "comment", "quel", "quelle", "pourquoi", "quand", "où"],
};

const DE: Lexicon = {
  questions: ["wie", "was", "warum", "wann", "wo", "welche", "wer", "kann", "ist", "sind"],
  questionDetect: ["welcher", "welches", "wieviel", "wie viel", "können", "darf", "soll", "gibt es"],
  prepositions: ["für", "mit", "ohne", "zu", "in der nähe", "in", "bei", "unter"],
  comparisons: ["vs", "oder", "und", "wie", "alternative", "besser als"],
  modifiers: { prefix: ["beste", "kaufen", "günstige"], suffix: ["test", "preis", "kaufen", "erfahrungen", "online", "in der nähe"] },
  stopwords: ["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "und", "oder", "für", "mit", "ohne", "zu", "in", "im", "bei", "unter", "ist", "sind", "wie", "was", "warum", "wann", "wo", "welche", "wer", "kann", "vs", "von", "auf", "mein", "ich", "zum", "zur", "am", "im", "auch", "nicht", "man", "es", "sich", "welcher", "welches", "gibt"],
};

const IT: Lexicon = {
  questions: ["come", "cosa", "perché", "quando", "dove", "quale", "chi", "quanto", "si può"],
  questionDetect: ["quali", "che cosa", "perche"],
  prepositions: ["per", "con", "senza", "a", "vicino", "in", "da"],
  comparisons: ["vs", "o", "e", "come", "alternativa", "meglio di"],
  modifiers: { prefix: ["migliori", "comprare"], suffix: ["prezzo", "recensioni", "online", "economiche"] },
  stopwords: ["il", "lo", "la", "i", "gli", "le", "un", "una", "di", "del", "della", "e", "o", "per", "con", "senza", "in", "a", "da", "che", "è", "vs", "come", "cosa", "perché", "quando", "dove", "quale", "chi"],
};

const PT: Lexicon = {
  questions: ["como", "o que", "por que", "quando", "onde", "qual", "quem", "quanto", "pode"],
  questionDetect: ["quais", "porque", "porquê"],
  prepositions: ["para", "com", "sem", "a", "perto de", "em", "de"],
  comparisons: ["vs", "ou", "e", "como", "alternativa", "melhor que"],
  modifiers: { prefix: ["melhores", "comprar", "barato"], suffix: ["preço", "online", "perto de mim"] },
  stopwords: ["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "ou", "para", "com", "sem", "em", "no", "na", "que", "é", "vs", "como", "quando", "onde", "qual", "quem"],
};

const NL: Lexicon = {
  questions: ["hoe", "wat", "waarom", "wanneer", "waar", "welke", "wie", "kan", "is"],
  questionDetect: ["hoeveel", "mag", "zijn"],
  prepositions: ["voor", "met", "zonder", "naar", "in de buurt", "in", "bij"],
  comparisons: ["vs", "of", "en", "zoals", "alternatief", "beter dan"],
  modifiers: { prefix: ["beste", "kopen", "goedkope"], suffix: ["prijs", "review", "kopen", "online"] },
  stopwords: ["de", "het", "een", "en", "of", "voor", "met", "zonder", "naar", "in", "bij", "is", "zijn", "van", "op", "te", "vs", "hoe", "wat", "waarom", "wanneer", "waar", "welke", "wie", "kan", "mijn", "ik"],
};

const TABLES: Record<string, Lexicon> = { en: EN, es: ES, fr: FR, de: DE, it: IT, pt: PT, nl: NL };

const EMPTY: Lexicon = {
  questions: [],
  questionDetect: [],
  prepositions: [],
  comparisons: ["vs"],
  modifiers: { prefix: [], suffix: [] },
  stopwords: ["vs"],
};

export function lexiconFor(language: string): Lexicon {
  return TABLES[language.slice(0, 2).toLowerCase()] ?? EMPTY;
}

/** True when we have word lists for the language (questions/prepositions grouping works). */
export function hasLexicon(language: string): boolean {
  return Boolean(TABLES[language.slice(0, 2).toLowerCase()]);
}
