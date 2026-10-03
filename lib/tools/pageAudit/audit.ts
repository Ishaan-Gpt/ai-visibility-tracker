import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/net/safeFetch";

export type Severity = "error" | "warning" | "info" | "pass";

export interface AuditCheck {
  id: string;
  category: "Indexability" | "Content" | "Social & Sharing" | "Structured data" | "Technical";
  severity: Severity;
  title: string;
  detail: string;
  fix?: string;
}

export interface PageAuditReport {
  url: string;
  finalUrl: string;
  status: number;
  redirects: string[];
  responseMs: number;
  htmlBytes: number;
  truncated: boolean;
  score: number;
  summary: { errors: number; warnings: number; passes: number };
  facts: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    h1: string[];
    lang: string | null;
    wordCount: number;
    images: { total: number; missingAlt: number };
    links: { internal: number; external: number };
    schemaTypes: string[];
    ogTags: Record<string, string>;
  };
  checks: AuditCheck[];
}

const WEIGHT: Record<Severity, number> = { error: 12, warning: 5, info: 0, pass: 0 };

function collectSchemaTypes(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) return node.forEach((n) => collectSchemaTypes(n, out));
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    const t = o["@type"];
    if (typeof t === "string") out.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.add(x));
    Object.values(o).forEach((v) => collectSchemaTypes(v, out));
  }
}

