import { isKnownType, isSubtypeOf, isSupersededType, normalizeType, suggestType } from "@/lib/audit/vocab";
import type { JsonParseError } from "@/lib/tools/validation/jsonParse";
import { evaluateRichResults, type FeatureAvailability, type FeatureEvaluation, type FeatureVerdict, type NodeAccess } from "@/lib/tools/validation/googleRichResultRules";
import { enumerationMembers, normalizeProperty, propertyInfo, suggestProperty, typeAllowsProperty, type PropInfo } from "@/lib/tools/validation/schemaVocabulary";
import { templateForTypes } from "@/lib/tools/validation/schemaImport";
import type { SchemaType } from "@/lib/tools/schemaTemplates";
import type { StructuredData } from "@/lib/tools/pageExtract/types";

/**
 * Structured-data validator in the spirit of validator.schema.org (vocabulary, syntax and value checks)
 * plus Google's Rich Results Test (per-feature required / recommended fields). Runs in the browser
 * and on the server; it has no network access and never fetches anything.
 */

export type IssueSeverity = "error" | "warning" | "info";

export interface SdIssue {
  severity: IssueSeverity;
  /** Dotted path inside the item, e.g. "offers[0].price". Empty for the item itself. */
  path: string;
  message: string;
  /** When the same problem repeats across list entries (review[0..n]), it is reported once with a count. */
  count?: number;
}

export interface ItemFeature extends FeatureEvaluation {
  /** Where the feature's entity sits inside the item ("" = the item itself). */
  path: string;
  entityType: string;
}

export type ItemSource = "json-ld" | "microdata" | "rdfa";

export interface ValidatedItem {
  key: string;
  source: ItemSource;
  /** JSON-LD script block index (0-based) for json-ld items. */
  blockIndex: number | null;
  /** Location inside the block, e.g. "@graph[2]". */
  locator: string;
  types: string[];
  title: string;
  node: Record<string, unknown>;
  issues: SdIssue[];
  features: ItemFeature[];
  errors: number;
  warnings: number;
  /** Generator template this item can be loaded into, if any. */
  template: SchemaType | null;
}

export interface SyntaxProblem {
  blockIndex: number;
  error: JsonParseError;
  notes: string[];
}

export interface FeatureSummary {
  id: string;
  name: string;
  docsUrl: string;
  availability: FeatureAvailability;
  note?: string;
  verdict: FeatureVerdict;
  count: number;
  invalid: number;
  withWarnings: number;
  itemKeys: string[];
}

export interface ValidationReport {
  items: ValidatedItem[];
  syntaxErrors: SyntaxProblem[];
  /** Block-level notes (CDATA / comment wrappers, truncated blocks) and extraction warnings. */
  notes: string[];
  features: FeatureSummary[];
  totals: { items: number; errors: number; warnings: number; syntaxErrors: number; eligible: number; invalid: number };
}

/* ------------------------------- helpers ------------------------------- */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}(:?\d{2})?)?$/;
const ISO_DURATION = /^-?P(?!$)(\d+(\.\d+)?Y)?(\d+(\.\d+)?M)?(\d+(\.\d+)?W)?(\d+(\.\d+)?D)?(T(?=\d)(\d+(\.\d+)?H)?(\d+(\.\d+)?M)?(\d+(\.\d+)?S)?)?$/;
const ISO_TIME = /^\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

function validDate(s: string): boolean {
  if (ISO_DATE.test(s)) {
    const [y, m = "01", d = "01"] = s.split("-");
    const dt = new Date(`${y}-${m}-${d}T00:00:00Z`);
    return !Number.isNaN(dt.getTime()) && dt.getUTCMonth() + 1 === Number(m) && dt.getUTCDate() === Number(d);
  }
  if (ISO_DATETIME.test(s)) return !Number.isNaN(Date.parse(s.replace(" ", "T")));
  return false;
}

function gtinChecksumOk(digits: string): boolean {
  const nums = digits.split("").map(Number);
  const check = nums.pop()!;
  let sum = 0;
  nums.reverse().forEach((n, i) => (sum += n * (i % 2 === 0 ? 3 : 1)));
  return (10 - (sum % 10)) % 10 === check;
}

