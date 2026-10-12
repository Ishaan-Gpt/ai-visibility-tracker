/*
 * Structured data extraction + validation for the Page Audit. Pure (no network).
 *
 * What counts as an "item": each top-level JSON-LD object (a block's root, each element of a root array, each @graph node),
 * each top-level microdata itemscope (one without itemprop) and each top-level RDFa typeof. Nested typed objects
 * (author → Person, publisher → Organization, image → ImageObject…) are reported only as children of their parent item,
 * never as page-level types.
 *
 * Required/recommended properties follow Google Search Central's rich result documentation for the types below.
 */
import type { CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { isKnownType, isSubtypeOf, isSupersededType, normalizeType, suggestType } from "@/lib/audit/vocab";
import type { SchemaChild, SchemaItem, StructuredDataReport } from "./types";

type Obj = Record<string, unknown>;

/** A property requirement: a dotted path, or alternatives separated by "|" (any one satisfies it). */
interface RichSpec {
  base: string;
  name: string;
  required: string[];
  recommended: string[];
  notes?: string[];
}

const RICH: RichSpec[] = [
  { base: "Product", name: "Product snippet", required: ["name", "offers|review|aggregateRating"], recommended: ["image", "description", "brand", "sku|gtin|gtin13|gtin12|gtin8|mpn", "offers.price|offers.lowPrice|offers.priceSpecification.price", "offers.priceCurrency|offers.priceSpecification.priceCurrency", "offers.availability"] },
  { base: "Recipe", name: "Recipe", required: ["name", "image"], recommended: ["recipeIngredient", "recipeInstructions", "author", "datePublished", "totalTime|cookTime", "recipeYield", "nutrition.calories", "aggregateRating", "description"] },
  { base: "Event", name: "Event", required: ["name", "startDate", "location"], recommended: ["endDate", "eventStatus", "eventAttendanceMode", "image", "description", "offers", "organizer", "performer"] },
  { base: "JobPosting", name: "Job posting", required: ["title", "description", "datePosted", "hiringOrganization", "jobLocation|applicantLocationRequirements"], recommended: ["validThrough", "employmentType", "baseSalary", "identifier", "directApply"] },
  { base: "VideoObject", name: "Video", required: ["name", "thumbnailUrl", "uploadDate"], recommended: ["description", "contentUrl|embedUrl", "duration"] },
  { base: "FAQPage", name: "FAQ", required: ["mainEntity", "mainEntity.name", "mainEntity.acceptedAnswer.text"], recommended: [], notes: ["Since 2023 Google shows FAQ rich results only for well-known government and health sites. The markup still helps AI systems read your Q&A."] },
  { base: "QAPage", name: "Q&A", required: ["mainEntity", "mainEntity.name", "mainEntity.answerCount|mainEntity.acceptedAnswer|mainEntity.suggestedAnswer"], recommended: ["mainEntity.text", "mainEntity.author", "mainEntity.datePublished"] },
  { base: "BreadcrumbList", name: "Breadcrumbs", required: ["itemListElement", "itemListElement.position", "itemListElement.name|itemListElement.item.name"], recommended: ["itemListElement.item"] },
  { base: "LocalBusiness", name: "Local business", required: ["name", "address"], recommended: ["telephone", "url", "openingHoursSpecification|openingHours", "geo", "priceRange", "image"] },
  { base: "SoftwareApplication", name: "Software app", required: ["name", "offers|aggregateRating|review"], recommended: ["applicationCategory", "operatingSystem", "aggregateRating"] },
  { base: "Course", name: "Course", required: ["name", "description", "provider|offers"], recommended: ["offers", "hasCourseInstance"] },
  { base: "Review", name: "Review snippet", required: ["author", "reviewRating", "reviewRating.ratingValue", "itemReviewed"], recommended: ["datePublished", "reviewBody"] },
  { base: "AggregateRating", name: "Review snippet", required: ["ratingValue", "ratingCount|reviewCount", "itemReviewed"], recommended: ["bestRating"] },
  { base: "Article", name: "Article", required: [], recommended: ["headline", "image", "datePublished", "dateModified", "author", "author.name"] },
  { base: "Organization", name: "Organization (logo, knowledge panel)", required: [], recommended: ["name", "url", "logo", "sameAs"] },
  { base: "Person", name: "Profile", required: ["name"], recommended: ["url", "sameAs", "image", "jobTitle"] },
  { base: "Dataset", name: "Dataset", required: ["name", "description"], recommended: ["url", "creator", "license", "distribution"] },
  { base: "HowTo", name: "How-to", required: ["name", "step"], recommended: ["totalTime", "image"], notes: ["Google retired How-to rich results in 2023. Keep the markup only if it helps other consumers."] },
];

/** Families shown next to a subtype, e.g. "BlogPosting (Article)". Order = most specific first. */
const FAMILIES = ["LocalBusiness", "Organization", "Article", "Product", "Event", "Recipe", "JobPosting", "VideoObject", "Review", "Person", "Place", "CreativeWork", "Intangible"];

const DEPRECATED_FEATURES: Record<string, string> = {
  SpecialAnnouncement: "Google no longer shows SpecialAnnouncement (COVID-era) rich results.",
  ClaimReview: "Google retired the Fact check rich result in 2025; the markup is still read by some fact-check tools.",
};

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function typesOf(o: Obj): string[] {
  return asArray(o["@type"] as string | string[]).filter((t): t is string => typeof t === "string" && !!t.trim()).map(normalizeType);
}

function nonEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(nonEmpty);
  if (typeof v === "object") return Object.keys(v as Obj).length > 0;
  return true;
}

