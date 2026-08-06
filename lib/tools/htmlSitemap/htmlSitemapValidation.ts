import { WEIGHT_POINTS, type FieldRule } from "@/lib/tools/validation/googleRichResultRules";
import { type HtmlSitemapEntry, UNGROUPED_SECTION_LABEL } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { groupEntries } from "@/lib/tools/htmlSitemap/htmlSitemapGenerator";

export type HtmlSitemapScore = {
  score: number;
  rules: FieldRule[];
  eligible: boolean;
  stats: { entryCount: number; sectionCount: number; duplicateCount: number; ungroupedCount: number };
};

/**
 * Scores a human-facing sitemap on the thing free generators never check:
 * whether it's actually organized well enough to be worth publishing, not
 * just whether the HTML is well-formed. Same FieldRule/weight model as the
 * schema and XML-sitemap tools, for one consistent feel across the suite.
 */
export function scoreHtmlSitemap(entries: HtmlSitemapEntry[]): HtmlSitemapScore {
  const valid = entries.filter((e) => e.url.trim() !== "");
  const urls = valid.map((e) => e.url.trim());
  const uniqueUrls = new Set(urls);
  const duplicateCount = urls.length - uniqueUrls.size;

  const grouped = groupEntries(valid);
  const namedGroups = grouped.filter((g) => g.section !== UNGROUPED_SECTION_LABEL);
  const ungrouped = grouped.find((g) => g.section === UNGROUPED_SECTION_LABEL);
  const ungroupedCount = ungrouped?.entries.length ?? 0;
  const ungroupedRatio = valid.length > 0 ? ungroupedCount / valid.length : 0;
  const missingLabelCount = valid.filter((e) => e.label.trim() === "").length;

  const rules: FieldRule[] = [
    { label: "At least one URL", weight: "required", passed: valid.length > 0 },
    {
      label: "No duplicate URLs",
      weight: "required",
      passed: duplicateCount === 0,
      hint: duplicateCount > 0 ? `${duplicateCount} duplicate URL(s) found.` : undefined,
    },
    {
      label: "URLs organized into sections",
      weight: "recommended",
      passed: valid.length === 0 || ungroupedRatio < 0.8,
      hint:
        ungroupedRatio >= 0.8
          ? "Most of your URLs are ungrouped — a flat list isn't much more useful than no sitemap at all. Group related pages for real navigational value."
          : undefined,
    },
    {
      label: "Descriptive labels",
      weight: "recommended",
      passed: valid.length === 0 || missingLabelCount / valid.length < 0.5,
      hint:
        missingLabelCount > 0
          ? `${missingLabelCount} URL(s) using an auto-derived label — custom labels read better to visitors.`
          : undefined,
    },
    {
      label: "More than one section",
      weight: "recommended",
      passed: namedGroups.length > 1 || valid.length <= 5,
      hint:
        namedGroups.length <= 1 && valid.length > 5
          ? "Consider splitting these into a few labeled sections (e.g. Blog, Products, Company) instead of one long list."
          : undefined,
    },
  ];

  const maxPoints = rules.reduce((sum, r) => sum + WEIGHT_POINTS[r.weight], 0);
  const earned = rules.reduce((sum, r) => sum + (r.passed ? WEIGHT_POINTS[r.weight] : 0), 0);
  const score = maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0;
  const eligible = rules.filter((r) => r.weight === "required").every((r) => r.passed);

  return {
    score,
    rules,
    eligible,
    stats: { entryCount: valid.length, sectionCount: grouped.length, duplicateCount, ungroupedCount },
  };
}
