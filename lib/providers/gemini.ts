import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { EngineAnswer } from "./types";
import { mapLimit } from "@/lib/visibility/pool";

export const GEMINI_MODEL = process.env.GEMINI_VISIBILITY_MODEL || "gemini-flash-lite-latest";
const REQUEST_TIMEOUT_MS = 30_000;
const REDIRECT_HOST = "vertexaisearch.cloud.google.com";

/** After a grounding quota error, skip grounded attempts for a while instead of failing every prompt twice. */
let groundingCooldownUntil = 0;
const GROUNDING_COOLDOWN_MS = 10 * 60_000;

let client: GoogleGenAI | null = null;
export function geminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
  return client;
}

interface GroundingChunkLike {
  web?: { uri?: string; title?: string; domain?: string };
}
interface GeminiResponseLike {
  text?: string;
  candidates?: { groundingMetadata?: { groundingChunks?: GroundingChunkLike[] } }[];
}

/** Pulls sources out of a grounded response. Gemini API titles are the source's domain ("g2.com"). */
export function parseGeminiSources(response: GeminiResponseLike): { url: string; title?: string; domain?: string }[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const out: { url: string; title?: string; domain?: string }[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (!uri) continue;
    const title = chunk.web?.title?.trim();
    const looksLikeDomain = title && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(title);
    out.push({ url: uri, title: title || undefined, domain: chunk.web?.domain || (looksLikeDomain ? title : undefined) });
  }
  return out;
}

/** Grounding links are Google redirect URLs; resolve them so the sources table shows real pages. */
async function resolveRedirect(url: string): Promise<string | null> {
  try {
    if (new URL(url).hostname !== REDIRECT_HOST) return url;
    const res = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(4000) });
    const loc = res.headers.get("location");
    await res.body?.cancel().catch(() => {});
    return loc && /^https?:\/\//i.test(loc) ? loc : null;
  } catch {
    return null;
  }
}

async function resolveSources(sources: { url: string; title?: string; domain?: string }[]) {
  return mapLimit(sources.slice(0, 12), 6, async (s) => {
    const resolved = await resolveRedirect(s.url);
    // Unresolvable redirect: keep it only if the title tells us the domain, so counts stay honest.
    if (resolved) return { ...s, url: resolved, domain: undefined };
    return s.domain ? { ...s, url: `https://${s.domain}/` } : null;
  }).then((list) => list.filter((s): s is NonNullable<typeof s> => s !== null));
}

function status(err: unknown): number | undefined {
  return (err as { status?: number })?.status;
}
function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return status(err) === 429 && /quota|RESOURCE_EXHAUSTED/i.test(msg);
}
function isTransient(err: unknown): boolean {
  const code = (err as { cause?: { code?: string } })?.cause?.code;
  return status(err) === 503 || status(err) === 500 || (status(err) === 429 && !isQuotaError(err)) || code === "UND_ERR_HEADERS_TIMEOUT" || code === "ETIMEDOUT";
}

async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransient(err)) throw err;
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    return fn();
  }
}

export async function askGemini(prompt: string): Promise<EngineAnswer> {
  const ai = geminiClient();
  if (Date.now() >= groundingCooldownUntil) {
    try {
      const response = await withOneRetry(() =>
        ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { tools: [{ googleSearch: {} }] } }),
      );
      const citations = await resolveSources(parseGeminiSources(response));
      return { provider: "gemini", model: GEMINI_MODEL, text: response.text ?? "", citations, grounded: true };
    } catch (err) {
      if (isQuotaError(err)) groundingCooldownUntil = Date.now() + GROUNDING_COOLDOWN_MS;
      console.warn(`[gemini] grounded check failed, falling back to ungrounded: ${err instanceof Error ? err.message.slice(0, 160) : err}`);
    }
  }
  // Plain generation, no web search: reflects training data only, so the run is stored as grounded: false.
  const response = await withOneRetry(() => ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt }));
  return { provider: "gemini", model: GEMINI_MODEL, text: response.text ?? "", citations: [], grounded: false };
}
