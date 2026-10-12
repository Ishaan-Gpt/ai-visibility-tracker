import { docFromPaste, isHeading } from "@/lib/tools/keywordDensity/document";

export type ParsedContent = {
  body: string;
  headings: string[];
};

/**
 * Splits pasted text (plain, Markdown or HTML) into heading texts and body text, so heading
 * placement checks work and heading text isn't double-counted in body-only measures.
 * Thin wrapper over `docFromPaste`, kept for existing callers.
 */
export function parseContent(raw: string): ParsedContent {
  const doc = docFromPaste(raw);
  // A first line promoted to H1 by the heuristic stays in the body here (legacy behaviour: only explicit markup is a heading).
  const inferred = doc.h1Origin === "first-line" ? doc.blocks[0] : null;
  const headings = doc.blocks.filter((b) => isHeading(b.type) && b !== inferred).map((b) => b.text);
  const body = doc.blocks
    .filter((b) => !isHeading(b.type) || b === inferred)
    .map((b) => b.text)
    .join("\n\n");
  return { body, headings };
}
