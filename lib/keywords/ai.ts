import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { Intent } from "./types";

/*
 * Optional AI pass (Gemini): one batched call that names topic clusters and classifies intent for the strongest
 * keywords. Strictly fail-soft: no key, a timeout, a bad response or anything unexpected returns null and the
 * caller keeps the rule-based labels. Output is always marked "AI-estimated" in the UI.
 */

/** Fast path: flash with thinking off (~3 s for this prompt). Fallback: flash-lite with default settings. */
const ATTEMPTS: { model: string; thinking?: { thinkingBudget: number } }[] = [
  { model: "gemini-flash-latest", thinking: { thinkingBudget: 0 } },
  { model: "gemini-flash-lite-latest" },
];

export interface AiInput {
  seed: string;
  language: string;
  clusters: { name: string; samples: string[] }[];
  keywords: string[];
}

export interface AiOutput {
  clusterNames: Map<string, string>;
  intents: Map<string, Intent>;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Compact output keeps generation fast: names aligned to cluster order, intents as one letter per keyword. */
const SCHEMA = {
  type: "object",
  properties: {
    names: { type: "array", items: { type: "string" } },
    intents: { type: "array", items: { type: "string", enum: ["I", "C", "T", "N"] } },
  },
  required: ["names", "intents"],
};

const LETTER: Record<string, Intent> = { I: "informational", C: "commercial", T: "transactional", N: "navigational" };

export async function aiLabel(input: AiInput, timeoutMs = 12_000): Promise<AiOutput | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || (input.clusters.length === 0 && input.keywords.length === 0)) return null;

  const prompt = [
    `You label keyword research results for the seed keyword "${input.seed}" (language: ${input.language}).`,
    "",
    "Task 1. For each topic cluster below, write a short human-friendly name (1-4 words, lowercase, in the keywords' language)",
    "for the sub-topic that sets the cluster apart from the seed. The seed is implied: do not repeat or truncate the seed's words.",
    `Example for seed "running shoes": a cluster of "running shoes for flat feet", "best running shoes flat feet" -> "flat feet support".`,
    "Keep brand and product names. Do not use the word 'cluster'.",
    `Return "names" as an array with exactly ${input.clusters.length} strings, in cluster order.`,
    "Task 2. For each keyword, classify the dominant search intent with one letter:",
    "I = informational (wants to learn), C = commercial (researching options before buying: best, reviews, comparisons),",
    "T = transactional (ready to buy or act now), N = navigational (looking for a specific site, brand page or login).",
    `Return "intents" as an array of exactly ${input.keywords.length} letters, one per keyword, in keyword order.`,
    "",
    "CLUSTERS:",
    ...input.clusters.map((c, i) => `${i}. [${c.name}] ${c.samples.join(" | ")}`),
    "",
    "KEYWORDS:",
    ...input.keywords.map((k, i) => `${i}. ${k}`),
  ].join("\n");

  const deadline = Date.now() + timeoutMs;
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: timeoutMs } });
    let text: string | undefined;
    for (const attempt of ATTEMPTS) {
      const left = deadline - Date.now();
      if (left < 2500) break;
      try {
        const res = await Promise.race([
          ai.models.generateContent({
            model: attempt.model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseJsonSchema: SCHEMA,
              temperature: 0.2,
              ...(attempt.thinking ? { thinkingConfig: attempt.thinking } : {}),
            },
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI timeout")), left)),
        ]);
        text = res.text;
        if (text) break;
      } catch (err) {
        console.warn(`[keywords/ai] ${attempt.model} failed:`, err instanceof Error ? err.message.slice(0, 200) : err);
      }
    }
    if (!text) return null;
    const data = JSON.parse(text) as { names?: unknown; intents?: unknown };

    const clusterNames = new Map<string, string>();
    const names = Array.isArray(data.names) ? data.names : [];
    if (names.length === input.clusters.length) {
      names.forEach((n, i) => {
        const name = typeof n === "string" ? n.trim().replace(/\s+/g, " ").slice(0, 48) : "";
        if (name.length >= 2) clusterNames.set(input.clusters[i].name, name);
      });
    }
    const intents = new Map<string, Intent>();
    const letters = Array.isArray(data.intents) ? data.intents.map((x) => String(x).trim().toUpperCase()) : [];
    if (letters.length !== input.keywords.length) console.warn(`[keywords/ai] intents misaligned: ${letters.length}/${input.keywords.length}`);
    // Misaligned output is worse than none: only accept an exact-length answer.
    if (letters.length === input.keywords.length) {
      input.keywords.forEach((kw, i) => {
        if (LETTER[letters[i]]) intents.set(kw, LETTER[letters[i]]);
      });
    }
    if (clusterNames.size === 0 && intents.size === 0) return null;
    return { clusterNames, intents };
  } catch (err) {
    console.warn("[keywords/ai] skipped:", err instanceof Error ? err.message : err);
    return null;
  }
}
