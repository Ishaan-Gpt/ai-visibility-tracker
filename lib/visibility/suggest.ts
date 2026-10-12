import "server-only";
import { Type } from "@google/genai";
import { geminiClient } from "@/lib/providers/gemini";

const MODEL = process.env.GEMINI_ANALYSIS_MODEL || "gemini-flash-lite-latest";

export type PromptIntent = "discovery" | "comparison" | "problem" | "alternatives" | "brand";

export interface PromptSuggestion {
  text: string;
  intent: PromptIntent;
}

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: "What the business sells, in at most 6 words." },
    prompts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          intent: { type: Type.STRING, enum: ["discovery", "comparison", "problem", "alternatives", "brand"] },
        },
        required: ["text", "intent"],
        propertyOrdering: ["text", "intent"],
      },
    },
  },
  required: ["category", "prompts"],
  propertyOrdering: ["category", "prompts"],
};

/**
 * Drafts realistic prompts a customer would type into an AI assistant. Mostly unbranded on purpose:
 * a prompt that already names you will mention you, so it says little about visibility.
 */
export async function suggestPrompts(input: {
  name: string;
  domain: string;
  category?: string;
  competitors: { name: string }[];
  existing: string[];
  count?: number;
}): Promise<{ category: string; prompts: PromptSuggestion[] }> {
  const count = Math.min(Math.max(input.count ?? 10, 3), 15);
  const lines = [
    "You help a business track whether AI assistants (ChatGPT, Gemini, Perplexity, Claude) recommend it.",
    `Business: ${input.name} (${input.domain}).`,
    input.category ? `What it does: ${input.category}.` : "Infer what it does from the name and domain; if unsure, assume the most likely category and say so in `category`.",
    input.competitors.length ? `Known competitors: ${input.competitors.map((c) => c.name).join(", ")}.` : "",
    input.existing.length ? `Already tracked (do not repeat or paraphrase): ${input.existing.map((p) => `"${p}"`).join("; ")}.` : "",
    "",
    `Write ${count} distinct prompts a real potential customer would type into an AI assistant while choosing a product or service like this one.`,
    "Rules: natural first-person or search-style phrasing, 4-14 words, no quotation marks, varied intents.",
    `Mix: about half "discovery" (best X for Y, recommendations), some "problem" (how do I solve Z), some "alternatives" or "comparison"${input.competitors.length ? " (may name a competitor)" : ""}, and at most one "brand" prompt that names ${input.name}.`,
    "If the business is local, include the likely city or 'near me' in some prompts.",
  ].filter(Boolean);
  const response = await geminiClient().models.generateContent({
    model: MODEL,
    contents: lines.join("\n"),
    config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.7 },
  });
  const parsed = JSON.parse(response.text ?? "{}") as { category?: unknown; prompts?: unknown };
  const existing = new Set(input.existing.map((p) => p.trim().toLowerCase()));
  const seen = new Set<string>();
  const prompts: PromptSuggestion[] = [];
  for (const p of Array.isArray(parsed.prompts) ? parsed.prompts : []) {
    const text = typeof p?.text === "string" ? p.text.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, " ").slice(0, 200) : "";
    const key = text.toLowerCase();
    if (text.length < 8 || existing.has(key) || seen.has(key)) continue;
    seen.add(key);
    const intent: PromptIntent = ["discovery", "comparison", "problem", "alternatives", "brand"].includes(p?.intent) ? p.intent : "discovery";
    prompts.push({ text, intent });
  }
  return { category: typeof parsed.category === "string" ? parsed.category.slice(0, 80) : "", prompts: prompts.slice(0, count) };
}
