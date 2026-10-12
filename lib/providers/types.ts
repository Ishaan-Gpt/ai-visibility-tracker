import type { Provider } from "@/lib/types";

/** A raw answer from one AI engine, before brand analysis. */
export interface EngineAnswer {
  provider: Provider;
  /** Model id that produced the answer. */
  model: string;
  text: string;
  /** Sources the engine showed or cited, in its order. Redirect URLs are resolved where possible. */
  citations: { url: string; title?: string; domain?: string }[];
  /** False when this ran without live web search (e.g. a grounding quota fallback): training data only. */
  grounded: boolean;
}

export interface EngineDef {
  id: Provider;
  /** Short display name, e.g. "Perplexity". */
  label: string;
  /** What actually runs, shown next to results so nobody mistakes an API model for the consumer app. */
  detail: string;
  /** The engine only runs when its API key is configured. */
  enabled: () => boolean;
  ask: (prompt: string) => Promise<EngineAnswer>;
}
