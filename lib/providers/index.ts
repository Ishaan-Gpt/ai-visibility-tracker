import "server-only";
import type { Provider } from "@/lib/types";
import type { EngineAnswer, EngineDef } from "./types";
import { askGemini, GEMINI_MODEL } from "./gemini";
import { askOpenAI, OPENAI_MODEL } from "./openai";
import { askPerplexity, PERPLEXITY_PRESET } from "./perplexity";
import { askAnthropic, ANTHROPIC_MODEL } from "./anthropic";
import { ENGINE_ENV, ENGINE_LABELS } from "./labels";

const has = (p: Provider) => () => Boolean(process.env[ENGINE_ENV[p]]);

const ENGINES: EngineDef[] = [
  { id: "gemini", label: ENGINE_LABELS.gemini, detail: `${GEMINI_MODEL} with Google Search grounding`, enabled: has("gemini"), ask: askGemini },
  { id: "openai", label: ENGINE_LABELS.openai, detail: `${OPENAI_MODEL} with web search (API, not the ChatGPT app)`, enabled: has("openai"), ask: askOpenAI },
  { id: "perplexity", label: ENGINE_LABELS.perplexity, detail: `Agent API, ${PERPLEXITY_PRESET} preset with web search`, enabled: has("perplexity"), ask: askPerplexity },
  { id: "anthropic", label: ENGINE_LABELS.anthropic, detail: `${ANTHROPIC_MODEL} with web search (API)`, enabled: has("anthropic"), ask: askAnthropic },
];

export interface EngineStatus {
  id: Provider;
  label: string;
  detail: string;
  active: boolean;
  envVar: string;
}

/** Engines whose API keys are configured, in display order. Gemini is the default. */
export function activeEngines(): EngineDef[] {
  return ENGINES.filter((e) => e.enabled());
}

/** Every engine with an `active` flag, for the dashboard's engine panel. */
export function engineStatus(): EngineStatus[] {
  return ENGINES.map((e) => ({ id: e.id, label: e.label, detail: e.detail, active: e.enabled(), envVar: ENGINE_ENV[e.id] }));
}

export function askEngine(provider: Provider, prompt: string): Promise<EngineAnswer> {
  const engine = ENGINES.find((e) => e.id === provider);
  if (!engine) throw new Error(`Unknown engine ${provider}`);
  return engine.ask(prompt);
}

export type { EngineAnswer, EngineDef };
