import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { tokenize } from "@/lib/tools/keywordDensity/tokenizer";
import { stem } from "@/lib/tools/keywordDensity/stem";
import { isHeading, slugText, subheadings } from "@/lib/tools/keywordDensity/document";
import { longestRun, proseSentenceCount, repetitionFlag, type OverOptFlag } from "@/lib/tools/keywordDensity/overOptimization";

export type MatchKind = "exact" | "variant" | "words" | "none";

export type PlacementStatus = "pass" | "partial" | "fail" | "na" | "info" | "warn";

export type PlacementCheck = {
  id: "title" | "h1" | "intro" | "meta" | "slug" | "subheadings" | "alt" | "body";
  label: string;
  status: PlacementStatus;
  detail: string;
  /** The text that was checked, when there is one to show. */
  evidence?: string;
};

export type TargetAnalysis = {
  keyword: string;
  words: string[];
  /** Exact surface matches in the body (headings included). */
  exact: number;
  /** Matches of a different form ("teas", "brewing tea" for "brew tea") via the lemma keys. */
  variants: number;
  variantForms: { form: string; count: number }[];
  total: number;
  /** total ÷ words × 100. */
  density: number;
  per1000: number;
  checks: PlacementCheck[];
  /** Occurrences per equal slice of the text, in reading order. */
  distribution: number[];
  /** Position of the first occurrence as a share of the text (0 = first word), or null. */
  firstAt: number | null;
  firstWordIndex: number | null;
  /** Sections (between H2/H3, or paragraphs) that mention it. */
  coverage: { covered: number; total: number; kind: DocAnalysis["sectionKind"] };
  sentenceShare: number;
  flags: OverOptFlag[];
};

/** How a keyword appears in a short field (title, H1, meta description, slug, alt). */
export function matchIn(text: string, kwTokens: string[]): { kind: MatchKind; count: number } {
  const toks = tokenize(text);
  const n = kwTokens.length;
  if (!n || !toks.length) return { kind: "none", count: 0 };
  const kwKeys = kwTokens.map(stem);
  const keys = toks.map(stem);
  let exact = 0;
  let variant = 0;
  for (let i = 0; i + n <= toks.length; i++) {
    let e = true;
    let v = true;
    for (let j = 0; j < n; j++) {
      if (toks[i + j] !== kwTokens[j]) e = false;
      if (keys[i + j] !== kwKeys[j]) v = false;
    }
    if (e) exact++;
    else if (v) variant++;
  }
  if (exact) return { kind: "exact", count: exact + variant };
  if (variant) return { kind: "variant", count: variant };
  const set = new Set(keys);
  if (kwKeys.every((k) => set.has(k))) return { kind: "words", count: 0 };
  return { kind: "none", count: 0 };
}

const kindText: Record<MatchKind, string> = {
  exact: "Exact match",
  variant: "Variant match",
  words: "All the words are there, but not as one phrase",
  none: "Not found",
};

const SLICES = 20;

