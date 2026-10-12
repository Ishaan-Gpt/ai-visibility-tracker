export type BotPurpose = "ai-search" | "ai-training" | "ai-user" | "search";

/** Where the user-agent string we probe with comes from. */
export type UaSource = "published" | "observed";

export interface BotInfo {
  /** Display name, also the robots.txt product token (matching is case-insensitive). */
  agent: string;
  /** Vendor / operator. */
  owner: string;
  purpose: BotPurpose;
  note: string;
  /** Lowercase robots.txt token. Optional so reports saved before the catalogue upgrade still type-check. */
  token?: string;
  /** Vendor documentation for this agent. Only set where we are confident of the URL. */
  docsUrl?: string;
  /** Full HTTP user-agent used for the live probe. null = no crawler of its own, or no reliable string. */
  ua?: string | null;
  /** "published" = copied from vendor docs, "observed" = vendor documents the token but not the full string; taken from widely logged traffic. */
  uaSource?: UaSource | null;
  /** A robots.txt control token with no crawler of its own (Google-Extended, Applebot-Extended). */
  controlOnly?: boolean;
  /** Fetches happen when a person asks for the page; the vendor says robots.txt may not apply. */
  mayIgnoreRobots?: boolean;
  /** Relative importance when scoring reachability (1 = typical). */
  weight?: number;
  /** One of the original 16 headline agents, used by compact surfaces such as the landing demos. */
  core?: boolean;
}

// Chrome version filled into vendor strings that publish a "Chrome/W.X.Y.Z" placeholder.
const CHROME = "131.0.0.0";

/**
 * Catalogue of AI and search agents, checked against vendor documentation (October 2026).
 * Purpose matters for strategy: blocking "ai-search" bots removes you from AI answers;
 * blocking "ai-training" bots only opts out of model training.
 */
