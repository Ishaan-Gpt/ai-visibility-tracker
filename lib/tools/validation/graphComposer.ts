import type { SchemaType } from "@/lib/tools/schemaTemplates";

export type GraphEntity = {
  type: SchemaType;
  json: Record<string, unknown>;
};

const CANONICAL_ID: Partial<Record<SchemaType, string>> = {
  organization: "#organization",
  website: "#website",
  breadcrumb: "#breadcrumb",
};

/**
 * Composes multiple generated entities into a single JSON-LD `@graph`,
 * assigning canonical `@id`s and rewriting known cross-references (e.g. a
 * WebSite's publisher pointing at the Organization node by reference)
 * instead of duplicating the referenced object inline. This is the detail
 * that separates a professional multi-entity page from a stack of
 * disconnected <script> tags, and it's the piece most free generators skip.
 */
export function composeGraph(entities: GraphEntity[]): object {
  const nodes = entities.map(({ type, json }) => {
    const { "@context": _context, ...rest } = json;
    const id = CANONICAL_ID[type];
    return id ? { "@id": id, ...rest } : rest;
  });

  const hasOrganization = entities.some((e) => e.type === "organization");
  const websiteNode = nodes.find((n) => n["@type"] === "WebSite") as Record<string, unknown> | undefined;
  if (websiteNode && hasOrganization && !websiteNode.publisher) {
    websiteNode.publisher = { "@id": "#organization" };
  }

  const breadcrumbNode = nodes.find((n) => n["@type"] === "BreadcrumbList") as Record<string, unknown> | undefined;
  const pageNode = nodes.find((n) => n["@type"] === "WebPage") as Record<string, unknown> | undefined;
  if (breadcrumbNode && pageNode && !pageNode.breadcrumb) {
    pageNode.breadcrumb = { "@id": "#breadcrumb" };
  }

  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
