import "server-only";
import type { EngineAnswer } from "./types";
import { postJson } from "./http";

/** Override with ANTHROPIC_VISIBILITY_MODEL (e.g. claude-haiku-5-5 for lower cost). */
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_VISIBILITY_MODEL || "claude-sonnet-5-5";
const MAX_CONTINUATIONS = 2;

interface ClaudeBlock {
  type?: string;
  text?: string;
  citations?: { type?: string; url?: string; title?: string }[];
  content?: { type?: string; url?: string; title?: string }[] | { type?: string; error_code?: string };
}
interface ClaudeMessage {
  model?: string;
  stop_reason?: string;
  content?: ClaudeBlock[];
}

/**
 * Messages API with the `web_search_20250305` server tool. The answer is the text after the last search
 * result block (earlier text is narration such as "I'll search for..."); citations come from
 * `web_search_result_location` entries on text blocks, falling back to the search results themselves.
 */
export function parseAnthropicResponse(json: unknown): Omit<EngineAnswer, "provider"> {
  const data = json as ClaudeMessage;
  const blocks = Array.isArray(data.content) ? data.content : [];
  let lastResult = -1;
  blocks.forEach((b, i) => {
    if (b.type === "web_search_tool_result") lastResult = i;
  });
  const answerBlocks = blocks.slice(lastResult + 1).filter((b) => b.type === "text");
  const textBlocks = answerBlocks.length ? answerBlocks : blocks.filter((b) => b.type === "text");
  const cited: { url: string; title?: string }[] = [];
  const results: { url: string; title?: string }[] = [];
  for (const b of blocks) {
    if (b.type === "text") {
      for (const c of b.citations ?? []) if (c.type === "web_search_result_location" && c.url) cited.push({ url: c.url, title: c.title });
    }
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r.type === "web_search_result" && r.url) results.push({ url: r.url, title: r.title });
    }
  }
  return {
    model: data.model ?? ANTHROPIC_MODEL,
    text: textBlocks
      .map((b) => b.text ?? "")
      .join("")
      .trim(),
    citations: cited.length ? cited : results,
    grounded: lastResult !== -1,
  };
}

export async function askAnthropic(prompt: string): Promise<EngineAnswer> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");
  const headers = { "x-api-key": key, "anthropic-version": "2023-06-01" };
  const base = {
    model: ANTHROPIC_MODEL,
    max_tokens: 3000,
    output_config: { effort: "low" },
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
  };
  const collected: ClaudeBlock[] = [];
  let last: ClaudeMessage = {};
  // Long searches can pause the turn (stop_reason "pause_turn"); send the partial assistant turn back to finish it.
  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    const messages: { role: string; content: unknown }[] = [{ role: "user", content: prompt }];
    if (collected.length) messages.push({ role: "assistant", content: collected.slice() });
    last = (await postJson("Anthropic", "https://api.anthropic.com/v1/messages", headers, { ...base, messages }, 90_000)) as ClaudeMessage;
    collected.push(...(last.content ?? []));
    if (last.stop_reason !== "pause_turn") break;
  }
  return { provider: "anthropic", ...parseAnthropicResponse({ ...last, content: collected }) };
}