function typesOf(node: unknown): string[] {
  if (!isObj(node)) return [];
  const t = node["@type"];
  const list = Array.isArray(t) ? t : t !== undefined ? [t] : [];
  return list.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => (/^https?:\/\/(www\.)?schema\.org\//i.test(x) || x.startsWith("schema:") ? normalizeType(x) : x.trim()));
}

function isSchemaType(t: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(t);
}

function getProp(node: Obj, key: string): unknown {
  if (key in node) return node[key];
  for (const k of [`schema:${key}`, `https://schema.org/${key}`, `http://schema.org/${key}`]) if (k in node) return node[k];
  return undefined;
}

function unwrap(v: unknown): unknown[] {
  if (v === undefined) return [];
  if (Array.isArray(v)) return v.flatMap(unwrap);
  if (isObj(v)) {
    if ("@list" in v) return unwrap(v["@list"]);
    if ("@set" in v) return unwrap(v["@set"]);
    if ("@value" in v) return [v["@value"]];
  }
  return [v];
}

function nonEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.some(nonEmpty);
  if (isObj(v)) return Object.keys(v).length > 0;
  return true;
}

function titleOf(node: Obj): string {
  for (const k of ["name", "headline", "title", "alternateName"]) {
    const v = unwrap(getProp(node, k)).find((x) => typeof x === "string" && x.trim());
    if (typeof v === "string") return v.trim().slice(0, 120);
  }
  const id = node["@id"];
  return typeof id === "string" ? id : "";
}

const GOOGLE_ENUM_PROPS = new Set(["availability", "itemCondition", "eventStatus", "eventAttendanceMode", "bookFormat", "returnPolicyCategory", "returnMethod", "returnFees", "dayOfWeek", "digitalSourceType", "interactionType"]);

/* --------------------------- graph indexing ---------------------------- */

class Graph {
  byId = new Map<string, Obj>();
  constructor(private pageUrl?: string) {}

  resolveId(id: string): string {
    if (!this.pageUrl) return id;
    try {
      return new URL(id, this.pageUrl).href;
    } catch {
      return id;
    }
  }

  index(v: unknown, depth = 0) {
    if (depth > 30) return;
    if (Array.isArray(v)) return v.forEach((x) => this.index(x, depth + 1));
    if (!isObj(v)) return;
    const id = v["@id"];
    if (typeof id === "string" && Object.keys(v).some((k) => !k.startsWith("@") || k === "@type")) {
      const keyed = [id, this.resolveId(id)];
      for (const k of keyed) {
        const prev = this.byId.get(k);
        // Google merges nodes that share an @id; keep the richer description, add missing properties.
        this.byId.set(k, prev ? { ...v, ...prev } : v);
      }
    }
    for (const [k, x] of Object.entries(v)) if (k !== "@context") this.index(x, depth + 1);
  }

  isRef(v: unknown): v is Obj {
    return isObj(v) && typeof v["@id"] === "string" && Object.keys(v).every((k) => k === "@id" || k === "@type");
  }

  lookup(id: string): Obj | null {
    return this.byId.get(id) ?? this.byId.get(this.resolveId(id)) ?? null;
  }

  deref(v: unknown): unknown {
    if (this.isRef(v)) return this.lookup(v["@id"] as string) ?? v;
    return v;
  }

  access(pageUrl?: string): NodeAccess {
    const values = (node: unknown, path: string): unknown[] => {
      let cur: unknown[] = [this.deref(node)];
      for (const seg of path.split(".")) {
        const next: unknown[] = [];
        for (const c of cur) {
          if (!isObj(c)) continue;
          for (const v of unwrap(getProp(c, seg))) next.push(this.deref(v));
        }
        cur = next;
      }
      return cur;
    };
    return {
      values,
      has: (node, path) => values(node, path).some(nonEmpty),
      str: (node, path) => {
        const v = values(node, path).find((x) => typeof x === "string" || typeof x === "number" || typeof x === "boolean");
        return v === undefined ? null : String(v);
      },
      types: (node) => typesOf(this.deref(node)),
      isA: (node, type) => typesOf(this.deref(node)).some((t) => isSubtypeOf(t, type)),
      pageUrl,
    };
  }
}

/* ------------------------------ @context -------------------------------- */

interface ContextInfo {
  schema: boolean;
  terms: Set<string>;
  issue?: SdIssue;
}

