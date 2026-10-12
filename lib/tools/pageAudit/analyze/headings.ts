import { add, clip, evidence, type Ctx } from "./context";

export function headings(ctx: Ctx): { level: number; text: string }[] {
  const { $ } = ctx;
  const outline = $("h1,h2,h3,h4,h5,h6")
    .map((_, el) => ({ level: Number(el.tagName.slice(1)), text: clip($(el).text(), 150) }))
    .get();

  const empty = outline.filter((h) => !h.text).map((h) => `Empty H${h.level}`);
  const skips: string[] = [];
  let prev = 0;
  for (const h of outline) {
    if (prev && h.level > prev + 1) skips.push(`H${prev} → H${h.level}: "${h.text || "(empty)"}"`);
    prev = h.level;
  }
  const firstNotH1 = outline.length > 0 && outline[0].level !== 1 && outline.some((h) => h.level === 1);

  if (!outline.length) {
    add(ctx, { id: "headings", category: "Content", impact: 3, severity: "warning", title: "No headings at all", detail: "Without headings, search engines and AI systems can't see the page's structure.", fix: "Structure the page with one H1 and descriptive H2/H3 section headings." });
  } else if (skips.length || empty.length) {
    add(ctx, {
      id: "headings",
      category: "Content",
      impact: 3,
      severity: empty.length ? "warning" : "info",
      title: [skips.length && `${skips.length} skipped heading level${skips.length > 1 ? "s" : ""}`, empty.length && `${empty.length} empty heading${empty.length > 1 ? "s" : ""}`].filter(Boolean).join(", "),
      detail: "A clean outline (H1 → H2 → H3) helps screen readers, search engines and AI systems understand sections.",
      fix: "Don't skip levels (H2 → H4) and remove or fill empty heading tags. Style with CSS, not heading levels.",
      items: evidence([...empty, ...skips]),
    });
  } else {
    add(ctx, { id: "headings", category: "Content", impact: 3, severity: "pass", title: `Clean heading outline (${outline.length} headings)`, detail: "No skipped levels or empty headings." });
  }
  if (firstNotH1) add(ctx, { id: "headings-order", category: "Content", impact: 1, severity: "info", title: `First heading is an H${outline[0].level}`, detail: `"${outline[0].text}" comes before the H1.`, fix: "Make the H1 the first heading in the content (logos and nav labels shouldn't be headings)." });
  return outline.slice(0, 300);
}
