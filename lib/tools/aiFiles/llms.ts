/**
 * llms.txt parser + validator per https://llmstxt.org :
 *   # Name                       (required, first)
 *   > One-paragraph summary      (optional blockquote)
 *   free-form details            (optional, no headings)
 *   ## Section                   (zero or more H2 "file lists")
 *   - [Title](https://url): notes
 *   ## Optional                  (links that can be skipped when context is short)
 * Pure TypeScript: used by the crawler check (server) and the generator (browser).
 */

export type LlmsIssueLevel = "error" | "warning" | "info";
export interface LlmsIssue {
  level: LlmsIssueLevel;
  line: number | null;
  message: string;
}
export interface ParsedLlmsLink {
  title: string;
  url: string;
  notes: string;
  line: number;
}
export interface ParsedLlmsSection {
  title: string;
  line: number;
  optional: boolean;
  links: ParsedLlmsLink[];
}
export interface LlmsValidation {
  title: string | null;
  summary: string | null;
  details: string;
  sections: ParsedLlmsSection[];
  linkCount: number;
  issues: LlmsIssue[];
  /** Totals before repeated issues were folded together. */
  counts?: Record<LlmsIssueLevel, number>;
  /** No errors (warnings allowed). */
  valid: boolean;
}

const LINK_RE = /^[-*+]\s+\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)\s*(?::\s*(.*))?$/;

