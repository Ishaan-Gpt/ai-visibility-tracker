import { abs, add, type Ctx } from "./context";

export function social(ctx: Ctx): { og: Record<string, string>; ogImage: string | null } {
  const { $, input } = ctx;
  const og: Record<string, string> = {};
  const dupes: string[] = [];
  $('meta[property^="og:" i]').each((_, el) => {
    const k = ($(el).attr("property") ?? "").toLowerCase();
    const v = $(el).attr("content") ?? "";
    if (og[k] !== undefined && !/^og:(image|locale:alternate|video|audio)/.test(k)) dupes.push(`${k}: "${og[k]}" and "${v}"`);
    if (og[k] === undefined) og[k] = v;
  });

  const missing = ["og:title", "og:description", "og:image"].filter((k) => !og[k]);
  add(ctx, missing.length
    ? { id: "og", category: "Social & Sharing", impact: 5, severity: "warning", title: `Missing Open Graph tags: ${missing.join(", ")}`, detail: "Links shared on LinkedIn, Slack, WhatsApp and Facebook will look plain or pull the wrong text.", fix: "Add og:title, og:description and og:image (1200×630 px)." }
    : { id: "og", category: "Social & Sharing", impact: 5, severity: "pass", title: "Open Graph tags present", detail: `${og["og:title"]}` });

  const ogImage = og["og:image"] ? abs(og["og:image"], input.finalUrl) : null;
  if (og["og:image"] && !/^https?:\/\//i.test(og["og:image"])) add(ctx, { id: "og-image-url", category: "Social & Sharing", impact: 2, severity: "warning", title: "og:image is a relative URL", detail: og["og:image"], fix: "Use an absolute https:// URL; most social platforms won't resolve relative paths." });

  const extra = ["og:url", "og:type"].filter((k) => !og[k]);
  if (extra.length && !missing.length) add(ctx, { id: "og-extra", category: "Social & Sharing", impact: 1, severity: "info", title: `No ${extra.join(" or ")}`, detail: "Optional, but og:url consolidates share counts and og:type sets how the card is shown.", fix: `Add ${extra.join(" and ")}.` });
  if (dupes.length) add(ctx, { id: "og-dup", category: "Social & Sharing", impact: 1, severity: "info", title: "Duplicate Open Graph tags", detail: "Platforms pick one unpredictably.", fix: "Keep one of each og: tag (often two plugins both output them).", items: dupes });

  const card = $('meta[name="twitter:card" i]').attr("content");
  add(ctx, card
    ? { id: "twitter", category: "Social & Sharing", impact: 2, severity: "pass", title: `X card: ${card}`, detail: "Shared links get a card on X." }
    : { id: "twitter", category: "Social & Sharing", impact: 2, severity: "info", title: "No twitter:card tag", detail: "X falls back to Open Graph for content, but shows a small card without this tag.", fix: '<meta name="twitter:card" content="summary_large_image">' });

  return { og, ogImage };
}