function deref(node: unknown, byId: Map<string, Obj>): unknown {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const ref = (node as Obj)["@id"];
    if (typeof ref === "string" && Object.keys(node as Obj).length === 1 && byId.has(ref)) return byId.get(ref);
  }
  return node;
}

/** Resolves a dotted path through arrays (any element may satisfy it). `{"@id": …}` references resolve via `byId`. */
function hasPath(o: unknown, path: string, byId: Map<string, Obj>): boolean {
  const [head, ...rest] = path.split(".");
  for (const item of asArray(o as Obj | Obj[])) {
    const node = deref(item, byId);
    if (!node || typeof node !== "object") continue;
    const v = (node as Obj)[head];
    if (!rest.length) {
      if (nonEmpty(v)) return true;
      continue;
    }
    if (hasPath(v, rest.join("."), byId)) return true;
  }
  return false;
}

function satisfied(o: Obj, req: string, byId: Map<string, Obj>): boolean {
  return req.split("|").some((alt) => hasPath(o, alt, byId));
}

/** Nested typed objects under `o`, as "prop.path → types", depth-limited. */
function childrenOf(o: Obj, byId: Map<string, Obj>, prefix = "", depth = 0, out: SchemaChild[] = []): SchemaChild[] {
  if (depth > 3 || out.length > 40) return out;
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith("@")) continue;
    for (const raw of asArray(v as unknown)) {
      const child = deref(raw, byId);
      if (!child || typeof child !== "object" || Array.isArray(child)) continue;
      const path = prefix ? `${prefix}.${k}` : k;
      const t = typesOf(child as Obj);
      if (t.length) {
        const ref = child !== raw ? ` (via @id)` : "";
        if (!out.some((c) => c.path === path && c.types.join() === t.join())) out.push({ path: path + ref, types: t });
      }
      if (child === raw) childrenOf(child as Obj, byId, path, depth + 1, out);
    }
  }
  return out;
}

function nameOf(o: Obj): string | undefined {
  const n = o.name ?? o.headline ?? o.title;
  return typeof n === "string" ? n.slice(0, 120) : undefined;
}

