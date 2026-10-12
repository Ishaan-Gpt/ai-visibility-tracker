import { evaluatePath } from "@/lib/tools/aiCrawlers/robots";
import { abs, add, clip, evidence, type Ctx } from "./context";

export interface IndexFacts {
  canonicals: string[];
  canonical: string | null;
  canonicalAbs: string | null;
  directives: { source: string; value: string }[];
  noindex: boolean;
  nosnippet: boolean;
  maxSnippetZero: boolean;
  noai: string[];
}

function urlKey(u: string): string {
  return u.replace(/#.*$/, "").replace(/\/$/, "");
}

export function indexability(ctx: Ctx): IndexFacts {
  const { $, input } = ctx;
  const { status, finalUrl, headers } = input;

  if (status >= 400) add(ctx, { id: "status", category: "Indexability", impact: 10, severity: "error", title: `Page returns HTTP ${status}`, detail: "Search engines do not index error pages.", fix: "Return a 200 status for pages you want indexed, or remove links to this URL." });
  else add(ctx, { id: "status", category: "Indexability", impact: 10, severity: "pass", title: `HTTP ${status}`, detail: "The page responds successfully." });

  // ---- Robots directives: meta robots, googlebot-specific meta, X-Robots-Tag header.
  const directives: { source: string; value: string }[] = [];
  $('meta[name="robots" i], meta[name="googlebot" i], meta[name="googlebot-news" i], meta[name="bingbot" i]').each((_, el) => {
    directives.push({ source: `<meta name="${$(el).attr("name")}">`, value: ($(el).attr("content") ?? "").trim() });
  });
  if (headers["x-robots-tag"]) directives.push({ source: "X-Robots-Tag header", value: headers["x-robots-tag"] });
  const all = directives.map((d) => d.value.toLowerCase()).join(", ");
  const generalOrGoogle = directives.filter((d) => !/bingbot/i.test(d.source)).map((d) => d.value.toLowerCase()).join(", ");
  const noindex = /\b(noindex|none)\b/.test(generalOrGoogle);
  const nofollow = /\b(nofollow|none)\b/.test(generalOrGoogle);
  const nosnippet = /\bnosnippet\b/.test(all);
  const maxSnippetZero = /max-snippet\s*:\s*0\b/.test(all);
  const noai = [...new Set(all.match(/\bno(ai|imageai)\b/g) ?? [])];
  const items = directives.map((d) => `${d.source}: ${d.value || "(empty)"}`);

  if (noindex) add(ctx, { id: "noindex", category: "Indexability", impact: 10, severity: "error", title: "Page is set to noindex", detail: "It will be dropped from search results.", fix: "Remove the noindex directive (meta robots or X-Robots-Tag) if this page should rank.", items });
  else add(ctx, { id: "noindex", category: "Indexability", impact: 10, severity: "pass", title: "Indexable", detail: directives.length ? "Robots directives found, none block indexing." : "No noindex directive found.", items: items.length ? items : undefined });

  if (nofollow) add(ctx, { id: "nofollow-page", category: "Indexability", impact: 3, severity: "warning", title: "Page-level nofollow", detail: "Search engines are told not to follow any link on this page, so it passes no authority.", fix: "Remove nofollow from the robots meta tag unless you deliberately want to isolate this page.", items });
  if (nosnippet || maxSnippetZero) add(ctx, { id: "nosnippet", category: "Indexability", impact: 3, severity: "warning", title: nosnippet ? "nosnippet directive" : "max-snippet:0 directive", detail: "Google shows no text snippet for this page and will not use its content in AI Overviews or AI Mode.", fix: "Remove nosnippet / max-snippet:0 unless you need it; use data-nosnippet on specific passages instead.", items });
  if (directives.length > 1) {
    const metas = directives.filter((d) => /name="robots"/i.test(d.source));
    if (metas.length > 1) add(ctx, { id: "robots-dup", category: "Indexability", impact: 2, severity: "warning", title: `${metas.length} robots meta tags`, detail: "Google combines them and applies the most restrictive, which is easy to get wrong.", fix: "Keep a single <meta name=\"robots\"> tag.", items });
  }

  // ---- robots.txt for Googlebot (only when the caller supplied robots.txt)
  if (input.robots !== undefined) {
    const allowed = input.robots ? evaluatePath(input.robots, "Googlebot", ctx.pagePath) : true;
    add(ctx, allowed
      ? { id: "robots-txt", category: "Indexability", impact: 8, severity: "pass", title: "Crawlable by Googlebot", detail: input.robots ? "robots.txt allows this URL." : "No robots.txt, so everything is crawlable." }
      : { id: "robots-txt", category: "Indexability", impact: 8, severity: "error", title: "Blocked by robots.txt", detail: `robots.txt disallows ${ctx.pagePath} for Googlebot. Google can't read the page, and may index the bare URL without content.`, fix: "Remove the Disallow rule covering this path (use noindex instead if you want it out of search)." });
  }

  // ---- Canonical
  const canonicals = $('link[rel~="canonical" i]').map((_, el) => ($(el).attr("href") ?? "").trim()).get();
  const headerCanon = (headers["link"] ?? "").match(/<([^>]+)>\s*;[^,]*rel="?canonical"?/i)?.[1];
  if (headerCanon) canonicals.push(headerCanon);
  const inBody = $('body link[rel~="canonical" i]').length;
  const canonical = canonicals[0] ?? null;
  const canonicalAbs = abs(canonical, finalUrl);
  if (!canonicals.length) {
    add(ctx, { id: "canonical", category: "Indexability", impact: 5, severity: "warning", title: "Missing canonical URL", detail: "Without it, parameter and duplicate URLs can split ranking signals.", fix: `Add <link rel="canonical" href="${urlKey(finalUrl)}"> (the preferred URL of this page).` });
  } else if (new Set(canonicals.map((c) => abs(c, finalUrl))).size > 1) {
    add(ctx, { id: "canonical", category: "Indexability", impact: 5, severity: "error", title: `${canonicals.length} conflicting canonical tags`, detail: "When canonicals disagree, Google ignores all of them.", fix: "Output exactly one canonical tag (check your SEO plugin and theme both adding one).", items: canonicals });
  } else {
    const same = canonicalAbs && urlKey(canonicalAbs) === urlKey(finalUrl);
    const relative = canonical && !/^https?:\/\//i.test(canonical);
    const httpOnHttps = ctx.isHttps && canonicalAbs?.startsWith("http://");
    if (httpOnHttps) add(ctx, { id: "canonical", category: "Indexability", impact: 5, severity: "warning", title: "Canonical points to the HTTP version", detail: canonicalAbs!, fix: "Use the https:// URL in the canonical tag." });
    else if (same) add(ctx, { id: "canonical", category: "Indexability", impact: 5, severity: relative ? "info" : "pass", title: relative ? "Canonical is a relative URL" : "Self-referencing canonical", detail: relative ? `"${canonical}" resolves to ${canonicalAbs}. Google accepts it, but absolute URLs avoid mistakes on staging or alternate hosts.` : canonicalAbs!, fix: relative ? "Use an absolute https:// URL in the canonical." : undefined });
    else add(ctx, { id: "canonical", category: "Indexability", impact: 0, severity: "info", title: "Canonicalised to another URL", detail: `This page asks Google to index ${canonicalAbs} instead. That's right for duplicates, wrong if this page should rank.`, items: canonicals.length > 1 ? canonicals : undefined });
  }
  if (inBody) add(ctx, { id: "canonical-body", category: "Indexability", impact: 3, severity: "warning", title: "Canonical tag outside <head>", detail: "Google ignores rel=canonical in the <body>.", fix: "Move the canonical link into <head> (an unclosed tag or stray element can push head tags into the body)." });

  // ---- Meta refresh & soft 404
  const refresh = $('meta[http-equiv="refresh" i]').attr("content");
  if (refresh && /url=/i.test(refresh)) add(ctx, { id: "meta-refresh", category: "Indexability", impact: 3, severity: "warning", title: "Meta refresh redirect", detail: clip(refresh), fix: "Use a server-side 301 redirect instead of a meta refresh." });
  const titleText = $("title").first().text();
  if (status === 200 && /\b(404|not found|page (doesn.t|does not) exist|nothing (was )?found)\b/i.test(`${titleText} ${$("h1").first().text()}`)) {
    add(ctx, { id: "soft-404", category: "Indexability", impact: 6, severity: "warning", title: "Looks like a soft 404", detail: `Returns 200 but reads like an error page ("${clip(titleText, 80)}").`, fix: "Return a real 404/410 status for missing pages." });
  }

  // ---- URL hygiene
  const u = new URL(finalUrl);
  const problems: string[] = [];
  if (finalUrl.length > 115) problems.push(`Long URL (${finalUrl.length} characters)`);
  if (/[A-Z]/.test(u.pathname)) problems.push("Uppercase letters in the path (URLs are case-sensitive, so variants can duplicate)");
  if (/_/.test(u.pathname)) problems.push("Underscores in the path (Google treats hyphens as word separators, not underscores)");
  if ([...u.searchParams.keys()].length > 2) problems.push(`${[...u.searchParams.keys()].length} query parameters`);
  if (/(^|[?&])(sid|sessionid|phpsessid|jsessionid)=/i.test(u.search) || /;jsessionid=/i.test(u.pathname)) problems.push("Session ID in the URL");
  if (/\/\//.test(u.pathname)) problems.push("Double slash in the path");
  if (/%20|\s/.test(u.pathname)) problems.push("Spaces in the path");
  add(ctx, problems.length
    ? { id: "url", category: "Indexability", impact: 2, severity: "info", title: "URL could be cleaner", detail: finalUrl, fix: "Prefer short, lowercase, hyphenated paths without parameters for indexable pages.", items: evidence(problems) }
    : { id: "url", category: "Indexability", impact: 2, severity: "pass", title: "Clean URL", detail: finalUrl });

  return { canonicals, canonical, canonicalAbs, directives, noindex, nosnippet, maxSnippetZero, noai };
}
