import { analyzeStructuredData } from "../schema";
import type { SchemaItem, StructuredDataReport } from "../types";
import { add, evidence, type Ctx } from "./context";

const label = (i: SchemaItem) => `${i.types.join(" + ")}${i.family ? ` (${i.family})` : ""}${i.nestedIn ? ` in ${i.nestedIn}` : ""}`;

export function structured(ctx: Ctx): StructuredDataReport {
  const sd = analyzeStructuredData(ctx.$);
  const items = sd.items;

  if (sd.invalidBlocks) add(ctx, { id: "jsonld-invalid", category: "Structured data", impact: 8, severity: "error", title: `${sd.invalidBlocks} JSON-LD block${sd.invalidBlocks > 1 ? "s" : ""} failed to parse`, detail: "Invalid JSON means search engines ignore the whole block.", fix: "Fix the syntax (trailing commas, unescaped quotes, HTML entities) and re-test in our Schema Validator.", items: sd.parseErrors.filter((e) => e.startsWith("Block")) });

  if (!items.length) {
    if (!sd.invalidBlocks) add(ctx, { id: "jsonld", category: "Structured data", impact: 6, severity: "warning", title: "No structured data", detail: "Schema markup unlocks rich results and tells search and AI systems exactly what the page is.", fix: "Add JSON-LD for the page's main entity (Organization, Article, Product, LocalBusiness, FAQPage…) with the Schema Generator." });
    return sd;
  }

  const sources = [...new Set(items.map((i) => i.source))].join(", ");
  add(ctx, { id: "jsonld", category: "Structured data", impact: 6, severity: "pass", title: `${items.length} structured data item${items.length > 1 ? "s" : ""}: ${items.map((i) => i.types[0]).join(", ")}`, detail: `Top-level items found via ${sources}. Nested entities (author, publisher, images…) are listed under their parent.`, items: items.map(label) });

  const broken = items.filter((i) => i.missingRequired.length);
  if (broken.length) add(ctx, { id: "schema-required", category: "Structured data", impact: 6, severity: "error", title: `${broken.length} item${broken.length > 1 ? "s" : ""} missing required properties`, detail: "Google won't show a rich result for an item that lacks required properties.", fix: "Add the missing properties listed for each item.", items: broken.map((i) => `${label(i)}: missing ${i.missingRequired.join(", ")}`) });
  else if (items.some((i) => i.richResult)) add(ctx, { id: "schema-required", category: "Structured data", impact: 6, severity: "pass", title: "Required properties present", detail: `Eligible for: ${sd.eligible.join(", ") || "no rich result types"}. Eligibility isn't a guarantee Google shows them.` });

  const thin = items.filter((i) => i.missingRecommended.length && !i.missingRequired.length);
  if (thin.length) add(ctx, { id: "schema-recommended", category: "Structured data", impact: 2, severity: "info", title: `${thin.length} item${thin.length > 1 ? "s" : ""} could add recommended properties`, detail: "Recommended properties make rich results richer and give AI systems more facts to quote.", fix: "Fill in the recommended properties listed.", items: thin.map((i) => `${label(i)}: ${i.missingRecommended.join(", ")}`) });

  const unknown = items.flatMap((i) => i.unknown.map((u) => `${u.type}${u.suggestion ? ` (did you mean ${u.suggestion}?)` : " is not a schema.org type"}`));
  const superseded = items.flatMap((i) => i.superseded);
  if (unknown.length || superseded.length) add(ctx, { id: "schema-types", category: "Structured data", impact: 4, severity: unknown.length ? "error" : "warning", title: [unknown.length && `${unknown.length} unknown type${unknown.length > 1 ? "s" : ""}`, superseded.length && `${superseded.length} superseded type${superseded.length > 1 ? "s" : ""}`].filter(Boolean).join(", "), detail: "Search engines skip types they don't recognise, so the item is ignored.", fix: "Use the exact schema.org type names (case-sensitive).", items: evidence([...unknown, ...superseded.map((s) => `${s} is superseded in schema.org`)]) });

  if (sd.contextIssues) add(ctx, { id: "schema-context", category: "Structured data", impact: 2, severity: "warning", title: "JSON-LD without a schema.org @context", detail: "Without @context the types are meaningless to parsers.", fix: 'Add "@context": "https://schema.org" to each block.' });

  const notes = items.flatMap((i) => (i.notes ?? []).map((n) => `${i.types[0]}: ${n}`));
  if (notes.length) add(ctx, { id: "schema-notes", category: "Structured data", impact: 0, severity: "info", title: "Rich result notes", detail: "Changes in what Google shows for some of your types.", items: [...new Set(notes)] });
  return sd;
}
