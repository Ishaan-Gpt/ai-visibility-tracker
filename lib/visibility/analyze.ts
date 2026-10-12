/**
 * Pure answer analysis: brand matching, position, citations. No I/O, so it is unit-testable and runs anywhere.
 *
 * Matching rules (deliberately stricter than "substring of the name"):
 *  - Text is folded: diacritics stripped (Café -> cafe), case-folded, typographic quotes/dashes normalised.
 *  - A term only matches on word boundaries (Unicode letters/digits), so "Apple" never matches "pineapple".
 *  - Spaces and hyphens inside a term are interchangeable and optional: "Acme Dental" matches "Acme-Dental"
 *    and "AcmeDental". Apostrophes are optional: "McDonald's" matches "McDonalds".
 *  - Single-word names typed with a capital letter ("Apple", "Notion") ignore all-lowercase occurrences
 *    ("apple pie", "the notion of"), because answers capitalise brand names. Type the name in lowercase
 *    to turn this off for brands styled lowercase.
 *  - The domain (acme.com) matches as its own term; the bare domain root ("acme") is never matched on its own.
 *  - Citations match on the registrable domain (blog.acme.co.uk counts for acme.co.uk), or on the exact host
 *    when the tracked domain is itself a subdomain (cloud.google.com is not google.com).
 */
import { hostOf, registrableDomain } from "./domains";
import type { Citation, Competitor } from "@/lib/types";

/* ---------------- folding ---------------- */

export interface Folded {
  text: string;
  /** map[i] = index in the original string of folded char i. */
  map: number[];
}

