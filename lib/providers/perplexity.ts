import "server-only";
import type { EngineAnswer } from "./types";
import { postJson } from "./http";

/**
 * Perplexity Agent API (POST /v1/agent). The legacy Sonar chat-completions endpoint reached end of support
 * on 2026-09-27; the docs map Sonar Pro to the `fast` preset (web_search, one step).
 * Override with PERPLEXITY_VISIBILITY_PRESET (fast | low | medium | high).
 */
export const PERPLEXITY_PRESET = process.env.PERPLEXITY_VISIBILITY_PRESET || "fast";

interface PplxOutputItem {
  type?: string;
  results?: { url?: string; title?: string }[];
  content?: { type?: string; text?: string; annotations?: { url?: string; title?: string }[] }[];
}

/** Strips inline source markers such as "[web:3]" or "[2]" so brand matching sees clean prose. */
export function stripCitationMarkers(text: string): string {
  return text.replace(/\s?\[(?:web:)?\d+(?:\s*,\s*(?:web:)?\d+)*\]/g, "");
}

export function parsePerplexityResponse(json: unknown): Omit<EngineAnswer, "provider"> {
  const data = json as { model?: string; status?: string; output?: PplxOutputItem[]; error?: { message?: string } };
  if (data.status && data.status !== "completed") {
    throw new Error(`Perplexity response ${data.status}${data.error?.message ? `: ${data.error.message.slice(0, 160)}` : ""}`);
  }
  const output = Array.isArray(data.output) ? data.output : [];
  const texts: string[] = [];
  const annotated: { url: string; title?: string }[] = [];
  const searched: { url: string; title?: string }[] = [];
  for (const item of output) {
    if (item.type === "search_results") for (const r of item.results ?? []) if (r?.url) searched.push({ url: r.url, title: r.title });
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text" || typeof part.text !== "string") continue;
      texts.push(part.text);
      for (const a of part.annotations ?? []) if (a?.url) annotated.push({ url: a.url, title: a.title });
    }
  }
  return {
    model: data.model ? `${PERPLEXITY_PRESET} preset (${data.model})` : `${PERPLEXITY_PRESET} preset`,
    text: stripCitationMarkers(texts.join("\n\n")).trim(),
    citations: annotated.length ? annotated : searched,
    grounded: searched.length > 0 || annotated.length > 0,
  };
}

export async function askPerplexity(prompt: string): Promise<EngineAnswer> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("PERPLEXITY_API_KEY is not set.");
  const json = await postJson("Perplexity", "https://api.perplexity.ai/v1/agent", { authorization: `Bearer ${key}` }, { preset: PERPLEXITY_PRESET, input: prompt });
  return { provider: "perplexity", ...parsePerplexityResponse(json) };
}
