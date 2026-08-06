import { WEIGHT_POINTS, type FieldRule } from "@/lib/tools/validation/googleRichResultRules";
import type { ContentAnalysis } from "@/lib/tools/keywordDensity/analyzer";

export type ContentScore = {
  score: number;
  rules: FieldRule[];
  eligible: boolean;
};

/**
 * Same FieldRule/weight model as every other tool in the suite — but the
 * rules here deliberately do NOT include "hit a target density," since that
 * premise is the myth this tool exists to correct.
 */
export function scoreContent(analysis: ContentAnalysis, targetKeywordPresent?: boolean): ContentScore {
  const rules: FieldRule[] = [
    { label: "Enough content to analyze", weight: "required", passed: analysis.wordCount >= 20 },
    {
      label: "No keyword stuffing detected",
      weight: "required",
      passed: analysis.stuffingFlags.length === 0,
      hint: analysis.stuffingFlags.length > 0 ? analysis.stuffingFlags.map((f) => f.reason).join(" ") : undefined,
    },
    {
      label: "Healthy vocabulary diversity",
      weight: "recommended",
      passed: analysis.wordCount < 50 || analysis.vocabularyDiversity > 0.4,
      hint:
        analysis.wordCount >= 50 && analysis.vocabularyDiversity <= 0.4
          ? "Lots of repeated words relative to length — consider varying your phrasing."
          : undefined,
    },
    {
      label: "Readable sentence structure",
      weight: "recommended",
      passed: analysis.readabilityScore >= 30,
      hint:
        analysis.readabilityScore < 30
          ? `Flesch score is in the "${analysis.readabilityLabel}" range — long sentences and complex words are making this hard to read.`
          : undefined,
    },
  ];

  if (targetKeywordPresent !== undefined) {
    rules.push({
      label: "Target keyword present in the content",
      weight: "recommended",
      passed: targetKeywordPresent,
    });
  }

  const maxPoints = rules.reduce((sum, r) => sum + WEIGHT_POINTS[r.weight], 0);
  const earned = rules.reduce((sum, r) => sum + (r.passed ? WEIGHT_POINTS[r.weight] : 0), 0);
  const score = maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0;
  const eligible = rules.filter((r) => r.weight === "required").every((r) => r.passed);

  return { score, rules, eligible };
}