const QUOTES = /[‘’‛ʼ`´]/;
const DASHES = /[‐-―−]/;

export function fold(input: string): Folded {
  let text = "";
  const map: number[] = [];
  for (let i = 0; i < input.length; ) {
    const cp = input.codePointAt(i) ?? 0;
    const ch = String.fromCodePoint(cp);
    let f: string;
    if (QUOTES.test(ch)) f = "'";
    else if (DASHES.test(ch)) f = "-";
    else if (/\s/.test(ch)) f = " ";
    else f = ch.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    for (let k = 0; k < f.length; k++) map.push(i);
    text += f;
    i += ch.length;
  }
  return { text, map };
}

export function foldString(input: string): string {
  return fold(input).text.replace(/\s+/g, " ").trim();
}

/* ---------------- terms ---------------- */

interface Term {
  source: string;
  re: RegExp;
  /** Ignore occurrences written entirely in lowercase (see header). */
  needsCapital: boolean;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileTerm(raw: string, kind: "name" | "domain"): Term | null {
  const source = raw.trim();
  const folded = foldString(source);
  if (folded.length < 2) return null;
  let body: string;
  if (kind === "domain") {
    body = escapeRe(folded);
  } else {
    body = folded
      .split(/[ -]+/)
      .filter(Boolean)
      .map((part) => escapeRe(part).replace(/'/g, "'?"))
      .join("[ -]*");
  }
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "gu");
  const singleWord = kind === "name" && /^\p{L}+$/u.test(source);
  const needsCapital = singleWord && /\p{Lu}/u.test(source) && source !== source.toUpperCase();
  return { source, re, needsCapital };
}

export interface EntityMatcher {
  /** Display name. */
  name: string;
  domain: string;
  terms: Term[];
}

export function buildMatcher(name: string, domain: string, aliases: string[] = []): EntityMatcher {
  const terms: Term[] = [];
  const seen = new Set<string>();
  for (const n of [name, ...aliases]) {
    const t = compileTerm(n, "name");
    if (t && !seen.has(t.re.source)) {
      seen.add(t.re.source);
      terms.push(t);
    }
  }
  const host = hostOf(domain).replace(/^www\./, "");
  if (host.includes(".")) {
    const t = compileTerm(host, "domain");
    if (t) terms.push(t);
  }
  return { name, domain: host, terms };
}

export interface Span {
  start: number;
  end: number;
}

/** Every occurrence of the entity in the original text, as [start, end) ranges in original indices, sorted. */
export function findMentions(original: string, folded: Folded, matcher: EntityMatcher): Span[] {
  const spans: Span[] = [];
  for (const term of matcher.terms) {
    term.re.lastIndex = 0;
    for (const m of folded.text.matchAll(term.re)) {
      const fStart = m.index ?? 0;
      const fEnd = fStart + m[0].length;
      const start = folded.map[fStart] ?? 0;
      const lastChar = folded.map[fEnd - 1] ?? start;
      const cp = original.codePointAt(lastChar) ?? 0;
      const end = lastChar + (cp > 0xffff ? 2 : 1);
      if (term.needsCapital && !/\p{Lu}/u.test(original.slice(start, end))) continue;
      spans.push({ start, end });
    }
  }
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  // Drop overlaps (an alias inside the full name, the domain inside a URL that also matched the name).
  const out: Span[] = [];
  for (const s of spans) {
    const prev = out[out.length - 1];
    if (prev && s.start < prev.end) continue;
    out.push(s);
  }
  return out;
}

export function mentions(text: string, matcher: EntityMatcher): boolean {
  return findMentions(text, fold(text), matcher).length > 0;
}

/* ---------------- citations ---------------- */

/** Citation host belongs to the tracked domain (see header for the subdomain rule). */
export function citationMatchesDomain(url: string, domain: string): boolean {
  const target = hostOf(domain).replace(/^www\./, "");
  if (!target) return false;
  const host = hostOf(url).replace(/^www\./, "");
  if (!host) return false;
  const targetIsSubdomain = target !== registrableDomain(target);
  if (targetIsSubdomain) return host === target || host.endsWith(`.${target}`);
  return registrableDomain(host) === target;
}

export function toCitations(raw: { url: string; title?: string; domain?: string }[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of raw) {
    const url = c.url?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const domain = registrableDomain(c.domain || url);
    if (!domain) continue;
    out.push(c.title ? { url, domain, title: c.title.slice(0, 200) } : { url, domain });
  }
  return out;
}

/* ---------------- full analysis ---------------- */

export interface AnalyzeInput {
  text: string;
  citations: Citation[];
  brand: { name: string; domain: string; aliases?: string[] };
  competitors: Competitor[];
  /** Other brand names an extraction pass found (order doesn't matter: position comes from the text). */
  extractedBrands?: string[];
}

export interface Analysis {
  mentioned: boolean;
  position: number | null;
  cited: boolean;
  competitorMentions: Record<string, boolean>;
  competitorPositions: Record<string, number | null>;
  competitorCited: Record<string, boolean>;
  otherBrands: string[];
  brandOrder: string[];
  mentionSpans: [number, number][];
}

export function analyzeAnswer(input: AnalyzeInput): Analysis {
  const { text, citations, brand, competitors } = input;
  const folded = fold(text);

  const brandMatcher = buildMatcher(brand.name, brand.domain, brand.aliases ?? []);
  const compMatchers = competitors.map((c) => buildMatcher(c.name, c.domain));
  const brandSpans = findMentions(text, folded, brandMatcher);
  const brandCited = citations.some((c) => citationMatchesDomain(c.url, brand.domain));

  // Every entity's first appearance, for ranking.
  const firsts: { key: string; label: string; at: number }[] = [];
  if (brandSpans.length) firsts.push({ key: "__brand", label: brand.name, at: brandSpans[0].start });

  const competitorMentions: Record<string, boolean> = {};
  const competitorCited: Record<string, boolean> = {};
  compMatchers.forEach((m, i) => {
    const c = competitors[i];
    const spans = findMentions(text, folded, m);
    competitorMentions[c.domain] = spans.length > 0;
    competitorCited[c.domain] = citations.some((x) => citationMatchesDomain(x.url, c.domain));
    if (spans.length) firsts.push({ key: c.domain, label: c.name, at: spans[0].start });
  });

  // Untracked brands from the extraction pass: keep the ones that really appear in the text and aren't
  // just another spelling of you or a tracked competitor.
  const known = [brandMatcher, ...compMatchers];
  const otherBrands: string[] = [];
  const seenOther = new Set<string>();
  for (const raw of input.extractedBrands ?? []) {
    const name = raw.replace(/\s+/g, " ").trim().slice(0, 60);
    const key = foldString(name);
    if (name.length < 2 || seenOther.has(key)) continue;
    if (known.some((m) => mentions(name, m) || m.terms.some((t) => foldString(t.source) === key))) continue;
    if (known.some((m) => mentions(m.name, buildMatcher(name, "")))) continue;
    const spans = findMentions(text, folded, buildMatcher(name, ""));
    if (!spans.length) continue;
    seenOther.add(key);
    otherBrands.push(name);
    firsts.push({ key: `other:${key}`, label: name, at: spans[0].start });
  }

  firsts.sort((a, b) => a.at - b.at);
  const rank = (key: string) => {
    const i = firsts.findIndex((f) => f.key === key);
    return i === -1 ? null : i + 1;
  };

  const competitorPositions: Record<string, number | null> = {};
  for (const c of competitors) competitorPositions[c.domain] = competitorMentions[c.domain] ? rank(c.domain) : null;

  return {
    mentioned: brandSpans.length > 0,
    position: brandSpans.length ? rank("__brand") : null,
    cited: brandCited,
    competitorMentions,
    competitorPositions,
    competitorCited,
    otherBrands: otherBrands.slice(0, 25),
    brandOrder: firsts.map((f) => f.label).slice(0, 30),
    mentionSpans: brandSpans.map((s) => [s.start, s.end] as [number, number]),
  };
}

/** Legacy rule, kept only so tests can show the before/after difference. Do not use for scoring. */
export function legacyMentions(text: string, name: string, domain: string): boolean {
  const lower = text.toLowerCase();
  if (name && lower.includes(name.toLowerCase())) return true;
  const normalized = domain.trim().toLowerCase().replace(/^www\./, "");
  if (normalized && lower.includes(normalized)) return true;
  const root = normalized.split(".")[0];
  return root.length > 2 && lower.includes(root);
}