function familyOf(type: string): string | undefined {
  if (!isKnownType(type)) return undefined;
  const spec = RICH.find((r) => isSubtypeOf(type, r.base));
  if (spec && spec.base !== type) return spec.base;
  if (spec) return undefined;
  const fam = FAMILIES.find((f) => f !== type && isSubtypeOf(type, f));
  return fam;
}

function buildItem(o: Obj, source: SchemaItem["source"], byId: Map<string, Obj>, nestedIn?: string): SchemaItem {
  const types = typesOf(o);
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const notes: string[] = [];
  const unknown: { type: string; suggestion: string | null }[] = [];
  const superseded: string[] = [];
  let richResult: string | undefined;
  for (const type of types) {
    if (!isKnownType(type)) {
      unknown.push({ type, suggestion: suggestType(type) });
      continue;
    }
    if (isSupersededType(type)) superseded.push(type);
    if (DEPRECATED_FEATURES[type]) notes.push(DEPRECATED_FEATURES[type]);
    const spec = RICH.find((r) => isSubtypeOf(type, r.base));
    if (spec && !richResult) {
      richResult = spec.name;
      for (const r of spec.required) if (!satisfied(o, r, byId)) missingRequired.push(r.replace(/\|/g, " or "));
      for (const r of spec.recommended) if (!satisfied(o, r, byId)) missingRecommended.push(r.replace(/\|/g, " or "));
      notes.push(...(spec.notes ?? []));
    }
    if (type === "WebSite" && hasPath(o, "potentialAction", byId)) notes.push("Google retired the sitelinks search box in 2024; the SearchAction is harmless but no longer shown.");
  }
  const primary = types[0] ?? "(no @type)";
  return {
    types: types.length ? types : ["(no @type)"],
    family: familyOf(primary),
    source,
    name: nameOf(o),
    nestedIn,
    unknown,
    superseded,
    richResult,
    missingRequired,
    missingRecommended,
    eligible: richResult ? missingRequired.length === 0 && unknown.length === 0 : undefined,
    notes: notes.length ? notes : undefined,
    children: childrenOf(o, byId),
  };
}