function readContext(ctx: unknown): ContextInfo {
  const terms = new Set<string>();
  if (ctx === undefined || ctx === null) {
    return { schema: true, terms, issue: { severity: "error", path: "@context", message: 'Missing @context, so the properties have no vocabulary. Add "@context": "https://schema.org".' } };
  }
  const list = Array.isArray(ctx) ? ctx : [ctx];
  let schema = false;
  let issue: SdIssue | undefined;
  for (const c of list) {
    if (typeof c === "string") {
      const s = c.trim();
      if (/^https?:\/\/schema\.org\/?(docs\/jsonldcontext\.json(ld)?)?$/i.test(s)) schema = true;
      else if (/^https?:\/\/www\.schema\.org\/?$/i.test(s)) {
        schema = true;
        issue = { severity: "warning", path: "@context", message: `"${s}" works, but the canonical value is "https://schema.org".` };
      } else if (/^(\/\/)?(www\.)?schema\.org\/?$/i.test(s)) {
        schema = true;
        issue = { severity: "error", path: "@context", message: `"${s}" is not a full URL. Use "https://schema.org".` };
      }
    } else if (isObj(c)) {
      const vocab = c["@vocab"];
      if (typeof vocab === "string" && /schema\.org/i.test(vocab)) schema = true;
      for (const k of Object.keys(c)) if (!k.startsWith("@")) terms.add(k);
    }
  }
  if (!schema && !issue) issue = { severity: "info", path: "@context", message: "This block uses a non-schema.org context, so schema.org vocabulary checks were skipped." };
  return { schema, terms, issue };
}

/* ----------------------------- validation ------------------------------ */

interface Ctx {
  graph: Graph;
  issues: SdIssue[];
  seen: WeakSet<object>;
  schema: boolean;
  terms: Set<string>;
  reportedRefs: Set<string>;
  pageUrl?: string;
}

function join(path: string, key: string) {
  return path ? `${path}.${key}` : key;
}