export async function auditPage(input: string): Promise<PageAuditReport> {
  const res = await safeFetch(input, { maxBytes: 2_000_000 });
  const checks: AuditCheck[] = [];
  const add = (c: AuditCheck) => checks.push(c);

  const contentType = res.headers["content-type"] ?? "";
  const isHtml = /text\/html|application\/xhtml/i.test(contentType) || /<html|<!doctype html/i.test(res.body.slice(0, 1000));
  const $ = cheerio.load(isHtml ? res.body : "");

  // ---- Technical: status, https, redirects, speed, size
  if (res.status >= 400) {
    add({ id: "status", category: "Indexability", severity: "error", title: `Page returns HTTP ${res.status}`, detail: "Search engines will not index error pages.", fix: "Return a 200 status for pages you want indexed." });
  } else {
    add({ id: "status", category: "Indexability", severity: "pass", title: `HTTP ${res.status}`, detail: "The page responds successfully." });
  }
  if (!isHtml) {
    add({ id: "html", category: "Technical", severity: "error", title: "Response is not HTML", detail: `Content-Type is "${contentType || "unknown"}".`, fix: "Point the audit at an HTML page." });
  }
  if (!res.finalUrl.startsWith("https://")) {
    add({ id: "https", category: "Technical", severity: "error", title: "Not served over HTTPS", detail: "HTTPS is a ranking signal and required for trust.", fix: "Install a TLS certificate and redirect HTTP to HTTPS." });
  } else add({ id: "https", category: "Technical", severity: "pass", title: "Served over HTTPS", detail: "Connection is encrypted." });
  if (res.redirects.length > 2) {
    add({ id: "redirects", category: "Technical", severity: "warning", title: `${res.redirects.length} redirects before the final page`, detail: res.redirects.join(" → "), fix: "Link directly to the final URL to save crawl budget and time." });
  }
  if (res.elapsedMs > 1800) {
    add({ id: "ttfb", category: "Technical", severity: "warning", title: `Slow response (${res.elapsedMs} ms)`, detail: "Server response plus download took a long time from our server.", fix: "Add caching/CDN and reduce server work. Run PageSpeed Insights for lab data." });
  } else add({ id: "ttfb", category: "Technical", severity: "pass", title: `Response time ${res.elapsedMs} ms`, detail: "Fast server response (measured from our server, not a lab test)." });
  if (res.truncated) add({ id: "size", category: "Technical", severity: "info", title: "HTML larger than 2 MB", detail: "We analysed only the first 2 MB. Very large HTML hurts performance." });

  // ---- Indexability
  const robotsMeta = ($('meta[name="robots"]').attr("content") ?? "").toLowerCase();
  const xRobots = (res.headers["x-robots-tag"] ?? "").toLowerCase();
  if (/noindex/.test(robotsMeta) || /noindex/.test(xRobots)) {
    add({ id: "noindex", category: "Indexability", severity: "error", title: "Page is set to noindex", detail: "It will be excluded from search results.", fix: "Remove the noindex directive if you want this page to rank." });
  } else add({ id: "noindex", category: "Indexability", severity: "pass", title: "Indexable", detail: "No noindex directive found." });

  const canonical = $('link[rel="canonical"]').attr("href") ?? null;
  if (!canonical) {
    add({ id: "canonical", category: "Indexability", severity: "warning", title: "Missing canonical URL", detail: "Without it, duplicate URLs can split ranking signals.", fix: 'Add <link rel="canonical" href="…"> pointing at the preferred URL.' });
  } else {
    let abs = canonical;
    try { abs = new URL(canonical, res.finalUrl).href; } catch { /* keep raw */ }
    const same = abs.replace(/\/$/, "") === res.finalUrl.replace(/\/$/, "");
    add({ id: "canonical", category: "Indexability", severity: same ? "pass" : "info", title: same ? "Canonical points to this page" : "Canonical points elsewhere", detail: abs });
  }

  const lang = $("html").attr("lang") ?? null;
  add(lang
    ? { id: "lang", category: "Technical", severity: "pass", title: `Language declared (${lang})`, detail: "Helps search engines serve the right audience." }
    : { id: "lang", category: "Technical", severity: "warning", title: "Missing html lang attribute", detail: "Language is not declared.", fix: 'Add lang="en" (or your language) to <html>.' });

  add($('meta[name="viewport"]').length
    ? { id: "viewport", category: "Technical", severity: "pass", title: "Mobile viewport set", detail: "The page is configured for mobile devices." }
    : { id: "viewport", category: "Technical", severity: "error", title: "Missing viewport meta tag", detail: "Mobile rendering will be broken.", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });

  // ---- Content: title, description, headings
  const title = $("head > title").first().text().trim() || null;
  if (!title) add({ id: "title", category: "Content", severity: "error", title: "Missing title tag", detail: "The title is the most important on-page element.", fix: "Add a unique, descriptive <title> of 30–60 characters." });
  else if (title.length < 30) add({ id: "title", category: "Content", severity: "warning", title: `Title is short (${title.length} chars)`, detail: title, fix: "Aim for 30–60 characters using your main keyword." });
  else if (title.length > 60) add({ id: "title", category: "Content", severity: "warning", title: `Title may be truncated (${title.length} chars)`, detail: title, fix: "Keep titles under about 60 characters (≈580px) to avoid truncation." });
  else add({ id: "title", category: "Content", severity: "pass", title: `Title length is good (${title.length} chars)`, detail: title });

  const description = $('meta[name="description"]').attr("content")?.trim() || null;
  if (!description) add({ id: "description", category: "Content", severity: "warning", title: "Missing meta description", detail: "Google may auto-generate a snippet instead.", fix: "Write a compelling 70–160 character description." });
  else if (description.length < 70) add({ id: "description", category: "Content", severity: "warning", title: `Meta description is short (${description.length} chars)`, detail: description, fix: "Use 70–160 characters to describe the page and invite the click." });
  else if (description.length > 160) add({ id: "description", category: "Content", severity: "warning", title: `Meta description may be truncated (${description.length} chars)`, detail: description, fix: "Keep it under about 160 characters." });
  else add({ id: "description", category: "Content", severity: "pass", title: `Meta description length is good (${description.length} chars)`, detail: description });

  const h1 = $("h1").map((_, el) => $(el).text().trim().replace(/\s+/g, " ")).get().filter(Boolean);
  if (h1.length === 0) add({ id: "h1", category: "Content", severity: "error", title: "No H1 heading", detail: "The page has no primary heading.", fix: "Add exactly one H1 describing the page topic." });
  else if (h1.length > 1) add({ id: "h1", category: "Content", severity: "warning", title: `${h1.length} H1 headings`, detail: h1.slice(0, 3).join(" | "), fix: "Use a single H1 and H2–H6 for subsections." });
  else add({ id: "h1", category: "Content", severity: "pass", title: "Exactly one H1", detail: h1[0] });

  const bodyText = $("body").clone().find("script,style,noscript,svg").remove().end().text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").length : 0;
  if (wordCount < 250) add({ id: "words", category: "Content", severity: wordCount < 100 ? "warning" : "info", title: `Thin content (${wordCount} words)`, detail: "Pages with very little text rarely rank for competitive queries.", fix: "Expand with useful, original information that answers the searcher's question." });
  else add({ id: "words", category: "Content", severity: "pass", title: `${wordCount} words of content`, detail: "Substantial on-page content." });

  const imgs = $("img");
  const missingAlt = imgs.filter((_, el) => $(el).attr("alt") === undefined).length;
  if (imgs.length > 0) {
    add(missingAlt > 0
      ? { id: "alt", category: "Content", severity: "warning", title: `${missingAlt} of ${imgs.length} images missing alt text`, detail: "Alt text helps accessibility and image search.", fix: 'Add descriptive alt text (use alt="" for purely decorative images).' }
      : { id: "alt", category: "Content", severity: "pass", title: `All ${imgs.length} images have alt attributes`, detail: "Good for accessibility and image search." });
  }

  // ---- Links
  let internal = 0, external = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
    try {
      const u = new URL(href, res.finalUrl);
      if (u.hostname.replace(/^www\./, "") === new URL(res.finalUrl).hostname.replace(/^www\./, "")) internal++;
      else external++;
    } catch { /* ignore */ }
  });
  if (internal === 0) add({ id: "links", category: "Content", severity: "warning", title: "No internal links found", detail: "Internal links pass authority and help crawlers discover pages.", fix: "Link to related pages on your site." });

  // ---- Social
  const og: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => { og[$(el).attr("property")!] = $(el).attr("content") ?? ""; });
  const missingOg = ["og:title", "og:description", "og:image"].filter((k) => !og[k]);
  add(missingOg.length
    ? { id: "og", category: "Social & Sharing", severity: "warning", title: `Missing Open Graph tags: ${missingOg.join(", ")}`, detail: "Links shared on social apps will look plain.", fix: "Add og:title, og:description and og:image (1200×630)." }
    : { id: "og", category: "Social & Sharing", severity: "pass", title: "Open Graph tags present", detail: "Shared links get a rich preview." });
  add($('meta[name="twitter:card"]').length
    ? { id: "twitter", category: "Social & Sharing", severity: "pass", title: "Twitter/X card configured", detail: $('meta[name="twitter:card"]').attr("content") ?? "" }
    : { id: "twitter", category: "Social & Sharing", severity: "info", title: "No twitter:card tag", detail: "X falls back to Open Graph, but a card gives you control.", fix: 'Add <meta name="twitter:card" content="summary_large_image">.' });

  // ---- Structured data
  const schemaTypes = new Set<string>();
  let badJsonLd = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    try { collectSchemaTypes(JSON.parse($(el).contents().text()), schemaTypes); } catch { badJsonLd++; }
  });
  if (badJsonLd > 0) add({ id: "jsonld-invalid", category: "Structured data", severity: "error", title: `${badJsonLd} JSON-LD block${badJsonLd > 1 ? "s" : ""} failed to parse`, detail: "Invalid JSON means search engines ignore the markup.", fix: "Validate the JSON-LD with our Schema Generator or Google's Rich Results Test." });
  if (schemaTypes.size === 0 && badJsonLd === 0) add({ id: "jsonld", category: "Structured data", severity: "warning", title: "No structured data found", detail: "Schema markup unlocks rich results and helps AI systems understand the page.", fix: "Generate JSON-LD (Organization, Article, FAQ, Product…) with the Schema Generator." });
  else if (schemaTypes.size > 0) add({ id: "jsonld", category: "Structured data", severity: "pass", title: `Structured data: ${[...schemaTypes].slice(0, 6).join(", ")}`, detail: `${schemaTypes.size} schema type${schemaTypes.size > 1 ? "s" : ""} detected.` });

  const score = Math.max(0, 100 - checks.reduce((s, c) => s + WEIGHT[c.severity], 0));
  return {
    url: input,
    finalUrl: res.finalUrl,
    status: res.status,
    redirects: res.redirects,
    responseMs: res.elapsedMs,
    htmlBytes: res.bytes,
    truncated: res.truncated,
    score,
    summary: {
      errors: checks.filter((c) => c.severity === "error").length,
      warnings: checks.filter((c) => c.severity === "warning").length,
      passes: checks.filter((c) => c.severity === "pass").length,
    },
    facts: { title, description, canonical, h1, lang, wordCount, images: { total: imgs.length, missingAlt }, links: { internal, external }, schemaTypes: [...schemaTypes], ogTags: og },
    checks,
  };
}
