import { type HtmlSitemapEntry, UNGROUPED_SECTION_LABEL, deriveLabel } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type GroupedSection = { section: string; entries: HtmlSitemapEntry[] };

/** Groups entries by section, alphabetizes named sections, and always places ungrouped entries last. */
export function groupEntries(entries: HtmlSitemapEntry[]): GroupedSection[] {
  const valid = entries.filter((e) => e.url.trim() !== "");
  const groups = new Map<string, HtmlSitemapEntry[]>();

  for (const entry of valid) {
    const key = entry.section.trim() || UNGROUPED_SECTION_LABEL;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  const namedSections = Array.from(groups.keys())
    .filter((key) => key !== UNGROUPED_SECTION_LABEL)
    .sort((a, b) => a.localeCompare(b));
  const orderedKeys = groups.has(UNGROUPED_SECTION_LABEL) ? [...namedSections, UNGROUPED_SECTION_LABEL] : namedSections;

  return orderedKeys.map((section) => ({
    section,
    entries: [...groups.get(section)!].sort((a, b) =>
      (a.label.trim() || deriveLabel(a.url)).localeCompare(b.label.trim() || deriveLabel(b.url)),
    ),
  }));
}

function renderSectionsHtml(grouped: GroupedSection[]): string {
  return grouped
    .map((group) => {
      const items = group.entries
        .map((e) => `      <li><a href="${escapeHtml(e.url)}">${escapeHtml(e.label.trim() || deriveLabel(e.url))}</a></li>`)
        .join("\n");
      return `    <section>\n      <h2>${escapeHtml(group.section)}</h2>\n      <ul>\n${items}\n      </ul>\n    </section>`;
    })
    .join("\n");
}

/** Plain semantic markup meant to inherit the host page's own styling — no document wrapper, no inline CSS. */
export function generateEmbedSnippet(entries: HtmlSitemapEntry[]): string {
  const grouped = groupEntries(entries);
  return `<nav aria-label="Sitemap">\n${renderSectionsHtml(grouped)}\n</nav>`;
}

/** A complete, hostable HTML document with minimal inline CSS so it looks presentable even without a host stylesheet. */
export function generateStandalonePage(entries: HtmlSitemapEntry[], siteName = "Sitemap"): string {
  const grouped = groupEntries(entries);
  const nav = renderSectionsHtml(grouped);
  const title = escapeHtml(siteName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Sitemap</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 880px; margin: 0 auto; padding: 48px 24px; color: #1a1a1a; background: #fff; }
    h1 { font-size: 28px; margin-bottom: 32px; }
    h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin: 32px 0 12px; }
    section:first-of-type h2 { margin-top: 0; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { margin-bottom: 8px; }
    a { color: #0645ad; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${title} — Sitemap</h1>
  <nav aria-label="Sitemap">
${nav}
  </nav>
</body>
</html>`;
}

export function minifyHtml(html: string): string {
  return html.replace(/>\s+</g, "><").trim();
}
