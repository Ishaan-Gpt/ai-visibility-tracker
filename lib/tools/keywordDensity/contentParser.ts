export type ParsedContent = {
  body: string;
  headings: string[];
};

/**
 * Detects and extracts HTML `<h1-6>` tags and Markdown `#`-style headings
 * into a separate list, then strips markup from the remainder — so heading
 * placement checks work correctly and heading text doesn't get double-
 * counted in the body's word/sentence analysis.
 */
export function parseContent(raw: string): ParsedContent {
  const headings: string[] = [];
  let text = raw;

  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_match, inner: string) => {
    const clean = inner.replace(/<[^>]+>/g, "").trim();
    if (clean) headings.push(clean);
    return " ";
  });

  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text.replace(/<[^>]+>/g, " ");
  }

  const bodyLines: string[] = [];
  for (const line of text.split("\n")) {
    const mdHeadingMatch = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (mdHeadingMatch) {
      const headingText = mdHeadingMatch[1].trim();
      if (headingText) headings.push(headingText);
      continue;
    }
    bodyLines.push(line);
  }

  return { body: bodyLines.join("\n"), headings };
}