export function validateLlmsTxt(text: string, opts: { origin?: string } = {}): LlmsValidation {
  const issues: LlmsIssue[] = [];
  const src = (text ?? "").replace(/^\uFEFF/, "");
  const lines = src.split(/\r\n|\r|\n/);
  let title: string | null = null;
  const summaryLines: string[] = [];
  const detailLines: string[] = [];
  const sections: ParsedLlmsSection[] = [];
  let current: ParsedLlmsSection | null = null;
  let firstContentSeen = false;
  let phase: "start" | "summary" | "details" | "sections" = "start";
  let inFence = false;
  const seenUrls = new Map<string, number>();

  if (/^\s*<(!doctype|html|head|body)/i.test(src.slice(0, 500))) {
    issues.push({ level: "error", line: 1, message: "This is an HTML page, not a Markdown llms.txt." });
    return { title: null, summary: null, details: "", sections: [], linkCount: 0, issues, valid: false };
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    const line = raw.trim();
    if (/^```/.test(line)) inFence = !inFence;
    if (!line) {
      if (phase === "summary") phase = "details";
      continue;
    }
    if (inFence && !/^```/.test(line)) {
      if (phase === "sections") {
        if (current) issues.push({ level: "warning", line: lineNo, message: `Code block inside "${current.title}". Sections should be link lists.` });
      } else detailLines.push(raw);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (!firstContentSeen) {
      firstContentSeen = true;
      if (!h || h[1].length !== 1) {
        issues.push({ level: "error", line: lineNo, message: "The file must start with an H1 (\"# Site name\"). It is the only required element." });
      }
    }

    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      if (level === 1) {
        if (title === null) {
          title = text;
          if (!text) issues.push({ level: "error", line: lineNo, message: "The H1 is empty. Put your site or project name there." });
          phase = "summary";
        } else issues.push({ level: "warning", line: lineNo, message: "Only one H1 is expected. Use H2 for sections." });
        continue;
      }
      if (level === 2) {
        current = { title: text, line: lineNo, optional: text.toLowerCase() === "optional", links: [] };
        sections.push(current);
        phase = "sections";
        continue;
      }
      issues.push({
        level: "warning",
        line: lineNo,
        message: phase === "sections" ? `H${level} headings are not part of the format. Use H2 sections with link lists.` : `Headings other than the H1 are not expected before the first H2 section.`,
      });
      continue;
    }

    if (phase === "summary" || (phase === "start" && line.startsWith(">"))) {
      if (line.startsWith(">")) {
        summaryLines.push(line.replace(/^>\s?/, ""));
        continue;
      }
      phase = "details";
    }

    if (phase === "details" || phase === "start") {
      if (line.startsWith(">") && summaryLines.length === 0 && detailLines.length === 0) {
        summaryLines.push(line.replace(/^>\s?/, ""));
        continue;
      }
      detailLines.push(raw);
      continue;
    }

    // Inside an H2 section: expect "- [title](url): notes".
    if (!current) continue;
    const m = line.match(LINK_RE);
    if (!m) {
      if (/^[-*+]\s+/.test(line)) issues.push({ level: "info", line: lineNo, message: `List item without a Markdown link. The format expects "- [Title](https://…): notes".` });
      else issues.push({ level: "info", line: lineNo, message: `Prose inside "${current.title}". The format expects only link lists in H2 sections.` });
      continue;
    }
    const [, linkTitle, url, notes] = m;
    current.links.push({ title: linkTitle.trim(), url, notes: (notes ?? "").trim(), line: lineNo });
    if (!/^https?:\/\//i.test(url)) {
      issues.push({
        level: "warning",
        line: lineNo,
        message: `Link "${url.slice(0, 60)}" is not an absolute URL. Tools reading llms.txt out of context cannot resolve it${opts.origin ? ` (would be ${safeJoin(opts.origin, url)})` : ""}.`,
      });
    }
    const key = url.replace(/\/$/, "");
    if (seenUrls.has(key)) issues.push({ level: "info", line: lineNo, message: `Duplicate link (also on line ${seenUrls.get(key)}).` });
    else seenUrls.set(key, lineNo);
  }

  if (title !== null && summaryLines.length === 0) {
    issues.push({ level: "info", line: null, message: "No blockquote summary after the H1. A one-paragraph \"> summary\" is recommended." });
  }
  for (const s of sections) {
    if (s.links.length === 0) issues.push({ level: "info", line: s.line, message: `Section "${s.title || "(untitled)"}" has no links. H2 sections are meant to be link lists; put prose before the first H2.` });
    if (!s.title) issues.push({ level: "warning", line: s.line, message: "Empty H2 section title." });
  }
  const linkCount = sections.reduce((n, s) => n + s.links.length, 0);
  if (title !== null && sections.length === 0) {
    issues.push({ level: "warning", line: null, message: "No H2 sections with links. Without them, AI tools get no map of your key pages." });
  }
  const optionalIdx = sections.findIndex((s) => s.optional);
  if (optionalIdx !== -1 && optionalIdx !== sections.length - 1) {
    issues.push({ level: "info", line: sections[optionalIdx].line, message: "The \"Optional\" section is conventionally last; tools may drop everything in it when context is short." });
  }
  const bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(src).length : src.length;
  if (bytes > 200_000) issues.push({ level: "warning", line: null, message: `File is ${Math.round(bytes / 1024)} KB. llms.txt should be a concise index; put full content in llms-full.txt.` });

  issues.sort((a, b) => rank(a.level) - rank(b.level) || (a.line ?? 0) - (b.line ?? 0));
  return {
    title,
    summary: summaryLines.length ? summaryLines.join(" ").trim() : null,
    details: detailLines.join("\n").trim(),
    sections,
    linkCount,
    issues: collapse(issues),
    counts: { error: issues.filter((x) => x.level === "error").length, warning: issues.filter((x) => x.level === "warning").length, info: issues.filter((x) => x.level === "info").length },
    valid: !issues.some((x) => x.level === "error"),
  };
}

/** Keeps the first 3 issues of each kind and folds the rest into a single "and N more" note. */
function collapse(issues: LlmsIssue[]): LlmsIssue[] {
  const kind = (m: string) => m.replace(/"[^"]*"/g, "\"\"").replace(/\d+/g, "#");
  const seen = new Map<string, number>();
  const out: LlmsIssue[] = [];
  const extra = new Map<string, { first: LlmsIssue; count: number }>();
  for (const i of issues) {
    const k = `${i.level}|${kind(i.message)}`;
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    if (n <= 3) out.push(i);
    else extra.set(k, { first: i, count: (extra.get(k)?.count ?? 0) + 1 });
  }
  for (const { first, count } of extra.values()) {
    out.push({ level: first.level, line: null, message: `…and ${count} more like: ${first.message}` });
  }
  return out.sort((a, b) => rank(a.level) - rank(b.level));
}

function rank(l: LlmsIssueLevel) {
  return l === "error" ? 0 : l === "warning" ? 1 : 2;
}

function safeJoin(origin: string, path: string): string {
  try {
    return new URL(path, origin).href;
  } catch {
    return path;
  }
}
