import { SITEMAP_LIMITS, type SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { WEIGHT_POINTS, type FieldRule } from "@/lib/tools/validation/googleRichResultRules";
import { generateSitemap } from "@/lib/tools/sitemap/sitemapGenerator";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?$/;

export type SitemapScore = {
  score: number;
  rules: FieldRule[];
  eligible: boolean;
  stats: {
    urlCount: number;
    fileCount: number;
    sizeBytes: number;
    duplicateCount: number;
  };
};

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Weighted sitemap conformance score against the sitemaps.org protocol and
 * Google Search Central's stated per-file limits — the same "required vs.
 * recommended" scoring model as the schema tool's `scoreSchema`, so both
 * tools feel like one system.
 */
export function scoreSitemap(entries: SitemapUrlEntry[]): SitemapScore {
  const valid = entries.filter((e) => e.loc.trim() !== "");
  const locs = valid.map((e) => e.loc.trim());
  const uniqueLocs = new Set(locs);
  const duplicateCount = locs.length - uniqueLocs.size;

  const absoluteCount = valid.filter((e) => isAbsoluteHttpUrl(e.loc)).length;
  const protocols = new Set(valid.map((e) => (isAbsoluteHttpUrl(e.loc) ? new URL(e.loc).protocol : null)).filter(Boolean));
  const hosts = new Set(valid.map((e) => (isAbsoluteHttpUrl(e.loc) ? new URL(e.loc).host : null)).filter(Boolean));
  const datedEntries = valid.filter((e) => e.lastmod.trim() !== "");
  const validDates = datedEntries.filter((e) => ISO_DATE.test(e.lastmod.trim()));

  const generated = generateSitemap(valid);
  const sizeBytes = generated.files.reduce((sum, f) => sum + new TextEncoder().encode(f.xml).length, 0);

  const rules: FieldRule[] = [
    { label: "At least one URL", weight: "required", passed: valid.length > 0 },
    {
      label: "No duplicate URLs",
      weight: "required",
      passed: duplicateCount === 0,
      hint: duplicateCount > 0 ? `${duplicateCount} duplicate URL(s) found — each <loc> should appear once.` : undefined,
    },
    {
      label: "All URLs are absolute (http/https)",
      weight: "required",
      passed: valid.length > 0 && absoluteCount === valid.length,
      hint: "Relative paths aren't valid per the sitemap protocol — every <loc> needs a full https://... URL.",
    },
    {
      label: "Single consistent protocol",
      weight: "recommended",
      passed: protocols.size <= 1,
      hint: "Mixing http and https URLs usually means your site hasn't fully migrated — pick one.",
    },
    {
      label: "Single consistent host",
      weight: "recommended",
      passed: hosts.size <= 1,
      hint: "A sitemap should only list URLs from one host you're authorized to submit for.",
    },
    {
      label: "Valid lastmod dates",
      weight: "recommended",
      passed: datedEntries.length === 0 || validDates.length === datedEntries.length,
      hint: "lastmod must be W3C Datetime format (YYYY-MM-DD or full ISO 8601).",
    },
    {
      label: "Within 50,000 URLs per file",
      weight: "recommended",
      passed: !generated.index,
      hint: generated.index
        ? `Split automatically into ${generated.files.length} files — this is handled for you, not an error.`
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
    stats: { urlCount: valid.length, fileCount: generated.files.length, sizeBytes, duplicateCount },
  };
}
