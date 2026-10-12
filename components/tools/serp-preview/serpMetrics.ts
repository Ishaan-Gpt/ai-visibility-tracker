/**
 * Pixel-accurate (as far as a browser can be) Google snippet layout.
 *
 * Everything here is pure: callers pass a `measure(text, font)` function backed by a
 * canvas 2D context, so the numbers come from the user's own browser and its Arial.
 * Google renders desktop results in Arial and changes widths / fonts from time to time,
 * so every number below is an estimate. Treat ±10px as noise.
 */

export type Measure = (text: string, font: string) => number;

export const SERP_FONT = "Arial, Helvetica, sans-serif";

/** The numbers used everywhere (UI, meters, "How we measure"). */
export const SERP = {
  desktop: {
    /** Title: 20px Arial, one line, cut at 600px. */
    titleSize: 20,
    titleWidth: 600,
    /** Description: 14px Arial in a 600px column, ~920px total (about two lines), clamped to 2 lines. */
    descSize: 14,
    descColumn: 600,
    descBudget: 920,
    descLines: 2,
    urlSize: 12,
    urlWidth: 520,
  },
  mobile: {
    /** 360px viewport minus 16px padding each side. Google uses its own font on mobile; 18px Arial approximates it. */
    viewport: 360,
    titleSize: 18,
    titleColumn: 328,
    titleLines: 2,
    descSize: 14,
    descColumn: 328,
    descBudget: 680,
    descLines: 3,
    urlSize: 12,
    urlWidth: 250,
  },
  /** Below these a title / description wastes space Google would give you. */
  shortTitlePx: 250,
  shortDescPx: 400,
  shortDescChars: 70,
} as const;

export function serpFont(size: number, bold = false) {
  return `${bold ? "bold " : ""}${size}px ${SERP_FONT}`;
}

/** A styled stretch of text. `muted` is the grey date prefix, `bold` a query match. */
export interface Run {
  text: string;
  bold?: boolean;
  muted?: boolean;
}

interface Tok {
  text: string;
  bold: boolean;
  muted: boolean;
  w: number;
  space: boolean;
  ell?: boolean;
}

export interface Layout {
  /** Lines to draw, each a list of merged runs. */
  lines: Run[][];
  truncated: boolean;
  /** Width of the whole, untruncated text. */
  usedPx: number;
  /** The budget this field is judged against. */
  limitPx: number;
  /** Positive: pixels still free. Negative: pixels that did not fit. */
  remainingPx: number;
  /** Text Google would show (no styling). */
  shown: string;
  lineCount: number;
}

