import * as cheerio from "cheerio";
import type { PageAuditReport } from "../types";
import { rankFixes, scoreAi, scoreSeo } from "../scoring";
import { aiLens } from "./ai";
import { content, mainRoot } from "./content";
import type { Ctx, PageInput } from "./context";
import { headings } from "./headings";
import { hreflang } from "./hreflang";
import { images } from "./images";
import { indexability } from "./indexability";
import { linksStatic } from "./links";
import { performance } from "./performance";
import { social } from "./social";
import { structured } from "./structured";
import { technical } from "./technical";

export type { PageInput } from "./context";

/** Builds the per-page context: parsed DOM, visible text and word count. */
export function createCtx(input: PageInput): Ctx {
  const contentType = input.headers["content-type"] ?? "";
  const isHtml = /text\/html|application\/xhtml/i.test(contentType) || /<html|<!doctype html/i.test(input.html.slice(0, 1000));
  const $ = cheerio.load(isHtml ? input.html : "");
  let host = "";
  let pagePath = "/";
  try {
    const u = new URL(input.finalUrl);
    host = u.hostname.toLowerCase();
    pagePath = `${u.pathname}${u.search}` || "/";
  } catch {
    /* keep defaults */
  }
  const bodyText = $("body").clone().find("script,style,noscript,svg,template").remove().end().text().replace(/\s+/g, " ").trim();
  return {
    input,
    $,
    isHtml,
    isHttps: input.finalUrl.startsWith("https://"),
    host,
    pagePath,
    checks: [],
    ai: [],
    bodyText,
    wordCount: bodyText ? bodyText.split(" ").length : 0,
  };
}

/**
 * The full per-page audit with NO network access: everything comes from the fetched response. Cheap enough to run on
 * every page of a site crawl. Single-page mode layers network enrichers (link checks, AI probe, sitemap…) on top.
 */
export function analyzePage(input: PageInput): { report: PageAuditReport; ctx: Ctx } {
  const ctx = createCtx(input);
  const index = indexability(ctx);
  const c = content(ctx);
  const outline = headings(ctx);
  const imgs = images(ctx, mainRoot(ctx));
  const links = linksStatic(ctx);
  const tech = technical(ctx);
  const perf = performance(ctx);
  const sd = structured(ctx);
  const soc = social(ctx);
  const hl = hreflang(ctx);
  aiLens(ctx, { content: c, index, sd, headings: outline });

  const report = buildReport(ctx, {
    title: c.title,
    titles: c.titles,
    description: c.description,
    descriptions: c.descriptions,
    h1: c.h1,
    canonical: index.canonicalAbs ?? index.canonical,
    canonicals: index.canonicals,
    directives: index.directives,
    lang: tech.lang,
    headings: outline,
    og: soc.og,
    domElements: perf.domElements,
    linkStats: { internal: links.stats.internal, external: links.stats.external },
  });
  report.images = imgs;
  report.structuredData = sd;
  report.facts.schemaTypes = sd.items.map((i) => i.types.join(" + "));
  report.hreflang = hl;
  report.resources = { renderBlocking: perf.renderBlocking, mixedContent: tech.mixed };
  return { report: rescore(report), ctx };
}

interface Facts {
  title: string | null;
  titles: string[];
  description: string | null;
  descriptions: string[];
  h1: string[];
  canonical: string | null;
  canonicals: string[];
  directives: { source: string; value: string }[];
  lang: string | null;
  headings: { level: number; text: string }[];
  og: Record<string, string>;
  domElements: number;
  linkStats: { internal: number; external: number };
}

const SERVER_HEADERS = ["server", "x-powered-by", "cache-control", "content-encoding", "strict-transport-security", "x-robots-tag", "cf-cache-status", "x-vercel-cache", "age"];

function buildReport(ctx: Ctx, f: Facts): PageAuditReport {
  const { input } = ctx;
  const report: PageAuditReport = {
    version: 2,
    url: input.url,
    finalUrl: input.finalUrl,
    status: input.status,
    redirects: input.redirects,
    responseMs: input.elapsedMs,
    htmlBytes: input.bytes ?? Buffer.byteLength(input.html, "utf8"),
    truncated: !!input.truncated,
    score: 0,
    summary: { errors: 0, warnings: 0, passes: 0 },
    facts: {
      title: f.title,
      description: f.description,
      canonical: f.canonical,
      h1: f.h1,
      lang: f.lang,
      wordCount: ctx.wordCount,
      images: { total: 0, missingAlt: 0 },
      links: f.linkStats,
      schemaTypes: [],
      ogTags: f.og,
      headings: f.headings,
      titles: f.titles,
      descriptions: f.descriptions,
      canonicals: f.canonicals,
      robotsDirectives: f.directives,
      domElements: f.domElements,
      serverHeaders: Object.fromEntries(SERVER_HEADERS.filter((h) => input.headers[h]).map((h) => [h, input.headers[h]])),
    },
    checks: ctx.checks,
    ai: { score: 0, checks: ctx.ai },
    topFixes: [],
    checkedAt: Date.now(),
  };
  return rescore(report);
}

/** Recomputes scores, summary and top fixes after checks change (enrichers append checks). */
export function rescore(report: PageAuditReport): PageAuditReport {
  const lighthouse = report.speed?.lab?.scores.performance ?? null;
  const { score, categories } = scoreSeo(report.checks, lighthouse);
  report.score = score;
  report.categories = categories;
  report.ai.score = scoreAi(report.ai.checks);
  report.topFixes = rankFixes(report.checks, report.ai.checks);
  report.summary = {
    errors: report.checks.filter((c) => c.severity === "error").length,
    warnings: report.checks.filter((c) => c.severity === "warning").length,
    passes: report.checks.filter((c) => c.severity === "pass").length,
  };
  if (report.images) report.facts.images = { total: report.images.total, missingAlt: report.images.missingAlt + report.images.emptyAltContent };
  return report;
}
