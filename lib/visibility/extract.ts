import "server-only";
import { Type } from "@google/genai";
import { geminiClient } from "@/lib/providers/gemini";
import type { Sentiment } from "@/lib/types";

const MODEL = process.env.GEMINI_ANALYSIS_MODEL || "gemini-flash-lite-latest";
const MAX_ANSWER_CHARS = 8000;

export interface Extraction {
  brands: string[];
  sentiment: Sentiment | null;
  reason: string;
}

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    brands: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Every company, product, service or website brand named in the answer, in order of first appearance, spelled as in the answer. No generic terms, people or places.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["positive", "neutral", "negative", "not_mentioned"],
      description: "How the answer portrays the target brand.",
    },
    reason: { type: Type.STRING, description: "One short sentence (max 20 words) explaining the sentiment, grounded in the answer." },
  },
  required: ["brands", "sentiment", "reason"],
  propertyOrdering: ["brands", "sentiment", "reason"],
};

/**
 * One cheap structured-output call per answer: brand list (for position and competitor discovery) plus
 * sentiment toward the tracked brand. Fail-soft: returns null and the run is stored without it.
 */
export async function extractFromAnswer(answer: string, brand: { name: string; domain: string; aliases?: string[] }): Promise<Extraction | null> {
  const text = answer.trim().slice(0, MAX_ANSWER_CHARS);
  if (!text) return null;
  const aka = brand.aliases?.length ? ` (also written: ${brand.aliases.join(", ")})` : "";
  const instructions = [
    "You analyse an AI assistant's answer for a brand-monitoring tool. Only use what the answer says.",
    `Target brand: "${brand.name}"${aka}, website ${brand.domain}.`,
    "1. brands: list every brand/company/product named in the answer, in order of first appearance. Include the target brand if it appears.",
    "2. sentiment toward the target brand: positive = recommended, praised or listed as a top/best option; negative = criticised, warned against or described with clear drawbacks; neutral = named without judgement; not_mentioned = the target brand is absent.",
    "3. reason: one short sentence explaining the sentiment.",
    "",
    "ANSWER:",
    text,
  ].join("\n");
  try {
    const response = await geminiClient().models.generateContent({
      model: MODEL,
      contents: instructions,
      config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
    });
    const parsed = JSON.parse(response.text ?? "{}") as { brands?: unknown; sentiment?: unknown; reason?: unknown };
    const brands = Array.isArray(parsed.brands) ? parsed.brands.filter((b): b is string => typeof b === "string").slice(0, 40) : [];
    const s = parsed.sentiment;
    const sentiment: Sentiment | null = s === "positive" || s === "neutral" || s === "negative" ? s : null;
    const reason = typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 240) : "";
    return { brands, sentiment, reason };
  } catch (err) {
    console.warn(`[visibility] extraction failed: ${err instanceof Error ? err.message.slice(0, 160) : err}`);
    return null;
  }
}
