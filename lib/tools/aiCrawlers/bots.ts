export type BotPurpose = "ai-search" | "ai-training" | "ai-user" | "search";

export interface BotInfo {
  agent: string;
  owner: string;
  purpose: BotPurpose;
  note: string;
}

/**
 * User-agent tokens published by the respective operators. Purpose matters for strategy:
 * blocking "ai-search" bots removes you from AI answers; blocking "ai-training" bots only opts out of model training.
 */
export const AI_BOTS: BotInfo[] = [
  { agent: "OAI-SearchBot", owner: "OpenAI", purpose: "ai-search", note: "Surfaces your site in ChatGPT search results." },
  { agent: "ChatGPT-User", owner: "OpenAI", purpose: "ai-user", note: "Fetches pages when a ChatGPT user asks about them." },
  { agent: "GPTBot", owner: "OpenAI", purpose: "ai-training", note: "Collects content that may train OpenAI models." },
  { agent: "Claude-SearchBot", owner: "Anthropic", purpose: "ai-search", note: "Indexes content for Claude's search results." },
  { agent: "Claude-User", owner: "Anthropic", purpose: "ai-user", note: "Fetches pages when a Claude user asks about them." },
  { agent: "ClaudeBot", owner: "Anthropic", purpose: "ai-training", note: "Collects content that may train Anthropic models." },
  { agent: "PerplexityBot", owner: "Perplexity", purpose: "ai-search", note: "Indexes content for Perplexity answers." },
  { agent: "Perplexity-User", owner: "Perplexity", purpose: "ai-user", note: "Fetches pages when a Perplexity user asks about them." },
  { agent: "Google-Extended", owner: "Google", purpose: "ai-training", note: "Controls use for Gemini training and grounding." },
  { agent: "Applebot-Extended", owner: "Apple", purpose: "ai-training", note: "Controls use for Apple foundation models." },
  { agent: "Meta-ExternalAgent", owner: "Meta", purpose: "ai-training", note: "Collects content for Meta AI models." },
  { agent: "CCBot", owner: "Common Crawl", purpose: "ai-training", note: "Open web crawl widely used for model training." },
  { agent: "Bytespider", owner: "ByteDance", purpose: "ai-training", note: "ByteDance crawler used for AI training." },
  { agent: "Amazonbot", owner: "Amazon", purpose: "ai-user", note: "Amazon crawler, used for Alexa answers." },
  { agent: "Googlebot", owner: "Google", purpose: "search", note: "Google Search, also feeds AI Overviews." },
  { agent: "Bingbot", owner: "Microsoft", purpose: "search", note: "Bing Search, which powers Copilot answers." },
];

export const PURPOSE_LABEL: Record<BotPurpose, string> = {
  "ai-search": "AI search",
  "ai-user": "AI assistant fetch",
  "ai-training": "AI training",
  search: "Search engine",
};