export function collapse(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function tokens(runs: Run[], size: number, measure: Measure): Tok[] {
  const out: Tok[] = [];
  for (const r of runs) {
    const font = serpFont(size, !!r.bold);
    for (const part of r.text.split(/(\s+)/)) {
      if (!part) continue;
      const space = /^\s+$/.test(part);
      const text = space ? " " : part;
      out.push({ text, bold: !!r.bold, muted: !!r.muted, w: measure(text, font), space });
    }
  }
  return out;
}

const sum = (t: Tok[]) => t.reduce((s, x) => s + x.w, 0);

function trimEnd(t: Tok[]) {
  const c = [...t];
  while (c.length && c[c.length - 1].space) c.pop();
  return c;
}

function ellTok(text: string, size: number, measure: Measure): Tok {
  return { text, bold: false, muted: false, w: measure(text, serpFont(size)), space: false, ell: true };
}

/**
 * Cuts tokens so that `kept + ellipsis` fits `budget`. Prefers a word boundary; falls back to a
 * character cut when the word cut would waste more than 30% of the budget (one very long word).
 */
function fit(all: Tok[], budget: number, ell: string, size: number, measure: Measure): { toks: Tok[]; truncated: boolean } {
  const toks = all.filter((t) => !t.ell);
  if (sum(toks) <= budget) return { toks, truncated: false };
  const e = ellTok(ell, size, measure);
  const room = budget - e.w;
  let acc = 0;
  let lastWordEnd = -1;
  let i = 0;
  for (; i < toks.length; i++) {
    if (acc + toks[i].w > room) break;
    acc += toks[i].w;
    if (!toks[i].space) lastWordEnd = i;
  }
  const wordCut = trimEnd(toks.slice(0, lastWordEnd + 1));
  const wordW = sum(wordCut);
  // `i` is the first token that did not fit. If it is a word, we may cut inside it.
  if (lastWordEnd >= 0 && wordW >= room * 0.7) {
    return { toks: [...wordCut, e], truncated: true };
  }
  const head = toks.slice(0, i);
  const next = toks[i];
  if (next && !next.space) {
    const font = serpFont(size, next.bold);
    let chars = "";
    for (const ch of Array.from(next.text)) {
      const w = measure(chars + ch, font);
      if (acc + w > room) break;
      chars += ch;
    }
    if (chars) head.push({ ...next, text: chars, w: measure(chars, font) });
  }
  const kept = trimEnd(head);
  // A character cut glues the ellipsis to the word ("Optimizat...").
  const glued = ellTok(ell.trimStart(), size, measure);
  return { toks: [...kept, glued], truncated: true };
}

/** Greedy word wrap into `column`, at most `maxLines`; the last line is cut with an ellipsis. */
function wrap(all: Tok[], column: number, maxLines: number, ell: string, size: number, measure: Measure): { lines: Tok[][]; truncated: boolean } {
  const lines: Tok[][] = [];
  let line: Tok[] = [];
  let w = 0;
  const flush = () => {
    lines.push(trimEnd(line));
    line = [];
    w = 0;
  };
  const queue = [...all];
  while (queue.length) {
    const t = queue.shift()!;
    if (t.space && line.length === 0) continue;
    if (w + t.w <= column) {
      line.push(t);
      w += t.w;
      continue;
    }
    if (t.space) {
      flush();
      continue;
    }
    if (line.length === 0) {
      // A single word wider than the column: break it by characters.
      const font = serpFont(size, t.bold);
      let chars = "";
      const arr = Array.from(t.text);
      let k = 0;
      for (; k < arr.length; k++) {
        if (measure(chars + arr[k], font) > column) break;
        chars += arr[k];
      }
      if (!chars) {
        chars = arr[0];
        k = 1;
      }
      line.push({ ...t, text: chars, w: measure(chars, font) });
      flush();
      const rest = arr.slice(k).join("");
      if (rest) queue.unshift({ ...t, text: rest, w: measure(rest, font) });
      continue;
    }
    flush();
    queue.unshift(t);
  }
  if (line.length) flush();
  const clean = lines.filter((l) => l.length);
  if (clean.length <= maxLines) return { lines: clean, truncated: all.some((t) => t.ell) };
  const keep = clean.slice(0, maxLines - 1);
  const rest = clean.slice(maxLines - 1).flatMap((l, idx) => (idx === 0 ? l : [{ text: " ", bold: false, muted: false, w: measure(" ", serpFont(size)), space: true }, ...l]));
  const last = fit(rest, column, ell, size, measure);
  return { lines: [...keep, last.toks], truncated: true };
}

function merge(line: Tok[]): Run[] {
  const out: Run[] = [];
  for (const t of line) {
    const prev = out[out.length - 1];
    if (prev && !!prev.bold === t.bold && !!prev.muted === t.muted) prev.text += t.text;
    else out.push({ text: t.text, bold: t.bold || undefined, muted: t.muted || undefined });
  }
  return out;
}

const textOf = (lines: Tok[][]) => lines.map((l) => l.map((t) => t.text).join("")).join(" ");

/** One line with a hard pixel budget (desktop title). */
export function layoutSingleLine(runs: Run[], size: number, width: number, measure: Measure, ell = "..."): Layout {
  const toks = tokens(runs, size, measure);
  const used = sum(toks);
  const r = fit(toks, width, ell, size, measure);
  return {
    lines: [merge(r.toks)],
    truncated: r.truncated,
    usedPx: used,
    limitPx: width,
    remainingPx: width - used,
    shown: textOf([r.toks]),
    lineCount: 1,
  };
}

/**
 * Wrapping text with an optional total budget (descriptions) and a line clamp.
 * `remainingPx` is the stricter of the two limits.
 */
export function layoutWrapped(
  runs: Run[],
  opts: { size: number; column: number; maxLines: number; budget?: number },
  measure: Measure,
  ell = " ...",
): Layout {
  const { size, column, maxLines, budget } = opts;
  const toks = tokens(runs, size, measure);
  const used = sum(toks);
  const budgeted = budget ? fit(toks, budget, ell, size, measure) : { toks, truncated: false };
  const wrapped = wrap(budgeted.toks, column, maxLines, ell, size, measure);
  const truncated = budgeted.truncated || wrapped.truncated;

  const lineW = wrapped.lines.map((l) => sum(l));
  let remaining: number;
  if (!truncated) {
    const wrapLeft = (maxLines - wrapped.lines.length) * column + (column - (lineW[lineW.length - 1] ?? 0));
    remaining = budget ? Math.min(budget - used, wrapLeft) : wrapLeft;
  } else {
    const shownW = sum(wrapped.lines.flat().filter((t) => !t.ell));
    remaining = -Math.max(1, used - shownW);
  }
  return {
    lines: wrapped.lines.map(merge),
    truncated,
    usedPx: used,
    limitPx: budget ?? column * maxLines,
    remainingPx: Math.round(remaining),
    shown: textOf(wrapped.lines),
    lineCount: wrapped.lines.length,
  };
}

/* ---------------- query bolding ---------------- */

const STOP = new Set("a an and are as at be by for from how in is it of on or the to with what why your you vs".split(" "));

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits text into runs with query terms bolded, the way Google bolds query words in snippets
 * (whole words, case-insensitive, simple plural forms). Titles are never bolded.
 */
export function boldQuery(text: string, query: string): Run[] {
  const q = collapse(query.toLowerCase());
  if (!q) return [{ text }];
  const words = q.split(" ").filter((w) => w.length > 1);
  const terms = words.length > 1 ? words.filter((w) => !STOP.has(w)) : words;
  const parts = [...new Set([q, ...terms])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!parts.length) return [{ text }];
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts.map((p) => `${escapeRe(p)}(?:e?s)?`).join("|")})(?![\\p{L}\\p{N}])`, "giu");
  const out: Run[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at) });
    out.push({ text: m[0], bold: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text }];
}

/* ---------------- URL + date ---------------- */

export function parseUrl(raw: string): URL | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`);
  } catch {
    return null;
  }
}