export function analyzeTarget(a: DocAnalysis, keyword: string): TargetAnalysis {
  const kw = tokenize(keyword);
  const n = kw.length;
  const kwKeys = kw.map(stem);
  const doc = a.doc;
  const url = doc.source === "url";

  // Body occurrences (all tokens, but never across a block boundary).
  const positions: number[] = [];
  let exact = 0;
  const forms = new Map<string, number>();
  if (n) {
    for (const b of a.blocks) {
      for (let i = b.start; i + n <= b.end; i++) {
        let v = true;
        for (let j = 0; j < n; j++)
          if (a.keys[i + j] !== kwKeys[j]) {
            v = false;
            break;
          }
        if (!v) continue;
        positions.push(i);
        const form = a.tokens.slice(i, i + n).join(" ");
        if (form === kw.join(" ")) exact++;
        else forms.set(form, (forms.get(form) ?? 0) + 1);
      }
    }
  }
  const total = positions.length;
  const words = a.wordCount || 1;

  // Distribution across equal slices of the text.
  const slices = Math.max(1, Math.min(SLICES, Math.ceil(a.wordCount / 15)));
  const distribution = new Array<number>(slices).fill(0);
  for (const p of positions) distribution[Math.min(slices - 1, Math.floor((p / words) * slices))]++;

  // Coverage by section.
  let covered = 0;
  for (const s of a.sections) if (positions.some((p) => p >= s.start && p < s.end)) covered++;

  // Sentence share and runs (prose sentences only).
  const hits = a.sentences.map((s) => !s.heading && positions.some((p) => p >= s.start && p < s.end));
  const prose = proseSentenceCount(a);
  const sentenceShare = prose ? hits.filter(Boolean).length / prose : 0;

  const checks: PlacementCheck[] = [];
  const fieldCheck = (id: PlacementCheck["id"], label: string, text: string | null, needsUrl: boolean, missingText: string) => {
    if (needsUrl && !url) {
      checks.push({ id, label, status: "na", detail: "Needs a URL. Use Analyze URL to check this." });
      return;
    }
    if (!text) {
      checks.push({ id, label, status: "fail", detail: missingText });
      return;
    }
    const m = matchIn(text, kw);
    checks.push({
      id,
      label,
      status: m.kind === "exact" || m.kind === "variant" ? "pass" : m.kind === "words" ? "partial" : "fail",
      detail: m.kind === "none" ? "Not found." : kindText[m.kind] + (m.count > 1 ? ` (${m.count}×)` : "") + ".",
      evidence: text,
    });
  };

  fieldCheck("title", "Title tag", doc.title, true, "The page has no <title>.");
  const h1 = doc.h1[0] ?? null;
  fieldCheck("h1", "H1 heading", h1, false, url ? "The page has no H1." : "No H1 found. Start with a # heading or a short first line.");
  if (!url && doc.h1Origin === "first-line" && checks[checks.length - 1]) {
    checks[checks.length - 1].detail += " (Your first line is treated as the H1.)";
  }

  // Intro: first paragraph or first 100 body words (headings excluded).
  {
    const bodyBlocks = a.blocks.filter((b) => !isHeading(b.type) && b.words > 0);
    const firstPara = bodyBlocks[0];
    let wordsSeen = 0;
    let inFirst100 = false;
    let firstBodyWord: number | null = null;
    for (const b of bodyBlocks) {
      for (const p of positions) {
        if (p >= b.start && p < b.end) {
          const idx = wordsSeen + (p - b.start);
          if (firstBodyWord === null || idx < firstBodyWord) firstBodyWord = idx;
          if (idx < 100) inFirst100 = true;
        }
      }
      wordsSeen += b.words;
      if (wordsSeen > 200 && firstBodyWord !== null) break;
    }
    const inFirstPara = !!firstPara && positions.some((p) => p >= firstPara.start && p < firstPara.end);
    checks.push({
      id: "intro",
      label: "First paragraph / first 100 words",
      status: inFirstPara || inFirst100 ? "pass" : "fail",
      detail: inFirstPara
        ? "Used in the opening paragraph."
        : inFirst100
          ? "Used within the first 100 words."
          : firstBodyWord !== null
            ? `First used at word ${firstBodyWord + 1} of the body. Mention the topic early so readers know they're in the right place.`
            : "Not used in the body text.",
      evidence: firstPara ? firstPara.text.slice(0, 220) + (firstPara.text.length > 220 ? "…" : "") : undefined,
    });
  }

  fieldCheck("meta", "Meta description", doc.metaDescription, true, "The page has no meta description.");

  if (url) {
    const slug = slugText(doc.url);
    if (slug === "") checks.push({ id: "slug", label: "URL slug", status: "info", detail: "This is the home page; there is no slug to check.", evidence: doc.url ?? undefined });
    else fieldCheck("slug", "URL slug", slug, true, "Could not read the URL.");
    const last = checks[checks.length - 1];
    if (last.id === "slug" && doc.url) last.evidence = doc.url;
  } else {
    checks.push({ id: "slug", label: "URL slug", status: "na", detail: "Needs a URL. Use Analyze URL to check this." });
  }

  // Subheadings H2-H3.
  {
    const subs = subheadings(doc);
    if (!subs.length) {
      checks.push({ id: "subheadings", label: "Subheadings (H2–H3)", status: "info", detail: "No H2/H3 subheadings found. Longer content is easier to scan with them." });
    } else {
      const withKw = subs.filter((s) => {
        const k = matchIn(s, kw).kind;
        return k === "exact" || k === "variant" || (n > 1 && k === "words");
      });
      const share = withKw.length / subs.length;
      checks.push({
        id: "subheadings",
        label: "Subheadings (H2–H3)",
        status: withKw.length === 0 ? "fail" : share > 0.75 && subs.length >= 4 ? "warn" : "pass",
        detail:
          withKw.length === 0
            ? `None of ${subs.length} subheadings mention it or its words.`
            : `${withKw.length} of ${subs.length} subheadings (${Math.round(share * 100)}%) mention it${share > 0.75 && subs.length >= 4 ? ". That many can read as repetitive; related terms work too." : "."}`,
        evidence: withKw.slice(0, 3).join(" · ") || undefined,
      });
    }
  }

  // Image alt text.
  if (!url || !doc.images) {
    checks.push({ id: "alt", label: "Image alt text", status: "na", detail: "Needs a URL. Use Analyze URL to check this." });
  } else if (!doc.images.length) {
    checks.push({ id: "alt", label: "Image alt text", status: "info", detail: "No images in the main content." });
  } else {
    const withAlt = doc.images.filter((i) => i.alt && i.alt.trim());
    const withKw = withAlt.filter((i) => {
      const k = matchIn(i.alt!, kw).kind;
      return k !== "none";
    });
    checks.push({
      id: "alt",
      label: "Image alt text",
      status: withKw.length ? "pass" : "partial",
      detail: withKw.length
        ? `${withKw.length} of ${doc.images.length} images describe it in their alt text.`
        : `None of ${doc.images.length} images mention it (${doc.images.length - withAlt.length} have no alt text). Only add it where it genuinely describes the image.`,
      evidence: withKw[0]?.alt ?? undefined,
    });
  }

  checks.push({
    id: "body",
    label: "Used in the content",
    status: total ? "pass" : "fail",
    detail: total
      ? `${total} time${total === 1 ? "" : "s"}${total - exact ? ` (${exact} exact, ${total - exact} variant${total - exact === 1 ? "" : "s"})` : ""} · ${((total / words) * 1000).toFixed(1)} per 1,000 words.`
      : "Not used in the content at all.",
  });

  // Keyword-specific over-optimisation.
  const flags: OverOptFlag[] = [];
  const rep = repetitionFlag(`"${keyword.trim()}"`, { n: Math.max(1, n), count: total, words: a.wordCount, inSentences: hits.filter(Boolean).length, prose, run: longestRun(a, hits) });
  if (rep) flags.push({ id: "kw-repetition", ...rep });
  const titleM = doc.title ? matchIn(doc.title, kw) : null;
  if (titleM && titleM.count >= 2) {
    flags.push({ id: "kw-title", severity: "warning", title: `${titleM.count}× in the title`, detail: "One clear mention in the title is enough; repeats look like stuffing in search results.", share: 0 });
  }
  const h1M = h1 ? matchIn(h1, kw) : null;
  if (h1M && h1M.count >= 2) {
    flags.push({ id: "kw-h1", severity: "warning", title: `${h1M.count}× in the H1`, detail: "Say it once in the H1 and write the rest for the reader.", share: 0 });
  }

  return {
    keyword: keyword.trim(),
    words: kw,
    exact,
    variants: total - exact,
    variantForms: [...forms.entries()].map(([form, count]) => ({ form, count })).sort((x, y) => y.count - x.count),
    total,
    density: (total / words) * 100,
    per1000: (total / words) * 1000,
    checks,
    distribution,
    firstAt: positions.length ? positions[0] / words : null,
    firstWordIndex: positions.length ? positions[0] : null,
    coverage: { covered, total: a.sections.length, kind: a.sectionKind },
    sentenceShare,
    flags,
  };
}
