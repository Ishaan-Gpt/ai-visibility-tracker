import "server-only";
import type { Provider } from "@/lib/types";
import type { CheckPromptInput, CheckPromptResult } from "./types";
import { checkPromptGemini } from "./gemini";

const PROVIDERS: Record<Provider, (input: CheckPromptInput) => Promise<CheckPromptResult>> = {
  gemini: checkPromptGemini,
};

/** Active providers to run for every tracked prompt. Stage 1: Gemini only. */
export const ACTIVE_PROVIDERS: Provider[] = ["gemini"];

export function checkPrompt(provider: Provider, input: CheckPromptInput): Promise<CheckPromptResult> {
  return PROVIDERS[provider](input);
}

export type { CheckPromptInput, CheckPromptResult };