function decode(seg: string) {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/** Google's breadcrumb line: `https://www.site.com › seg › seg`, query and hash dropped, long trails cut with "...". */
export function breadcrumb(raw: string, maxPx: number, size: number, measure: Measure): { origin: string; trail: string } {
  const u = parseUrl(raw);
  if (!u) return { origin: raw.trim() || "https://example.com", trail: "" };
  const origin = `${u.protocol}//${u.host}`;
  const segs = u.pathname.split("/").filter(Boolean).map(decode);
  let trail = segs.map((s) => ` › ${s}`).join("");
  const font = serpFont(size);
  const ow = measure(origin, font);
  if (ow + measure(trail, font) > maxPx) {
    let cut = trail;
    while (cut.length > 0 && ow + measure(`${cut}...`, font) > maxPx) cut = cut.slice(0, -1);
    trail = `${cut.trimEnd()}...`;
  }
  return { origin, trail };
}

/** "Oct 12, 2026" (Google's US English format), or null when the string is not a date. */
export function serpDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00Z` : s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** yyyy-mm-dd for <input type="date">. */
export function isoDay(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/* ---------------- the whole snippet ---------------- */

export interface SnippetInput {
  title: string;
  description: string;
  url: string;
  keyword: string;
  /** Formatted date ("Oct 12, 2026") or null when hidden. */
  date: string | null;
}

export interface Snippet {
  title: Layout;
  description: Layout;
  crumb: { origin: string; trail: string };
  /** Description length without the date prefix, for meters. */
  descTextPx: number;
}

export type Device = "desktop" | "mobile";

export function layoutSnippet(input: SnippetInput, device: Device, measure: Measure): Snippet {
  const title = collapse(input.title);
  const desc = collapse(input.description);
  const runs: Run[] = [...(input.date && desc ? [{ text: `${input.date} — `, muted: true }] : []), ...boldQuery(desc, input.keyword)];
  if (device === "desktop") {
    const d = SERP.desktop;
    const descLayout = layoutWrapped(runs, { size: d.descSize, column: d.descColumn, maxLines: d.descLines, budget: d.descBudget }, measure);
    return {
      title: layoutSingleLine([{ text: title }], d.titleSize, d.titleWidth, measure),
      description: descLayout,
      crumb: breadcrumb(input.url, d.urlWidth, d.urlSize, measure),
      descTextPx: descLayout.usedPx,
    };
  }
  const m = SERP.mobile;
  const descLayout = layoutWrapped(runs, { size: m.descSize, column: m.descColumn, maxLines: m.descLines, budget: m.descBudget }, measure);
  return {
    title: layoutWrapped([{ text: title }], { size: m.titleSize, column: m.titleColumn, maxLines: m.titleLines }, measure, "..."),
    description: descLayout,
    crumb: breadcrumb(input.url, m.urlWidth, m.urlSize, measure),
    descTextPx: descLayout.usedPx,
  };
}

export type MeterState = "good" | "short" | "over" | "empty";

export function titleState(l: Layout): MeterState {
  if (l.usedPx === 0) return "empty";
  if (l.truncated) return "over";
  return l.usedPx < SERP.shortTitlePx ? "short" : "good";
}

export function descState(l: Layout, chars: number): MeterState {
  if (l.usedPx === 0) return "empty";
  if (l.truncated) return "over";
  return l.usedPx < SERP.shortDescPx || chars < SERP.shortDescChars ? "short" : "good";
}