function checkPrimitive(prop: string, info: PropInfo | null, raw: string | number | boolean, path: string, ctx: Ctx) {
  const add = (severity: IssueSeverity, message: string) => ctx.issues.push({ severity, path, message });
  const s = String(raw).trim();
  const ranges = info?.ranges ?? [];
  const acceptsText = ranges.includes("Text") || ranges.includes("PronounceableText");
  const only = (set: string[]) => ranges.length > 0 && ranges.every((r) => set.includes(r));

  // Dates
  if (only(["Date", "DateTime"]) || (only(["Date", "DateTime", "Text"]) && /date|Date$/.test(prop))) {
    if (!validDate(s)) add("error", `"${prop}" must be an ISO 8601 date or date-time (e.g. 2026-10-13 or 2026-10-13T09:30:00+01:00). Found "${s}".`);
    return;
  }
  if (only(["Time"]) || (only(["Time", "Text"]) && /^(opens|closes|checkinTime|checkoutTime)$/.test(prop))) {
    if (!ISO_TIME.test(s) && !validDate(s)) add("warning", `"${prop}" should be a time like 09:00:00. Found "${s}".`);
    return;
  }
  // Durations (Google requires ISO 8601 for cookTime, duration, etc.)
  if (ranges.includes("Duration") && !acceptsText) {
    if (!ISO_DURATION.test(s)) add("error", `"${prop}" must be an ISO 8601 duration like PT1H30M (1 hour 30 minutes) or PT45M. Found "${s}".`);
    return;
  }
  // Booleans
  if (only(["Boolean"])) {
    if (!/^(true|false)$/i.test(s) && !/^https?:\/\/schema\.org\/(True|False)$/.test(s)) add("error", `"${prop}" expects true or false. Found "${s}".`);
    return;
  }
  // Numbers
  if (only(["Number", "Integer", "Float"]) || (only(["Integer", "Text"]) && prop === "position")) {
    const n = Number(s);
    if (s === "" || Number.isNaN(n)) add("error", `"${prop}" expects a number. Found "${s}".`);
    else if ((ranges.includes("Integer") && !ranges.includes("Number")) || prop === "position") {
      if (!Number.isInteger(n)) add("warning", `"${prop}" should be a whole number. Found "${s}".`);
      else if (prop === "position" && n < 1) add("warning", `"position" starts at 1.`);
    }
    return;
  }

  // Enumerations (availability, itemCondition, eventStatus…)
  const enumRanges = ranges.filter((r) => enumerationMembers(r));
  if (enumRanges.length) {
    const isSchemaUrl = /^https?:\/\/(www\.)?schema\.org\//i.test(s) || s.startsWith("schema:");
    const member = s.replace(/^https?:\/\/(www\.)?schema\.org\//i, "").replace(/^schema:/, "");
    const allMembers = enumRanges.flatMap((r) => [...enumerationMembers(r)!]);
    if (allMembers.includes(member)) {
      if (!isSchemaUrl && GOOGLE_ENUM_PROPS.has(prop)) add("info", `Prefer the full URL "https://schema.org/${member}" for "${prop}". Google accepts the short form.`);
      return;
    }
    const ci = allMembers.find((m) => m.toLowerCase() === member.toLowerCase());
    if (ci) {
      add("error", `"${s}" has the wrong letter case. Use "https://schema.org/${ci}".`);
      return;
    }
    if (isSchemaUrl || !acceptsText || GOOGLE_ENUM_PROPS.has(prop)) {
      const shown = allMembers.slice(0, 8).join(", ");
      add(isSchemaUrl || !acceptsText ? "error" : "warning", `"${s}" isn't a valid ${enumRanges[0]} value for "${prop}". Use one of: ${shown}${allMembers.length > 8 ? "…" : ""}.`);
      return;
    }
  }

  // URLs
  const urlish = ranges.includes("URL") && !acceptsText;
  if (urlish || ["url", "sameAs", "contentUrl", "embedUrl", "thumbnailUrl", "logo", "image", "acquireLicensePage", "license", "menu", "hasMap"].includes(prop)) {
    if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(s)) {
      if (/\s/.test(s)) add("warning", `"${prop}" URL contains spaces; encode them as %20.`);
    } else if (/^(\/|\.\.?\/|[\w-]+\/)/.test(s) || /^[\w-]+\.(jpe?g|png|gif|webp|avif|svg|html?)$/i.test(s)) {
      add("warning", `"${prop}" is a relative URL ("${s}"). Google resolves it against the page, but absolute URLs are safer.`);
    } else if (/^(data|mailto|tel):/i.test(s)) {
      if (prop === "image" || prop === "logo" || prop === "thumbnailUrl") add("warning", `"${prop}" is an inline ${s.slice(0, 5)} URL; Google needs a crawlable image URL.`);
    } else if (urlish && !/^[a-z][a-z0-9+.-]*:/i.test(s)) {
      add("error", `"${prop}" expects a URL. Found "${s.slice(0, 80)}".`);
    }
  }

  // Google-specific value formats
  if (["price", "lowPrice", "highPrice"].includes(prop) && typeof raw === "string") {
    if (/[^\d.,\s-]/.test(s)) add("error", `"${prop}" must be a plain number such as 19.99, without currency symbols or words. Found "${s}". Put the currency in priceCurrency.`);
    else if (s.includes(",")) add("warning", `"${prop}" uses a comma ("${s}"). Use a dot for decimals and no thousands separator, e.g. 1299.99.`);
  }
  if ((prop === "priceCurrency" || prop === "currency") && !/^[A-Z]{3}$/.test(s)) {
    add(/^[a-z]{3}$/.test(s) ? "warning" : "error", `"${prop}" must be a 3-letter ISO 4217 code such as USD, EUR or INR. Found "${s}".`);
  }
  if (/^(ratingValue|bestRating|worstRating)$/.test(prop)) {
    if (Number.isNaN(Number(s.replace(",", "."))) && !/^\d+(\.\d+)?%$/.test(s) && !/^\d+(\.\d+)?\/\d+$/.test(s)) add("warning", `"${prop}" should be a number. Found "${s}".`);
  }
  const gtin = prop.match(/^gtin(8|12|13|14)?$/);
  if (gtin) {
    const digits = s.replace(/[\s-]/g, "");
    if (!/^\d+$/.test(digits)) add("error", `"${prop}" must contain digits only. Found "${s}".`);
    else if (gtin[1] ? digits.length !== Number(gtin[1]) : ![8, 12, 13, 14].includes(digits.length)) add("error", `"${prop}" must be ${gtin[1] ?? "8, 12, 13 or 14"} digits long (found ${digits.length}).`);
    else if (!gtinChecksumOk(digits)) add("warning", `"${prop}" ${s} fails the GS1 check digit. Double-check the number.`);
  }
  if (prop === "addressCountry" && s.length > 3) add("info", `Google recommends the 2-letter ISO 3166-1 country code for "addressCountry" (e.g. US, GB, IN) instead of "${s}".`);
  if ((prop === "latitude" || prop === "longitude") && !Number.isNaN(Number(s))) {
    const n = Number(s);
    if ((prop === "latitude" && Math.abs(n) > 90) || (prop === "longitude" && Math.abs(n) > 180)) add("error", `"${prop}" ${s} is out of range.`);
  }
  if (prop === "email" && !/@/.test(s)) add("warning", `"email" doesn't look like an email address ("${s}").`);
  if (prop === "inLanguage" && !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(s)) add("info", `"inLanguage" is best given as a BCP 47 code like "en" or "en-GB" (found "${s}").`);
}

