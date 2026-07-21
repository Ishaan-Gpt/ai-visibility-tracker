import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { CheckPromptInput, CheckPromptResult } from "./types";
import { textMentionsBrand, urlsMentionDomain } from "./match";

const MODEL = "gemini-flash-lite-latest";
const REQUEST_TIMEOUT_MS = 20_000;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
}

function toResult(
  text: string,
  citedUrls: string[],
  grounded: boolean,
  input: CheckPromptInput
): CheckPromptResult {
  const mentioned =
    textMentionsBrand(text, input.brandName, input.brandDomain) || urlsMentionDomain(citedUrls, input.brandDomain);

  const competitorMentions: Record<string, boolean> = {};
  for (const competitor of input.competitors) {
    competitorMentions[competitor.domain] =
      textMentionsBrand(text, competitor.name, competitor.domain) ||
      urlsMentionDomain(citedUrls, competitor.domain);
  }

  return { provider: "gemini", mentioned, citedUrls, competitorMentions, rawExcerpt: text.slice(0, 2000), grounded };
}

async function checkPromptGrounded(ai: GoogleGenAI, input: CheckPromptInput): Promise<CheckPromptResult> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input.promptText,
    config: { tools: [{ googleSearch: {} }] },
  });
  const text = response.text ?? "";
  const citedUrls =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk) => chunk.web?.uri)
      .filter((uri): uri is string => Boolean(uri)) ?? [];
  return toResult(text, citedUrls, true, input);
}

/** Plain generation, no web search — used as a fallback while grounding is unavailable
 * (e.g. billing not yet linked). Reflects the model's training data only, not live
 * AI search results, so callers should treat `grounded: false` runs as approximate. */
async function checkPromptUngrounded(ai: GoogleGenAI, input: CheckPromptInput): Promise<CheckPromptResult> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input.promptText,
  });
  return toResult(response.text ?? "", [], false, input);
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const code = (err as { cause?: { code?: string } })?.cause?.code;
  return status === 503 || status === 429 || code === "UND_ERR_HEADERS_TIMEOUT" || code === "ETIMEDOUT";
}

async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransient(err)) throw err;
    await new Promise((r) => setTimeout(r, 1500));
    return fn();
  }
}

export async function checkPromptGemini(input: CheckPromptInput): Promise<CheckPromptResult> {
  const ai = getClient();
  try {
    return await withOneRetry(() => checkPromptGrounded(ai, input));
  } catch (err) {
    console.warn(
      `[gemini] grounded check failed, falling back to ungrounded: ${err instanceof Error ? err.message : err}`
    );
    return withOneRetry(() => checkPromptUngrounded(ai, input));
  }
}
