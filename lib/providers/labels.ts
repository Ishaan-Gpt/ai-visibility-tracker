import type { Provider } from "@/lib/types";

/** Client-safe engine names, in display order. */
export const ENGINE_LABELS: Record<Provider, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  perplexity: "Perplexity",
  anthropic: "Claude",
};

export const ENGINE_ORDER: Provider[] = ["gemini", "openai", "perplexity", "anthropic"];

/** Env var that switches each engine on. */
export const ENGINE_ENV: Record<Provider, string> = {
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};