function validateNode(node: Obj, path: string, ctx: Ctx, ranges: string[] | null, depth: number) {
  if (depth > 16) return;
  if (ctx.seen.has(node)) return;
  ctx.seen.add(node);
  const add = (severity: IssueSeverity, p: string, message: string) => ctx.issues.push({ severity, path: p, message });

  // Bare reference
  if (ctx.graph.isRef(node)) {
    const id = node["@id"] as string;
    if (!ctx.graph.lookup(id) && !ctx.reportedRefs.has(id)) {
      ctx.reportedRefs.add(id);
      add("info", path, `References "${id}", which isn't described in the markup on this page. That's fine if it's defined on another page.`);
    }
    return;
  }

  const types = typesOf(node);
  const schemaTypes = types.filter(isSchemaType);
  if (types.length === 0) {
    const objRanges = (ranges ?? []).filter((r) => !["Text", "URL", "Number", "Integer", "Float", "Boolean", "Date", "DateTime", "Time"].includes(r));
    if (ranges) add("warning", path, `Missing @type${objRanges.length === 1 ? ` (expected ${objRanges[0]})` : objRanges.length ? ` (expected ${objRanges.slice(0, 3).join(" or ")})` : ""}. Untyped objects are often ignored.`);
    else add("error", path, "Missing @type, so search engines can't tell what this item is.");
  }
  for (const t of types) {
    if (!isSchemaType(t)) {
      if (/data-vocabulary\.org/i.test(t)) add("error", path, `data-vocabulary.org (${t}) is no longer supported by Google. Use the schema.org equivalent.`);
      else add("info", path, `"${t}" is from another vocabulary; it wasn't checked.`);
      continue;
    }
    if (!isKnownType(t)) {
      const s = suggestType(t);
      add("error", path, s && s.toLowerCase() === t.toLowerCase() ? `"${t}" has the wrong letter case: types are case-sensitive. Use "${s}".` : `"${t}" is not a schema.org type.${s ? ` Did you mean "${s}"?` : ""}`);
    } else if (isSupersededType(t)) add("warning", path, `"${t}" is superseded in schema.org. Check https://schema.org/${t} for its replacement.`);
  }
  const knownTypes = schemaTypes.filter(isKnownType);
  const checkProps = ctx.schema && knownTypes.length > 0 && knownTypes.length === schemaTypes.length;
  const typeLabel = knownTypes.join(" / ");

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@")) {
      if (key === "@id" && typeof value !== "string") add("error", join(path, "@id"), "@id must be a string (a URL or #fragment).");
      if (key === "@graph") for (const [i, g] of unwrap(value).entries()) if (isObj(g)) validateNode(g, join(path, `@graph[${i}]`), ctx, null, depth + 1);
      continue;
    }
    if (ctx.terms.has(key)) continue;
    if (["type", "context", "id", "graph"].includes(key)) {
      add("error", join(path, key), `"${key}" needs an @ sign: use "@${key}". Without it the keyword is read as an unknown property.`);
      continue;
    }
    const prop = normalizeProperty(key);
    if (/[:/]/.test(prop)) continue; // another vocabulary's term, e.g. "dc:title"
    if (/-(input|output)$/.test(prop)) continue; // Action annotations like "query-input" (schema.org Potential Actions shorthand)
    const p = join(path, prop);
    const info = propertyInfo(prop);
    if (!info) {
      if (ctx.schema && (types.length === 0 || schemaTypes.length > 0)) {
        const s = suggestProperty(prop, knownTypes);
        add("error", p, `"${prop}" is not a schema.org property${s ? `. Did you mean "${s}"?` : "."}${typeLabel ? " Search engines will ignore it." : ""}`);
      }
    } else {
      if (checkProps && !knownTypes.some((t) => typeAllowsProperty(t, prop))) {
        add("warning", p, `"${prop}" is not defined for ${typeLabel}. schema.org uses it on ${info.domains.slice(0, 4).join(", ")}${info.domains.length > 4 ? "…" : ""}, so consumers may ignore it here.`);
      }
      if (info.superseded) add("warning", p, `"${prop}" is superseded${info.supersededBy.length ? ` by "${info.supersededBy.join('", "')}"` : ""}.`);
      else if (info.pending) add("info", p, `"${prop}" is a pending schema.org property (proposed, may still change).`);
    }

    const list = unwrap(value);
    if (Array.isArray(value) && value.length === 0) add("warning", p, `"${prop}" is an empty list.`);
    list.forEach((v, i) => {
      const vp = list.length > 1 ? `${p}[${i}]` : p;
      if (v === null || (typeof v === "string" && v.trim() === "")) {
        add("warning", vp, `"${prop}" is empty.`);
        return;
      }
      if (isObj(v)) {
        validateNode(v, vp, ctx, info?.ranges ?? null, depth + 1);
        if (info && !ctx.graph.isRef(v)) {
          const vt = typesOf(v).filter((t) => isSchemaType(t) && isKnownType(t));
          const objRanges = info.ranges;
          const ok = vt.length === 0 || objRanges.includes("Thing") || vt.some((t) => objRanges.some((r) => isSubtypeOf(t, r)) || isSubtypeOf(t, "Role"));
          if (!ok) add("warning", vp, `"${prop}" expects ${objRanges.slice(0, 4).join(" or ")}, but the value is a ${vt.join(" / ")}.`);
        }
        return;
      }
      if (Array.isArray(v)) return;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        checkPrimitive(prop, info, v, vp, ctx);
        // A plain string where an object is expected is legal schema.org, but some Google features need the object.
        if (info && typeof v === "string" && ["author", "publisher", "brand", "offers", "aggregateRating", "address", "location", "hiringOrganization", "reviewRating"].includes(prop)) {
          if (["offers", "aggregateRating", "reviewRating", "location", "address"].includes(prop) && !(prop === "address" && info.ranges.includes("Text"))) {
            add("warning", vp, `"${prop}" is plain text; Google needs a nested ${info.ranges.find((r) => r !== "Text" && r !== "URL") ?? "object"} here.`);
          }
        }
      }
    });
  }
}