// ---- Microdata → plain objects, so the same validator applies.
function microdataToObj($: CheerioAPI, el: Element, depth = 0): Obj {
  const o: Obj = {};
  const itemtypes = ($(el).attr("itemtype") ?? "").trim().split(/\s+/).filter(Boolean);
  if (itemtypes.length) o["@type"] = itemtypes.map((t) => t.replace(/^https?:\/\/schema\.org\//i, ""));
  if (depth > 6) return o;
  const visit = (node: AnyNode) => {
    $(node)
      .children()
      .each((_, child) => {
        const c = $(child);
        const prop = c.attr("itemprop");
        if (prop) {
          let value: unknown;
          if (c.is("[itemscope]")) value = microdataToObj($, child as Element, depth + 1);
          else value = c.attr("content") ?? c.attr("href") ?? c.attr("src") ?? c.attr("datetime") ?? c.attr("value") ?? c.text().trim();
          for (const p of prop.split(/\s+/)) o[p] = o[p] === undefined ? value : [...asArray(o[p]), value];
        }
        if (!c.is("[itemscope]")) visit(child);
      });
  };
  visit(el);
  return o;
}

export function analyzeStructuredData($: CheerioAPI): StructuredDataReport {
  const roots: { obj: Obj; source: SchemaItem["source"] }[] = [];
  const parseErrors: string[] = [];
  const allNodes: Obj[] = [];
  let jsonLdBlocks = 0;
  let invalidBlocks = 0;
  let contextIssues = 0;

  const collect = (n: unknown, depth = 0) => {
    if (depth > 12) return;
    if (Array.isArray(n)) return n.forEach((x) => collect(x, depth + 1));
    if (!n || typeof n !== "object") return;
    allNodes.push(n as Obj);
    for (const v of Object.values(n as Obj)) if (v && typeof v === "object") collect(v, depth + 1);
  };

  $('script[type="application/ld+json" i]').each((i, el) => {
    jsonLdBlocks++;
    const raw = $(el).contents().text().trim();
    if (!raw) {
      invalidBlocks++;
      parseErrors.push(`Block ${i + 1}: empty`);
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(raw.replace(/^<!--/, "").replace(/-->$/, ""));
    } catch (e) {
      invalidBlocks++;
      parseErrors.push(`Block ${i + 1}: ${(e as Error).message.slice(0, 140)}`);
      return;
    }
    collect(data);
    for (const root of asArray(data as Obj | Obj[])) {
      if (!root || typeof root !== "object") continue;
      if (!/schema\.org/i.test(JSON.stringify(root["@context"] ?? ""))) contextIssues++;
      const graph = root["@graph"];
      if (Array.isArray(graph)) {
        for (const g of graph) if (g && typeof g === "object") roots.push({ obj: g as Obj, source: "json-ld" });
      }
      if (root["@type"] !== undefined) roots.push({ obj: root, source: "json-ld" });
    }
  });

  let microdataItems = 0;
  $("[itemscope]").each((_, el) => {
    if ($(el).attr("itemprop") !== undefined) return; // a property of a parent item
    if (!$(el).attr("itemtype")) return;
    microdataItems++;
    const obj = microdataToObj($, el as Element);
    collect(obj);
    roots.push({ obj, source: "microdata" });
  });

  // RDFa: top-level typeof elements (no typeof ancestor). Detected and listed, not validated.
  const rdfaTypes: string[] = [];
  $("[typeof]").each((_, el) => {
    if ($(el).parents("[typeof]").length) return;
    for (const t of ($(el).attr("typeof") ?? "").split(/\s+/).filter(Boolean)) {
      const clean = t.replace(/^(schema:|https?:\/\/schema\.org\/)/i, "");
      if (!rdfaTypes.includes(clean)) rdfaTypes.push(clean);
    }
  });

  const byId = new Map<string, Obj>();
  for (const n of allNodes) {
    const id = n["@id"];
    if (typeof id === "string" && Object.keys(n).length > 1 && !byId.has(id)) byId.set(id, n);
  }

  const items: SchemaItem[] = [];
  for (const r of roots) {
    const item = buildItem(r.obj, r.source, byId);
    items.push(item);
    // A page-level wrapper (WebPage…) whose mainEntity is a rich type: validate that too, as Google does.
    for (const me of asArray(r.obj.mainEntity as Obj | Obj[])) {
      const node = deref(me, byId) as Obj;
      if (!node || typeof node !== "object" || !typesOf(node).length) continue;
      if (!typesOf(r.obj).some((t) => isKnownType(t) && isSubtypeOf(t, "WebPage"))) continue;
      const sub = buildItem(node, r.source, byId, `${item.types[0]}.mainEntity`);
      if (sub.richResult) items.push(sub);
    }
  }
  for (const t of rdfaTypes) {
    items.push({
      types: [t],
      family: familyOf(t),
      source: "rdfa",
      unknown: isKnownType(t) ? [] : [{ type: t, suggestion: suggestType(t) }],
      superseded: isKnownType(t) && isSupersededType(t) ? [t] : [],
      missingRequired: [],
      missingRecommended: [],
      notes: ["RDFa is detected but not validated here. Google's Rich Results Test can validate it."],
      children: [],
    });
  }

  if (contextIssues) parseErrors.push(`${contextIssues} JSON-LD item${contextIssues > 1 ? "s" : ""} without a schema.org @context`);
  const eligible = [...new Set(items.filter((e) => e.eligible && e.richResult).map((e) => e.richResult!))];
  return { jsonLdBlocks, invalidBlocks, parseErrors, microdataItems, rdfaTypes, items, eligible, contextIssues };
}
