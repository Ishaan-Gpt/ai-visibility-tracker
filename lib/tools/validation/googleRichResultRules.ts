/**
 * Rule-source citation. When Google's Search Central structured-data docs or
 * the schema.org vocabulary revise field requirements, update this string and
 * audit `schemaValidation.ts` against the new revision rather than guessing.
 *
 * Mapped to: schema.org vocabulary v27 (2025-10) + Google Search Central
 * "Structured data general guidelines" + per-type rich-result docs, as of
 * the date below.
 */
export const RULES_SOURCE_VERSION = {
  schemaOrgVersion: "27.0",
  googleDocsCheckedOn: "2026-08-01",
};

export type RuleWeight = "required" | "recommended";

export const WEIGHT_POINTS: Record<RuleWeight, number> = {
  required: 12,
  recommended: 5,
};

export type FieldRule = {
  label: string;
  weight: RuleWeight;
  passed: boolean;
  /** Short reason shown in the UI when the rule fails, e.g. why Google cares. */
  hint?: string;
};