/** Collapses the same problem repeated across list entries ("review[3].datePublished") into one issue with a count. */
function groupIssues(issues: SdIssue[]): SdIssue[] {
  const groups = new Map<string, SdIssue[]>();
  for (const i of issues) {
    const key = `${i.severity}|${i.path.replace(/\[\d+\]/g, "[*]")}|${i.message.replace(/"[^"]*"/g, "…")}`;
    const g = groups.get(key) ?? [];
    g.push(i);
    groups.set(key, g);
  }
  const out: SdIssue[] = [];
  for (const g of groups.values()) {
    if (g.length < 3) out.push(...g);
    else out.push({ ...g[0], path: g[0].path.replace(/\[\d+\]/g, "[*]"), message: `${g[0].message} The same problem appears ${g.length} times.`, count: g.length });
  }
  return out;
}

/* ------------------------------ features ------------------------------- */

const DESCEND = new Set(["mainEntity", "breadcrumb", "video", "subjectOf", "itemListElement", "item", "hasVariant"]);

function collectFeatures(node: Obj, path: string, a: NodeAccess, graph: Graph, root: boolean, out: ItemFeature[], done: WeakSet<object>, depth = 0) {
  if (depth > 6 || done.has(node) || graph.isRef(node)) return;
  done.add(node);
  const types = typesOf(node);
  if (types.length) {
    for (const ev of evaluateRichResults(node, a, { root })) out.push({ ...ev, path, entityType: types.join(" / ") });
  }
  const consumesMain = a.isA(node, "ProfilePage") || a.isA(node, "QAPage") || a.isA(node, "FAQPage");
  const isPage = a.isA(node, "WebPage");
  for (const [key, value] of Object.entries(node)) {
    const prop = normalizeProperty(key);
    if (!DESCEND.has(prop)) continue;
    unwrap(value).forEach((v, i, arr) => {
      if (!isObj(v)) return;
      // Variants that only point at their own page (url) are evaluated on that page, not here.
      if (prop === "hasVariant" && !a.has(v, "name") && !a.has(v, "offers")) return;
      const childRoot = prop === "mainEntity" && isPage && !consumesMain;
      collectFeatures(v, join(path, arr.length > 1 ? `${prop}[${i}]` : prop), a, graph, childRoot, out, done, depth + 1);
    });
  }
}