const RAW: BotInfo[] = [
  // ── AI search indexes ────────────────────────────────────────────────────────────────────────
  {
    agent: "OAI-SearchBot", owner: "OpenAI", purpose: "ai-search", weight: 3, core: true,
    note: "Indexes pages for ChatGPT search. Blocked sites are not shown as cited answers.",
    docsUrl: "https://developers.openai.com/api/docs/bots",
    ua: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME} Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot`,
    uaSource: "published",
  },
  {
    agent: "Claude-SearchBot", owner: "Anthropic", purpose: "ai-search", weight: 2, core: true,
    note: "Indexes content to improve Claude's search results.",
    docsUrl: "https://support.claude.com/en/articles/8896518",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)",
    uaSource: "observed",
  },
  {
    agent: "PerplexityBot", owner: "Perplexity", purpose: "ai-search", weight: 2, core: true,
    note: "Indexes pages so Perplexity can show and link them. Not used for model training.",
    docsUrl: "https://docs.perplexity.ai/guides/bots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    uaSource: "published",
  },
  {
    agent: "Meta-WebIndexer", owner: "Meta", purpose: "ai-search",
    note: "Crawls to improve Meta AI search results, including citing and linking.",
    docsUrl: "https://developers.facebook.com/docs/sharing/webmasters/web-crawlers",
    ua: "meta-webindexer/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/web-crawlers)",
    uaSource: "published",
  },
  {
    agent: "Amzn-SearchBot", owner: "Amazon", purpose: "ai-search",
    note: "Search experiences in Amazon products such as Alexa. Not used for model training.",
    docsUrl: "https://developer.amazon.com/amazonbot",
    ua: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amzn-SearchBot/0.1) Chrome/${CHROME} Safari/537.36`,
    uaSource: "published",
  },
  {
    agent: "DuckAssistBot", owner: "DuckDuckGo", purpose: "ai-search",
    note: "Fetches pages in real time for DuckDuckGo's sourced AI answers. Not used for training.",
    docsUrl: "https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot",
    ua: "DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)",
    uaSource: "published",
  },
  {
    agent: "MistralAI-Index", owner: "Mistral", purpose: "ai-search",
    note: "Builds the index behind Mistral's search answers. Not used for training.",
    docsUrl: "https://docs.mistral.ai/robots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-Index/1.0; +https://docs.mistral.ai/robots)",
    uaSource: "published",
  },
  {
    agent: "YouBot", owner: "You.com", purpose: "ai-search",
    note: "Indexes pages for You.com's AI search.",
    ua: "Mozilla/5.0 (compatible; YouBot (+http://www.you.com))",
    uaSource: "observed",
  },
  {
    agent: "Google-CloudVertexBot", owner: "Google", purpose: "ai-search", weight: 0.5,
    note: "Crawls on a site owner's request to build Vertex AI Agents. Does not affect Google Search.",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers",
    ua: null,
    uaSource: null,
  },

  // ── AI assistants fetching on a person's request ────────────────────────────────────────────
  {
    agent: "ChatGPT-User", owner: "OpenAI", purpose: "ai-user", weight: 3, core: true, mayIgnoreRobots: true,
    note: "Fetches a page when a ChatGPT user or GPT action asks for it.",
    docsUrl: "https://developers.openai.com/api/docs/bots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    uaSource: "published",
  },
  {
    agent: "Claude-User", owner: "Anthropic", purpose: "ai-user", weight: 2, core: true,
    note: "Fetches a page when a Claude user asks about it.",
    docsUrl: "https://support.claude.com/en/articles/8896518",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
    uaSource: "observed",
  },
  {
    agent: "Perplexity-User", owner: "Perplexity", purpose: "ai-user", core: true, mayIgnoreRobots: true,
    note: "Fetches a page when a Perplexity user asks a question that needs it.",
    docsUrl: "https://docs.perplexity.ai/guides/bots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
    uaSource: "published",
  },
  {
    agent: "Meta-ExternalFetcher", owner: "Meta", purpose: "ai-user", mayIgnoreRobots: true,
    note: "Fetches individual links a user asks Meta AI about.",
    docsUrl: "https://developers.facebook.com/docs/sharing/webmasters/web-crawlers",
    ua: "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/web-crawlers)",
    uaSource: "published",
  },
  {
    agent: "Amzn-User", owner: "Amazon", purpose: "ai-user", mayIgnoreRobots: true,
    note: "Fetches live information to answer Alexa questions. Not used for training.",
    docsUrl: "https://developer.amazon.com/amazonbot",
    ua: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amzn-User/0.1) Chrome/${CHROME} Safari/537.36`,
    uaSource: "published",
  },
  {
    agent: "MistralAI-User", owner: "Mistral", purpose: "ai-user",
    note: "Fetches a page when a Mistral (Le Chat / Vibe) user's question needs it.",
    docsUrl: "https://docs.mistral.ai/robots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)",
    uaSource: "published",
  },
  {
    agent: "cohere-ai", owner: "Cohere", purpose: "ai-user", weight: 0.5,
    note: "Undocumented Cohere agent seen fetching pages for its chat products.",
    ua: null,
    uaSource: null,
  },

  // ── AI training ──────────────────────────────────────────────────────────────────────────────
  {
    agent: "GPTBot", owner: "OpenAI", purpose: "ai-training", core: true,
    note: "Collects content that may train OpenAI models.",
    docsUrl: "https://developers.openai.com/api/docs/bots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot",
    uaSource: "published",
  },
  {
    agent: "ClaudeBot", owner: "Anthropic", purpose: "ai-training", core: true,
    note: "Collects content that may train Anthropic models.",
    docsUrl: "https://support.claude.com/en/articles/8896518",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    uaSource: "observed",
  },
  {
    agent: "Google-Extended", owner: "Google", purpose: "ai-training", core: true, controlOnly: true,
    note: "Control token, no crawler of its own. Governs Gemini training and grounding; does not affect Search or AI Overviews.",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers",
    ua: null,
    uaSource: null,
  },
  {
    agent: "Applebot-Extended", owner: "Apple", purpose: "ai-training", core: true, controlOnly: true,
    note: "Control token, no crawler of its own. Governs use of Applebot data to train Apple models.",
    docsUrl: "https://support.apple.com/en-us/119829",
    ua: null,
    uaSource: null,
  },
  {
    agent: "Meta-ExternalAgent", owner: "Meta", purpose: "ai-training", core: true,
    note: "Crawls to train Meta's foundation models and improve products.",
    docsUrl: "https://developers.facebook.com/docs/sharing/webmasters/web-crawlers",
    ua: "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/web-crawlers)",
    uaSource: "published",
  },
  {
    agent: "CCBot", owner: "Common Crawl", purpose: "ai-training", core: true,
    note: "Open web archive that is widely used to train models.",
    docsUrl: "https://commoncrawl.org/ccbot",
    ua: "CCBot/2.0 (https://commoncrawl.org/faq/)",
    uaSource: "published",
  },
  {
    agent: "Bytespider", owner: "ByteDance", purpose: "ai-training", core: true,
    note: "ByteDance crawler associated with model training. Its robots.txt compliance has been questioned.",
    ua: "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
    uaSource: "observed",
  },
  {
    agent: "Amazonbot", owner: "Amazon", purpose: "ai-training", core: true,
    note: "General Amazon crawler; Amazon says its data may be used to train AI models.",
    docsUrl: "https://developer.amazon.com/amazonbot",
    ua: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1) Chrome/${CHROME} Safari/537.36`,
    uaSource: "published",
  },
  {
    agent: "MistralAI-Training", owner: "Mistral", purpose: "ai-training",
    note: "Collects content to build Mistral training datasets.",
    docsUrl: "https://docs.mistral.ai/robots",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-Training/1.0; +https://docs.mistral.ai/robots)",
    uaSource: "published",
  },
  {
    agent: "GoogleOther", owner: "Google", purpose: "ai-training",
    note: "Generic Google crawler for research and one-off crawls. Not used for Search.",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers",
    ua: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GoogleOther) Chrome/${CHROME} Safari/537.36`,
    uaSource: "published",
  },
  {
    agent: "FacebookBot", owner: "Meta", purpose: "ai-training",
    note: "Older Meta crawler, no longer listed in Meta's docs. Still worth covering in robots.txt.",
    ua: "Mozilla/5.0 (compatible; FacebookBot/1.0; +https://developers.facebook.com/docs/sharing/webmasters/facebookbot/)",
    uaSource: "observed",
  },
  {
    agent: "cohere-training-data-crawler", owner: "Cohere", purpose: "ai-training", weight: 0.5,
    note: "Cohere crawler collecting training data.",
    ua: null,
    uaSource: null,
  },
  {
    agent: "Diffbot", owner: "Diffbot", purpose: "ai-training",
    note: "Builds a commercial knowledge graph sold to AI companies.",
    ua: "Mozilla/5.0 (compatible; Diffbot/0.1; +http://www.diffbot.com)",
    uaSource: "observed",
  },
  {
    agent: "AI2Bot", owner: "Ai2", purpose: "ai-training",
    note: "Allen Institute for AI crawler for open research models.",
    ua: "Mozilla/5.0 (compatible) AI2Bot (+https://www.allenai.org/crawler)",
    uaSource: "observed",
  },

  // ── Classic search ───────────────────────────────────────────────────────────────────────────
  {
    agent: "Googlebot", owner: "Google", purpose: "search", weight: 3, core: true,
    note: "Google Search. Also the source for AI Overviews and AI Mode.",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/googlebot",
    ua: `Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME} Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`,
    uaSource: "published",
  },
  {
    agent: "Bingbot", owner: "Microsoft", purpose: "search", weight: 3, core: true,
    note: "Bing Search, which also grounds Copilot answers.",
    docsUrl: "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0",
    ua: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/${CHROME} Safari/537.36`,
    uaSource: "published",
  },
  {
    agent: "Applebot", owner: "Apple", purpose: "search",
    note: "Siri, Spotlight and Safari results. Follows Googlebot rules when it has none of its own.",
    docsUrl: "https://support.apple.com/en-us/119829",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)",
    uaSource: "published",
  },
  {
    agent: "DuckDuckBot", owner: "DuckDuckGo", purpose: "search",
    note: "DuckDuckGo's own search crawler.",
    docsUrl: "https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot",
    ua: "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)",
    uaSource: "published",
  },
];

export const BOT_CATALOGUE: BotInfo[] = RAW.map((b) => ({ ...b, token: b.agent.toLowerCase(), weight: b.weight ?? 1 }));

/** The 16 headline agents (original list), kept for compact surfaces such as the landing demos. */
export const AI_BOTS: BotInfo[] = BOT_CATALOGUE.filter((b) => b.core);

export const PURPOSES: BotPurpose[] = ["ai-search", "ai-user", "ai-training", "search"];

export const PURPOSE_LABEL: Record<BotPurpose, string> = {
  "ai-search": "AI search",
  "ai-user": "AI assistant fetch",
  "ai-training": "AI training",
  search: "Search engine",
};

export function findBot(agent: string): BotInfo | undefined {
  const t = agent.toLowerCase();
  return BOT_CATALOGUE.find((b) => b.token === t);
}
