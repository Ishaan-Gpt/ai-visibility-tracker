import "server-only";
import type { EngineAnswer } from "./types";
import { postJson } from "./http";

/** Cost-efficient default with web search support; override with OPENAI_VISIBILITY_MODEL. */
export const OPENAI_MODEL = process.env.OPENAI_VISIBILITY_MODEL || "gpt-6-luna";

interface OpenAIOutputItem {
  type?: string;
  status?: string;
  action?: { type?: string; sources?: { type?: string; url?: string; title?: string }[] };
  content?: { type?: string; text?: string; annotations?: { type?: string; url?: string; title?: string }[] }[];
}

/**
 * Responses API (POST /v1/responses) with the `web_search` tool. Answer text lives in `message` items as
 * `output_text` parts; inline citations are `url_citation` annotations. Because the request includes
 * `web_search_call.action.sources`, the search call also lists every URL consulted, used as a fallback.
 */
export function parseOpenAIResponse(json: unknown): Omit<EngineAnswer, "provider"> {
  const data = json as { model?: string; output?: OpenAIOutputItem[] };
  const output = Array.isArray(data.output) ? data.output : [];
  const texts: string[] = [];
  const cited: { url: string; title?: string }[] = [];
  const consulted: { url: string; title?: string }[] = [];
  let searched = false;
  for (const item of output) {
    if (item.type === "web_search_call") {
      searched = true;
      for (const s of item.action?.sources ?? []) if (s?.url) consulted.push({ url: s.url, title: s.title });
    }
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text" || typeof part.text !== "string") continue;
      texts.push(part.text);
      for (const a of part.annotations ?? []) if (a.type === "url_citation" && a.url) cited.push({ url: a.url, title: a.title });
    }
  }
  return {
    model: data.model ?? OPENAI_MODEL,
    text: texts.join("\n\n"),
    citations: cited.length ? cited : consulted,
    // Search was available on every request; "grounded" records whether the model actually searched.
    grounded: searched || cited.length > 0,
  };
}

export async function askOpenAI(prompt: string): Promise<EngineAnswer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  const json = await postJson(
    "OpenAI",
    "https://api.openai.com/v1/responses",
    { authorization: `Bearer ${key}` },
    { model: OPENAI_MODEL, input: prompt, tools: [{ type: "web_search" }], include: ["web_search_call.action.sources"] },
  );
  return { provider: "openai", ...parseOpenAIResponse(json) };
}