/** A resolver for @id references across all the markup, for importing items into the generator. */
export function createResolver(sd: StructuredData, pageUrl?: string): (v: unknown) => unknown {
  const graph = new Graph(pageUrl);
  for (const block of sd.jsonLd) if (block.ok) graph.index(block.data);
  for (const item of [...sd.microdata, ...sd.rdfa]) graph.index(item);
  return (v) => graph.deref(v);
}

/* -------------------------------- entry -------------------------------- */

interface TopNode {
  node: Obj;
  context: unknown;
  locator: string;
}

function topNodes(data: unknown, locator = "", inheritedContext?: unknown): TopNode[] {
  if (Array.isArray(data)) return data.flatMap((d, i) => topNodes(d, `${locator}[${i}]`, inheritedContext));
  if (!isObj(data)) return [];
  const context = "@context" in data ? data["@context"] : inheritedContext;
  const out: TopNode[] = [];
  if (Array.isArray(data["@graph"])) {
    (data["@graph"] as unknown[]).forEach((g, i) => {
      if (isObj(g)) out.push(...topNodes(g, `${locator}@graph[${i}]`, context));
    });
    const rest = Object.keys(data).filter((k) => k !== "@context" && k !== "@graph");
    if (rest.length && rest.some((k) => !k.startsWith("@"))) {
      const copy: Obj = { ...data };
      delete copy["@graph"];
      out.unshift({ node: copy, context, locator: locator || "(root)" });
    }
    return out;
  }
  return [{ node: data, context, locator: locator || "(root)" }];
}

