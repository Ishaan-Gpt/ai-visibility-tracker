import { add, clip, type Ctx } from "./context";

export interface ContentFacts {
  title: string | null;
  titles: string[];
  description: string | null;
  descriptions: string[];
  h1: string[];
  mainWords: number;
  leadParagraph: string | null;
}

/** Root of the main content: <main>, [role=main] or the largest <article>; null when the page has none. */
export function mainRoot(ctx: Ctx) {
  const { $ } = ctx;
  const main = $("main, [role=main]").first();
  if (main.length) return main;
  const articles = $("article").toArray();
  if (!articles.length) return null;
  return $(articles.sort((a, b) => $(b).text().length - $(a).text().length)[0]);
}

function words(s: string): number {
  const t = s.replace(/\s+/g, " ").trim();
  return t ? t.split(" ").length : 0;
}

export function content(ctx: Ctx): ContentFacts {
  const { $ } = ctx;
  // <title> inside inline SVGs is an accessible name, not the page title.
  const titles = $("title").filter((_, el) => $(el).parents("svg").length === 0).map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get();
  const title = titles[0] || null;
  if (!title) add(ctx, { id: "title", category: "Content", impact: 9, severity: "error", title: "Missing title tag", detail: "The title is the strongest on-page relevance signal and the blue link in results.", fix: "Add a unique, descriptive <title> of 30–60 characters with the main topic first." });
  else if (title.length < 30) add(ctx, { id: "title", category: "Content", impact: 9, severity: "warning", title: `Title is short (${title.length} chars)`, detail: title, fix: "Aim for 30–60 characters: main keyword, a differentiator, then the brand." });
  else if (title.length > 60) add(ctx, { id: "title", category: "Content", impact: 9, severity: "warning", title: `Title may be truncated (${title.length} chars)`, detail: title, fix: "Keep titles under about 60 characters (≈580 px) so the important part isn't cut off." });
  else add(ctx, { id: "title", category: "Content", impact: 9, severity: "pass", title: `Title length is good (${title.length} chars)`, detail: title });
  if (titles.length > 1) add(ctx, { id: "title-dup", category: "Content", impact: 3, severity: "warning", title: `${titles.length} <title> tags`, detail: "Browsers and Google use the first one; the extras are usually a theme/plugin conflict.", fix: "Output a single <title> element.", items: titles.map((t) => t || "(empty)") });

  const descriptions = $('meta[name="description" i]').map((_, el) => ($(el).attr("content") ?? "").replace(/\s+/g, " ").trim()).get();
  const description = descriptions[0] || null;
  if (!description) add(ctx, { id: "description", category: "Content", impact: 5, severity: "warning", title: "Missing meta description", detail: "Google will improvise a snippet from page text, which often reads badly.", fix: "Write a compelling 70–160 character description that states what the page offers." });
  else if (description.length < 70) add(ctx, { id: "description", category: "Content", impact: 5, severity: "warning", title: `Meta description is short (${description.length} chars)`, detail: description, fix: "Use 70–160 characters to describe the page and invite the click." });
  else if (description.length > 160) add(ctx, { id: "description", category: "Content", impact: 5, severity: "info", title: `Meta description may be truncated (${description.length} chars)`, detail: description, fix: "Keep it under about 160 characters (≈920 px)." });
  else add(ctx, { id: "description", category: "Content", impact: 5, severity: "pass", title: `Meta description length is good (${description.length} chars)`, detail: description });
  if (descriptions.length > 1) add(ctx, { id: "description-dup", category: "Content", impact: 2, severity: "warning", title: `${descriptions.length} meta descriptions`, detail: "Only one is used; which one is unpredictable.", fix: "Keep a single meta description.", items: descriptions.map((d) => d || "(empty)") });
  if (title && description && title.toLowerCase() === description.toLowerCase()) add(ctx, { id: "description-same", category: "Content", impact: 1, severity: "info", title: "Description repeats the title", detail: title, fix: "Use the description to add information the title doesn't." });

  const h1 = $("h1").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get();
  const h1Text = h1.filter(Boolean);
  if (h1.length === 0) add(ctx, { id: "h1", category: "Content", impact: 6, severity: "error", title: "No H1 heading", detail: "The page has no primary heading.", fix: "Add exactly one H1 that states the page topic." });
  else if (h1Text.length === 0) add(ctx, { id: "h1", category: "Content", impact: 6, severity: "error", title: "H1 is empty", detail: "The H1 has no text (often an image or logo without alt text).", fix: "Put the page topic in the H1 as text." });
  else if (h1.length > 1) add(ctx, { id: "h1", category: "Content", impact: 6, severity: "warning", title: `${h1.length} H1 headings`, detail: "Several H1s blur what the page is about.", fix: "Keep one H1 for the topic and use H2–H6 for sections.", items: h1.map((h) => h || "(empty)") });
  else add(ctx, { id: "h1", category: "Content", impact: 6, severity: "pass", title: "Exactly one H1", detail: h1[0] });

  const wc = ctx.wordCount;
  if (wc < 300) add(ctx, { id: "words", category: "Content", impact: 6, severity: wc < 100 ? "warning" : "info", title: `Thin content (${wc} words)`, detail: "Pages with little text rarely rank for anything competitive and give AI answers nothing to quote.", fix: "Expand with useful, original information that answers the searcher's question." });
  else add(ctx, { id: "words", category: "Content", impact: 6, severity: "pass", title: `${wc.toLocaleString()} words of content`, detail: "Substantial on-page text." });

  // Text vs HTML weight: very low ratios usually mean bloated markup or content rendered client-side.
  const ratio = ctx.input.html.length ? ctx.bodyText.length / ctx.input.html.length : 0;
  if (ctx.input.html.length > 20_000 && ratio < 0.05) add(ctx, { id: "text-ratio", category: "Content", impact: 1, severity: "info", title: `Low text-to-HTML ratio (${(ratio * 100).toFixed(1)}%)`, detail: `${Math.round(ctx.bodyText.length / 1024)} KB of text in ${Math.round(ctx.input.html.length / 1024)} KB of HTML.`, fix: "Trim inline scripts/styles and markup bloat, and make sure the main content is in the HTML." });

  const root = mainRoot(ctx);
  const mainWords = root ? words(root.clone().find("script,style,noscript,svg,nav").remove().end().text()) : wc;
  let leadParagraph: string | null = null;
  (root ?? ctx.$("body")).find("p").each((_, el) => {
    const t = ctx.$(el).text().replace(/\s+/g, " ").trim();
    if (words(t) >= 20) {
      leadParagraph = clip(t, 300);
      return false;
    }
  });
  return { title, titles, description, descriptions, h1, mainWords, leadParagraph };
}
