import * as cheerio from "cheerio";
import { normalizeUrl, safeFetch } from "@/lib/net/safeFetch";
import { evaluatePath, parseRobots } from "@/lib/tools/aiCrawlers/robots";

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
  /** Separate lens: can AI answer engines reach, read and quote this page? */
  ai: { score: number; checks: AiCheck[] };
  /** The highest-impact problems across both lenses, in order. */
  topFixes: { title: string; fix: string; severity: Severity; lens: "seo" | "ai" }[];
  checkedAt: number;
}

export interface AiCheck {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  fix?: string;
  weight: number;
}

const AI_SEARCH_AGENTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "PerplexityBot", "Googlebot", "Bingbot"];
const GENERIC_SCHEMA = /^(WebSite|WebPage|BreadcrumbList|SiteNavigationElement|ListItem|ImageObject|SearchAction|EntryPoint|ReadAction)$/;
const QUESTION = /\?$|^(how|what|why|when|where|which|who|can|does|do|is|are|should)\b/i;

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
  const base = normalizeUrl(input);
  const origin = `${base.protocol}//${base.host}`;
  const [res, robotsRes, llmsRes] = await Promise.all([
    safeFetch(base.href, { maxBytes: 2_000_000 }),
    safeFetch(`${origin}/robots.txt`, { maxBytes: 300_000 }).catch(() => null),
    safeFetch(`${origin}/llms.txt`, { maxBytes: 100_000 }).catch(() => null),
  ]);
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

  // ---- AI-readiness lens
  const ai: AiCheck[] = [];
  const robotsOk = !!robotsRes && robotsRes.status === 200 && !/<html/i.test(robotsRes.body.slice(0, 500));
  const parsedRobots = parseRobots(robotsOk ? robotsRes!.body : "");
  let pagePath = "/";
  try {
    const u = new URL(res.finalUrl);
    pagePath = `${u.pathname}${u.search}` || "/";
  } catch { /* keep root */ }
  const blocked = AI_SEARCH_AGENTS.filter((a) => !evaluatePath(parsedRobots, a, pagePath));
  ai.push(blocked.length
    ? { id: "ai-bots", severity: "error", weight: 30, title: `Blocked for ${blocked.join(", ")}`, detail: "robots.txt stops these crawlers from fetching this page, so their AI answers cannot cite it.", fix: "Allow AI search crawlers in robots.txt. The robots.txt & llms.txt generator has a safe preset." }
    : { id: "ai-bots", severity: "pass", weight: 30, title: "AI search crawlers can fetch this page", detail: robotsOk ? "OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot, Googlebot and Bingbot are allowed for this URL." : "No robots.txt found, so every crawler is allowed by default." });

  ai.push(wordCount >= 300
    ? { id: "ai-text", severity: "pass", weight: 20, title: `${wordCount} words readable without JavaScript`, detail: "The content is in the raw HTML, which is what most AI crawlers read." }
    : wordCount >= 80
      ? { id: "ai-text", severity: "warning", weight: 20, title: `Only ${wordCount} words in the raw HTML`, detail: "Many AI crawlers do not run JavaScript, so they see little to quote.", fix: "Server-render the main content, or add a substantive text summary to the HTML." }
      : { id: "ai-text", severity: "error", weight: 20, title: `Almost no text in the raw HTML (${wordCount} words)`, detail: "If the content is rendered by JavaScript, most AI crawlers see an empty page.", fix: "Server-render or pre-render the page so its content is present in the HTML response." });

  const usefulSchema = [...schemaTypes].filter((t) => !GENERIC_SCHEMA.test(t));
  ai.push(usefulSchema.length
    ? { id: "ai-schema", severity: "pass", weight: 15, title: `Entity markup: ${usefulSchema.slice(0, 4).join(", ")}`, detail: "Structured facts AI systems can extract without guessing." }
    : { id: "ai-schema", severity: "warning", weight: 15, title: "No entity-level structured data", detail: schemaTypes.size ? "Only generic page or site markup was found." : "No JSON-LD found.", fix: "Add Organization, Product, Article, FAQPage or LocalBusiness JSON-LD with the Schema Generator." });

  ai.push(description && description.length >= 50
    ? { id: "ai-summary", severity: "pass", weight: 10, title: "Has a concise summary", detail: "The meta description gives AI answers and link previews a ready-made summary." }
    : { id: "ai-summary", severity: "warning", weight: 10, title: "No usable one-line summary", detail: "Without a meta description, AI tools have to guess what the page is about.", fix: "Write a factual 70–160 character meta description stating what the page offers." });

  const subheads = $("h2,h3").map((_, el) => $(el).text().trim().replace(/\s+/g, " ")).get().filter(Boolean);
  const questions = subheads.filter((h) => QUESTION.test(h));
  const hasFaq = [...schemaTypes].some((t) => /FAQPage|QAPage|HowTo/.test(t));
  ai.push(questions.length >= 2 || hasFaq
    ? { id: "ai-questions", severity: "pass", weight: 10, title: hasFaq ? "FAQ or Q&A markup present" : `${questions.length} question-style headings`, detail: "Question-and-answer structure maps directly onto the prompts people ask AI." }
    : { id: "ai-questions", severity: "info", weight: 10, title: "Few question-style headings", detail: `${subheads.length} H2/H3 headings, ${questions.length} phrased as questions.`, fix: "Add a short FAQ that answers what customers actually ask, with FAQPage markup." });

  const dated = $('meta[property="article:published_time"], meta[property="article:modified_time"], meta[itemprop="dateModified"], meta[itemprop="datePublished"], time[datetime]').length > 0 || /"date(Published|Modified)"/.test(res.body);
  const authored = $('meta[name="author"], [rel="author"], [itemprop="author"]').length > 0 || /"author"\s*:/.test(res.body);
  ai.push(dated || authored
    ? { id: "ai-trust", severity: "pass", weight: 10, title: `${[dated && "Dates", authored && (dated ? "author" : "Author")].filter(Boolean).join(" and ")} declared`, detail: "Freshness and authorship signals help AI systems judge how current and credible a source is." }
    : { id: "ai-trust", severity: "info", weight: 10, title: "No date or author signals", detail: "Nothing tells a machine when this was written or by whom.", fix: "Show an updated date and author, and add datePublished, dateModified and author to the JSON-LD." });

  const llmsOk = !!llmsRes && llmsRes.status === 200 && !/<html/i.test(llmsRes.body.slice(0, 500)) && llmsRes.body.trim().length > 0;
  ai.push(llmsOk
    ? { id: "ai-llms", severity: "pass", weight: 5, title: "llms.txt found", detail: `${origin}/llms.txt gives AI assistants a curated map of the site.` }
    : { id: "ai-llms", severity: "info", weight: 5, title: "No llms.txt", detail: "An emerging, optional convention. Adoption by AI vendors varies.", fix: "Publish a short /llms.txt with the llms.txt generator." });

  const credit: Record<Severity, number> = { pass: 1, info: 0.5, warning: 0.35, error: 0 };
  const aiMax = ai.reduce((s, c) => s + c.weight, 0);
  const aiScore = Math.round((ai.reduce((s, c) => s + c.weight * credit[c.severity], 0) / aiMax) * 100);

  const rank: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 };
  const topFixes = [
    ...ai.filter((c) => c.severity !== "pass" && c.fix).map((c) => ({ title: c.title, fix: c.fix!, severity: c.severity, lens: "ai" as const, w: c.weight })),
    ...checks
      .filter((c) => (c.severity === "error" || c.severity === "warning") && c.fix)
      .map((c) => ({ title: c.title, fix: c.fix!, severity: c.severity, lens: "seo" as const, w: WEIGHT[c.severity] })),
  ]
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.w - a.w)
    .slice(0, 5)
    .map((f) => ({ title: f.title, fix: f.fix, severity: f.severity, lens: f.lens }));

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
    ai: { score: aiScore, checks: ai },
    topFixes,
    checkedAt: Date.now(),
  };
}
