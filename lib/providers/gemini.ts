import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { CheckPromptInput, CheckPromptResult } from "./types";
import { textMentionsBrand, urlsMentionDomain } from "./match";

const MODEL = "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey });
}

export async function checkPromptGemini(input: CheckPromptInput): Promise<CheckPromptResult> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input.promptText,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? "";
  const citedUrls =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk) => chunk.web?.uri)
      .filter((uri): uri is string => Boolean(uri)) ?? [];

  const mentioned =
    textMentionsBrand(text, input.brandName, input.brandDomain) || urlsMentionDomain(citedUrls, input.brandDomain);

  const competitorMentions: Record<string, boolean> = {};
  for (const competitor of input.competitors) {
    competitorMentions[competitor.domain] =
      textMentionsBrand(text, competitor.name, competitor.domain) ||
      urlsMentionDomain(citedUrls, competitor.domain);
  }

  return {
    provider: "gemini",
    mentioned,
    citedUrls,
    competitorMentions,
    rawExcerpt: text.slice(0, 2000),
  };
}