export function validateStructuredData(sd: StructuredData, opts: { pageUrl?: string } = {}): ValidationReport {
  const graph = new Graph(opts.pageUrl);
  const notes: string[] = [...sd.warnings];
  const syntaxErrors: SyntaxProblem[] = [];

  for (const block of sd.jsonLd) {
    if (block.notes.length) notes.push(...block.notes.map((n) => `JSON-LD block ${block.index + 1}: ${n}`));
    if (block.truncated) notes.push(`JSON-LD block ${block.index + 1} is very large; only the first 250,000 characters were checked.`);
    if (block.ok) graph.index(block.data);
    else syntaxErrors.push({ blockIndex: block.index, error: block.error, notes: block.notes });
  }
  for (const item of [...sd.microdata, ...sd.rdfa]) graph.index(item);
  const a = graph.access(opts.pageUrl);

  const items: ValidatedItem[] = [];
  const pushItem = (node: Obj, source: ItemSource, blockIndex: number | null, locator: string, ctxInfo: ContextInfo) => {
    const ctx: Ctx = { graph, issues: [], seen: new WeakSet(), schema: ctxInfo.schema, terms: ctxInfo.terms, reportedRefs: new Set(), pageUrl: opts.pageUrl };
    if (ctxInfo.issue) ctx.issues.push(ctxInfo.issue);
    validateNode(node, "", ctx, null, 0);
    ctx.issues = groupIssues(ctx.issues);
    const features: ItemFeature[] = [];
    collectFeatures(node, "", a, graph, true, features, new WeakSet());
    const types = typesOf(node);

    // Self-serving ratings on the site's own Organization / LocalBusiness.
    if ((a.isA(node, "Organization") || a.isA(node, "LocalBusiness")) && (a.has(node, "aggregateRating") || a.has(node, "review")) && opts.pageUrl) {
      const host = (u: string | null) => {
        try {
          return u ? new URL(u, opts.pageUrl).host.replace(/^www\./, "") : null;
        } catch {
          return null;
        }
      };
      if (host(a.str(node, "url")) === host(opts.pageUrl)) ctx.issues.push({ severity: "warning", path: "aggregateRating", message: "These look like ratings of your own business on your own site (self-serving). Google doesn't show review snippets for them." });
    }

    const featureErrors = features.filter((f) => f.feature.availability !== "retired").reduce((n, f) => n + f.rules.filter((r) => r.weight === "required" && !r.passed).length, 0);
    const featureWarnings = features.filter((f) => f.feature.availability !== "retired").reduce((n, f) => n + f.rules.filter((r) => r.weight === "recommended" && !r.passed).length, 0);
    items.push({
      key: `${source}-${blockIndex ?? "x"}-${locator}-${items.length}`,
      source,
      blockIndex,
      locator,
      types,
      title: titleOf(node),
      node,
      issues: ctx.issues,
      features,
      errors: ctx.issues.filter((i) => i.severity === "error").reduce((n, i) => n + (i.count ?? 1), 0) + featureErrors,
      warnings: ctx.issues.filter((i) => i.severity === "warning").reduce((n, i) => n + (i.count ?? 1), 0) + featureWarnings,
      template: templateForTypes(types),
    });
  };

  // Google merges top-level nodes that share an @id (e.g. a Recipe in one block and its aggregateRating in another).
  type Pending = { node: Obj; blockIndex: number; locator: string; context: unknown };
  const pending: Pending[] = [];
  const byId = new Map<string, Pending>();
  for (const block of sd.jsonLd) {
    if (!block.ok) continue;
    const nodes = topNodes(block.data);
    if (nodes.length === 0) {
      notes.push(`JSON-LD block ${block.index + 1} contains no objects.`);
      continue;
    }
    for (const t of nodes) {
      const id = typeof t.node["@id"] === "string" ? graph.resolveId(t.node["@id"] as string) : null;
      const prev = id ? byId.get(id) : undefined;
      if (prev && id) {
        const merged: Obj = { ...prev.node };
        for (const [k, v] of Object.entries(t.node)) {
          if (k === "@context" || k === "@id") continue;
          if (!(k in merged)) merged[k] = v;
          else if (k !== "@type" && JSON.stringify(merged[k]) !== JSON.stringify(v)) merged[k] = [...unwrap(merged[k]), ...unwrap(v)];
        }
        prev.node = merged;
        prev.locator = `${prev.locator} + block ${block.index + 1}${t.locator !== "(root)" ? ` ${t.locator}` : ""}`;
        notes.push(`JSON-LD block ${block.index + 1} adds properties to "${id}" defined earlier; they were merged into one item, as Google does.`);
        continue;
      }
      const p: Pending = { node: t.node, blockIndex: block.index, locator: t.locator, context: t.context };
      pending.push(p);
      if (id) byId.set(id, p);
    }
  }
  for (const p of pending) pushItem(p.node, "json-ld", p.blockIndex, p.locator, readContext(p.context));
  const implicit: ContextInfo = { schema: true, terms: new Set() };
  sd.microdata.forEach((m, i) => pushItem(m, "microdata", null, `item ${i + 1}`, implicit));
  sd.rdfa.forEach((r, i) => pushItem(r, "rdfa", null, `item ${i + 1}`, implicit));

  // Feature summary, Rich Results Test style.
  const byFeature = new Map<string, FeatureSummary>();
  for (const it of items) {
    for (const f of it.features) {
      const id = f.feature.id === "retired-misc" ? `retired-${f.entityType}` : f.feature.id;
      const s = byFeature.get(id) ?? {
        id,
        name: f.feature.id === "retired-misc" ? `${f.entityType} (retired)` : f.feature.name,
        docsUrl: f.feature.docsUrl,
        availability: f.feature.availability,
        note: f.feature.note,
        verdict: "eligible" as FeatureVerdict,
        count: 0,
        invalid: 0,
        withWarnings: 0,
        itemKeys: [],
      };
      s.count++;
      if (f.verdict === "invalid") s.invalid++;
      if (f.verdict === "warnings") s.withWarnings++;
      if (!s.itemKeys.includes(it.key)) s.itemKeys.push(it.key);
      byFeature.set(id, s);
    }
  }
  const features = [...byFeature.values()].map((s) => ({
    ...s,
    verdict: (s.availability === "retired" ? "not-shown" : s.invalid > 0 ? "invalid" : s.withWarnings > 0 ? "warnings" : "eligible") as FeatureVerdict,
  }));
  const rank: Record<FeatureVerdict, number> = { invalid: 0, warnings: 1, eligible: 2, "not-shown": 3 };
  features.sort((x, y) => rank[x.verdict] - rank[y.verdict] || x.name.localeCompare(y.name));

  return {
    items,
    syntaxErrors,
    notes,
    features,
    totals: {
      items: items.length,
      errors: items.reduce((n, i) => n + i.errors, 0) + syntaxErrors.length,
      warnings: items.reduce((n, i) => n + i.warnings, 0),
      syntaxErrors: syntaxErrors.length,
      eligible: features.filter((f) => f.verdict === "eligible" || f.verdict === "warnings").length,
      invalid: features.filter((f) => f.verdict === "invalid").length,
    },
  };
}
