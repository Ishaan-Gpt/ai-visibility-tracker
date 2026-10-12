import type { PageExtract } from "@/lib/tools/pageExtract/types";
import { splitParagraphs } from "@/lib/tools/keywordDensity/tokenizer";

/** One block of body content, in reading order. Headings are blocks too. */
export type DocBlock = {
  type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "li" | "blockquote" | "pre" | "td" | "caption" | "other";
  text: string;
};

/**
 * The normalised document every analysis runs on, whether it came from pasted text or a fetched page.
 * Fields that only a live URL can provide are null for pasted text.
 */
export type DocInput = {
  source: "paste" | "url";
  /** <title> (URL mode only). */
  title: string | null;
  metaDescription: string | null;
  url: string | null;
  /** H1 text(s). In paste mode: a markdown "# " heading, an HTML <h1>, or a short first line. */
  h1: string[];
  /** How the H1 was found in paste mode, so the UI can say so. */
  h1Origin: "markup" | "first-line" | "page" | null;
  blocks: DocBlock[];
  /** Image alt texts (URL mode only). null alt = attribute missing. */
  images: { src: string; alt: string | null }[] | null;
  /** Where the main content came from (URL mode). */
  contentSource: PageExtract["content"]["source"] | null;
  lang: string | null;
};

export const isHeading = (t: DocBlock["type"]) => /^h[1-6]$/.test(t);

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));

/**
 * Turns pasted text (plain, Markdown or HTML) into blocks.
 * - Markdown "#".."######" and HTML <h1>-<h6> become headings.
 * - "- ", "* ", "1. " lines and <li> become list items.
 * - Everything else is split into paragraphs (blank lines, or single line breaks unless hard-wrapped).
 * - If there is no explicit H1 and the first line is short with no closing punctuation, it is treated as the H1.
 */
export function docFromPaste(raw: string): DocInput {
  let text = raw.replace(/\r\n?/g, "\n");
  const isHtml = /<\/?(?:p|div|h[1-6]|li|ul|ol|br|span|a|strong|em|article|section)\b[^>]*>/i.test(text);
  if (isHtml) {
    text = text
      .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, l: string, inner: string) => `\n\n${"#".repeat(Number(l))} ${inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n\n`)
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner: string) => `\n- ${inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|blockquote|tr|table|ul|ol)>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ");
    text = decodeEntities(text);
  }

  const blocks: DocBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    for (const p of splitParagraphs(para.join("\n"))) blocks.push({ type: "p", text: p.replace(/[ \t]+/g, " ") });
    para = [];
  };
  for (const line of text.split("\n")) {
    const l = line.trim();
    const h = l.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    const li = l.match(/^(?:[-*•+]|\d{1,3}[.)])\s+(.+)$/);
    if (h) {
      flush();
      blocks.push({ type: `h${h[1].length}` as DocBlock["type"], text: stripInlineMarkdown(h[2]) });
    } else if (li) {
      flush();
      blocks.push({ type: "li", text: stripInlineMarkdown(li[1]) });
    } else if (!l) {
      flush();
    } else {
      para.push(stripInlineMarkdown(l));
    }
  }
  flush();

  let h1 = blocks.filter((b) => b.type === "h1").map((b) => b.text);
  let h1Origin: DocInput["h1Origin"] = h1.length ? "markup" : null;
  if (!h1.length && blocks.length > 1 && blocks[0].type === "p") {
    const first = blocks[0].text;
    const words = first.split(/\s+/).length;
    if (words <= 14 && !/[.!?,;:]$/.test(first)) {
      blocks[0] = { type: "h1", text: first };
      h1 = [first];
      h1Origin = "first-line";
    }
  }

  return { source: "paste", title: null, metaDescription: null, url: null, h1, h1Origin, blocks, images: null, contentSource: null, lang: null };
}

function stripInlineMarkdown(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|\s)[*_](\S[^*_]*?)[*_](?=\s|$|[.,;:!?])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/** Builds the document from a fetched page: main content blocks plus page context. */
export function docFromPage(page: PageExtract): DocInput {
  const blocks: DocBlock[] = page.content.blocks.filter((b) => b.text.trim()).map((b) => ({ type: b.type, text: b.text.replace(/\s+/g, " ").trim() }));
  const docH1 = page.headings.filter((h) => h.level === 1).map((h) => h.text.trim()).filter(Boolean);
  const contentH1 = blocks.filter((b) => b.type === "h1").map((b) => b.text);
  const h1 = docH1.length ? docH1 : contentH1;
  // If the H1 sits outside the extracted main content (common), put it in front so headings/sections line up.
  if (h1.length && !contentH1.length) blocks.unshift({ type: "h1", text: h1[0] });
  return {
    source: "url",
    title: page.titles[0]?.trim() || null,
    metaDescription: page.metaDescriptions[0]?.trim() || null,
    url: page.finalUrl || page.requestedUrl,
    h1,
    h1Origin: h1.length ? "page" : null,
    blocks,
    images: page.content.images.map((i) => ({ src: i.src, alt: i.alt })),
    contentSource: page.content.source,
    lang: page.lang,
  };
}

/** Subheadings (H2-H3) of the document: from the content blocks. */
export function subheadings(doc: DocInput): string[] {
  return doc.blocks.filter((b) => b.type === "h2" || b.type === "h3").map((b) => b.text);
}

/** Words of the URL slug ("/blog/green-tea-weight-loss/" → "green tea weight loss"). */
export function slugText(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    if (!segs.length) return "";
    return decodeURIComponent(segs.join(" ")).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_+.]/g, " ").trim();
  } catch {
    return null;
  }
}
