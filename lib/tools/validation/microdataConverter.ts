/**
 * Generic JSON-LD → HTML Microdata converter. Driven entirely by object
 * shape (not a per-schema-type template), so every current and future type
 * in `schemaTemplates.ts` gets Microdata output for free — this is what lets
 * a single small module cover all 21 types instead of 21 hand-written ones.
 *
 * Bare `@id` references produced by `graphComposer.ts` (e.g. a WebSite's
 * `publisher: { "@id": "#organization" }`) have no native equivalent in
 * Microdata's linking model, so they're rendered as a `<link>` pointing at
 * the id — an approximation, not a full graph-linking translation.
 */

type JsonValue = string | number | boolean | JsonObject | JsonValue[] | null;
type JsonObject = { [key: string]: JsonValue | undefined };

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function indent(text: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line ? pad + line : line))
    .join("\n");
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function propToMicrodata(key: string, value: JsonValue | undefined): string {
  if (value === undefined || value === null || value === "") return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => propToMicrodata(key, item))
      .filter(Boolean)
      .join("\n");
  }

  if (isJsonObject(value)) {
    if (typeof value["@type"] === "string") {
      return nodeToMicrodata(value, key);
    }
    if (typeof value["@id"] === "string") {
      // Bare graph reference — approximate as a link to the referenced id.
      return `<link itemprop="${escapeAttr(key)}" href="${escapeAttr(value["@id"])}" />`;
    }
    return "";
  }

  const stringValue = String(value);
  if (/^https?:\/\//.test(stringValue)) {
    return `<link itemprop="${escapeAttr(key)}" href="${escapeAttr(stringValue)}" />`;
  }
  return `<meta itemprop="${escapeAttr(key)}" content="${escapeAttr(stringValue)}" />`;
}

function nodeToMicrodata(node: JsonObject, itemprop?: string): string {
  const type = typeof node["@type"] === "string" ? node["@type"] : "Thing";
  const propAttr = itemprop ? ` itemprop="${escapeAttr(itemprop)}"` : "";
  const idAttr = typeof node["@id"] === "string" && !node["@id"].startsWith("#") ? ` itemid="${escapeAttr(node["@id"])}"` : "";

  const inner = Object.entries(node)
    .filter(([key]) => key !== "@type" && key !== "@context" && key !== "@id")
    .map(([key, value]) => propToMicrodata(key, value))
    .filter(Boolean)
    .join("\n");

  return `<div itemscope itemtype="https://schema.org/${type}"${propAttr}${idAttr}>\n${indent(inner)}\n</div>`;
}

/** Converts a JSON-LD object (single entity or a composed `@graph`) into an HTML Microdata snippet. */
export function jsonLdToMicrodata(json: object): string {
  const obj = json as JsonObject;

  if (Array.isArray(obj["@graph"])) {
    return (obj["@graph"] as JsonValue[])
      .filter(isJsonObject)
      .map((node) => nodeToMicrodata(node))
      .join("\n\n");
  }

  return nodeToMicrodata(obj);
}
