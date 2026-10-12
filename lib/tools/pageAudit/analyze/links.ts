import { inventoryLinks } from "../links";
import { add, evidence, type Ctx } from "./context";

/** Static link checks (no fetching). Live broken-link checks are an enricher in single-page mode. */
export function linksStatic(ctx: Ctx) {
  const { found, stats } = inventoryLinks(ctx.$, ctx.input.finalUrl);

  add(ctx, stats.internal === 0
    ? { id: "links", category: "Links", impact: 5, severity: "warning", title: "No internal links", detail: "Internal links spread authority and let crawlers discover your other pages.", fix: "Link to related pages, categories and next steps on your site." }
    : { id: "links", category: "Links", impact: 5, severity: "pass", title: `${stats.internal} internal, ${stats.external} external links`, detail: `${stats.unique} unique destinations.` });

  const nfInternal = found.filter((f) => f.internal && f.nofollow);
  if (nfInternal.length) add(ctx, { id: "nofollow-internal", category: "Links", impact: 3, severity: "warning", title: `${nfInternal.length} internal link${nfInternal.length > 1 ? "s" : ""} marked nofollow`, detail: "Nofollow on your own links throws away the authority they'd pass and can stop pages being discovered.", fix: "Remove rel=nofollow from internal links (use noindex on the target if it shouldn't rank).", items: evidence(nfInternal.map((f) => `${f.url} · "${f.anchor || "(no text)"}"`)) });

  if (stats.generic.length) {
    const total = stats.generic.reduce((s, g) => s + g.count, 0);
    const examples = found.filter((f) => stats.generic.some((g) => g.text === f.anchor.toLowerCase().replace(/[.…:!»›→>\s]+$/g, "")));
    add(ctx, { id: "generic-anchors", category: "Links", impact: 2, severity: total > 5 ? "warning" : "info", title: `${total} link${total > 1 ? "s" : ""} with generic text`, detail: `Anchor text such as ${stats.generic.slice(0, 3).map((g) => `"${g.text}" ×${g.count}`).join(", ")} tells search engines nothing about the destination.`, fix: 'Use descriptive anchors ("compare pricing plans", not "click here").', items: evidence(examples.map((f) => `"${f.anchor}" → ${f.url}`)) });
  }

  const empties = found.filter((f) => !f.anchor);
  if (empties.length) add(ctx, { id: "empty-anchors", category: "Links", impact: 3, severity: "warning", title: `${empties.length} link${empties.length > 1 ? "s" : ""} with no text`, detail: "No text, aria-label, title or image alt, so neither screen readers nor search engines know where they go.", fix: "Add visible text, an aria-label, or alt text on the linked image.", items: evidence(empties.map((f) => f.url)) });

  if (stats.total > 300) add(ctx, { id: "link-count", category: "Links", impact: 1, severity: "info", title: `${stats.total} links on one page`, detail: "Very link-heavy pages dilute the value passed to each link.", fix: "Prune mega-menus and footers to the links people actually use." });

  return { found, stats };
}
