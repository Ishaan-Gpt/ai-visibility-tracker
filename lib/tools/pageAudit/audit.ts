import "server-only";
import { BROWSER_UA, normalizeUrl, safeFetch } from "@/lib/net/safeFetch";
import { parseRobots, type ParsedRobots } from "@/lib/tools/aiCrawlers/robots";
import { probeAiAccess } from "./aiProbe";
import { analyzePage, rescore } from "./analyze";
import { evidence } from "./analyze/context";
import { checkLinks } from "./links";
import { tryFetch, urlKey } from "./net";
import { checkPageInSitemap } from "./sitemapCheck";
import { signSpeedToken } from "./speed";
import type { AiCheck, AuditCheck, LinksReport, PageAuditReport } from "./types";

export type { PageAuditReport, AuditCheck, AiCheck, Severity } from "./types";

/** Wall-clock budget for the network enrichers that run after the page itself is fetched. */
const ENRICH_MS = 14_000;

function isText(res: { status: number; body: string } | null): boolean {
  return !!res && res.status === 200 && !/<html|<!doctype/i.test(res.body.slice(0, 600));
}

/** Single-page audit: the pure analysis plus live checks (links, AI bot access, sitemap, canonical, hreflang). */
export async function auditPage(input: string): Promise<PageAuditReport> {
  const started = Date.now();
  const base = normalizeUrl(input);
  const origin = `${base.protocol}//${base.host}`;
  const [res, robotsRes, llmsRes] = await Promise.all([
    safeFetch(base.href, { maxBytes: 3_000_000, userAgent: BROWSER_UA }),
    safeFetch(`${origin}/robots.txt`, { maxBytes: 500_000 }).catch(() => null),
    safeFetch(`${origin}/llms.txt`, { maxBytes: 100_000 }).catch(() => null),
  ]);
  const robots: ParsedRobots | null = isText(robotsRes) ? parseRobots(robotsRes!.body) : null;
  const llmsTxt = isText(llmsRes) && llmsRes!.body.trim().length > 0;

  const { report, ctx } = analyzePage({
    url: input,
    finalUrl: res.finalUrl,
    status: res.status,
    headers: res.headers,
    html: res.body,
    redirects: res.redirects,
    elapsedMs: res.elapsedMs,
    bytes: res.bytes,
    truncated: res.truncated,
    robots,
    llmsTxt,
  });

  const deadline = Date.now() + ENRICH_MS;
  const [links, aiAccess, sitemap, canonical, hreflangReturns] = await Promise.all([
    ctx.isHtml ? checkLinks(ctx.$, res.finalUrl, deadline).catch(() => null) : null,
    probeAiAccess(res.finalUrl, res, robots ?? { groups: [], sitemaps: [] }, ENRICH_MS - 2_000).catch(() => null),
    checkPageInSitemap(res.finalUrl, robots, deadline).catch(() => null),
    checkCanonicalTarget(report, deadline),
    checkHreflangReturns(report, deadline),
  ]);

  if (links) {
    report.links = links;
    report.checks.push(...linkChecks(links));
  }
  if (aiAccess) {
    report.aiAccess = aiAccess;
    report.ai.checks.push(aiAccessCheck(aiAccess));
  }
  if (sitemap) {
    report.sitemap = sitemap.sitemap;
    report.checks.push(...sitemap.checks);
  }
  if (canonical) report.checks.push(canonical);
  if (hreflangReturns) report.checks.push(hreflangReturns);

  const speed = signSpeedToken(res.finalUrl);
  report.speedToken = speed.token;
  report.speedTokenExp = speed.exp;
  report.durationMs = Date.now() - started;
  return rescore(report);
}

function linkChecks(l: LinksReport): AuditCheck[] {
  const out: AuditCheck[] = [];
  const broken = l.results.filter((r) => r.state === "broken" || r.state === "error");
  const fmt = (r: LinksReport["results"][number]) => `${r.status ?? "no response"} · ${r.url} · "${r.anchor || "(no text)"}"${r.note ? ` · ${r.note}` : ""}`;
  out.push(broken.length
    ? { id: "broken-links", category: "Links", impact: 7, severity: broken.some((r) => r.internal) ? "error" : "warning", title: `${broken.length} broken link${broken.length > 1 ? "s" : ""} (of ${l.checked} checked)`, detail: "Broken links waste crawl budget, leak authority and frustrate visitors.", fix: "Update or remove each link, or redirect the dead URL to the closest live page.", items: evidence(broken.map(fmt)) }
    : { id: "broken-links", category: "Links", impact: 7, severity: "pass", title: `No broken links in ${l.checked} checked`, detail: l.budgetHit ? "Some links weren't checked before the time limit." : `${l.unique} unique links on the page; internal links checked first.` });
  const redirected = l.results.filter((r) => r.state === "redirect" && r.internal);
  if (redirected.length) out.push({ id: "redirected-links", category: "Links", impact: 3, severity: "warning", title: `${redirected.length} internal link${redirected.length > 1 ? "s" : ""} go through a redirect`, detail: "Each redirect costs a round trip and a little link equity.", fix: "Point the links straight at the final URL.", items: evidence(redirected.map((r) => `${r.url} → ${r.finalUrl ?? "?"} (${r.hops} hop${r.hops > 1 ? "s" : ""})`)) });
  return out;
}

function aiAccessCheck(a: NonNullable<PageAuditReport["aiAccess"]>): AiCheck {
  const bad = a.probes.filter((p) => p.verdict === "blocked" || p.verdict === "challenge" || p.verdict === "different" || p.verdict === "no-response");
  const badSearch = bad.filter((p) => p.purpose !== "training");
  const items = a.probes.map((p) => `${p.bot} (${p.operator}): ${p.verdict}${p.status ? ` · HTTP ${p.status}` : ""}${!p.robotsAllowed ? " · robots.txt disallows" : ""}`);
  if (badSearch.length) {
    const robotsOk = badSearch.filter((p) => p.robotsAllowed);
    return { id: "ai-live", severity: "error", weight: 25, title: `Server blocks ${badSearch.map((p) => p.bot).join(", ")}`, detail: `${robotsOk.length ? "robots.txt allows them, but the server or firewall refuses them. " : ""}${a.note}`, fix: "In your CDN/firewall (e.g. Cloudflare → Security → Bots, 'Block AI bots'), allow AI search crawlers such as OAI-SearchBot, Claude-SearchBot and PerplexityBot.", items };
  }
  if (bad.length) return { id: "ai-live", severity: "info", weight: 25, title: `Only AI training bots are refused (${bad.map((p) => p.bot).join(", ")})`, detail: `AI search and assistant bots get the page. ${a.note}`, items };
  if (a.probes.every((p) => p.verdict === "inconclusive")) return { id: "ai-live", severity: "info", weight: 0, title: "Live AI bot test inconclusive", detail: a.note, items };
  return { id: "ai-live", severity: "pass", weight: 25, title: "AI crawlers get the same page as browsers", detail: a.note, items };
}

async function checkCanonicalTarget(report: PageAuditReport, deadline: number): Promise<AuditCheck | null> {
  const canonical = report.facts.canonical;
  if (!canonical || urlKey(canonical) === urlKey(report.finalUrl)) return null;
  const p = await tryFetch(canonical, { maxBytes: 400_000, userAgent: BROWSER_UA, maxRedirects: 0 }, Math.max(1_000, deadline - Date.now()));
  if (!p.ok) return { id: "canonical-target", category: "Indexability", impact: 6, severity: "warning", title: "Canonical target could not be fetched", detail: `${canonical}: ${p.error}`, fix: "Make sure the canonical URL is live and returns 200." };
  const { status, headers, body } = p.res;
  const noindex = /noindex/i.test(headers["x-robots-tag"] ?? "") || /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(body);
  if (status >= 300 && status < 400) return { id: "canonical-target", category: "Indexability", impact: 6, severity: "error", title: `Canonical points to a redirect (HTTP ${status})`, detail: `${canonical} → ${headers.location ?? "?"}`, fix: "Canonicalise to the final URL, not one that redirects." };
  if (status >= 400) return { id: "canonical-target", category: "Indexability", impact: 6, severity: "error", title: `Canonical points to a broken URL (HTTP ${status})`, detail: canonical, fix: "Point the canonical at a live, indexable URL (usually this page itself)." };
  if (noindex) return { id: "canonical-target", category: "Indexability", impact: 6, severity: "error", title: "Canonical points to a noindex page", detail: canonical, fix: "Conflicting signals: canonicalise to an indexable URL." };
  return { id: "canonical-target", category: "Indexability", impact: 6, severity: "info", title: "Canonical points to another live page", detail: `${canonical} returns ${status}. This page asks to be dropped in favour of it; make sure that's intended.` };
}

async function checkHreflangReturns(report: PageAuditReport, deadline: number): Promise<AuditCheck | null> {
  const entries = report.hreflang?.entries.filter((e) => e.valid && e.href && urlKey(e.href) !== urlKey(report.finalUrl)) ?? [];
  if (!entries.length) return null;
  const sample = entries.slice(0, 6);
  const self = urlKey(report.finalUrl);
  await Promise.all(
    sample.map(async (e) => {
      const p = await tryFetch(e.href, { maxBytes: 1_000_000, userAgent: BROWSER_UA }, Math.max(1_000, deadline - Date.now()));
      if (!p.ok) return;
      const links = [...p.res.body.matchAll(/<link[^>]+hreflang=[^>]*>/gi)].map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1]).filter(Boolean) as string[];
      e.returnLink = links.some((h) => {
        try {
          return urlKey(new URL(h, e.href).href) === self;
        } catch {
          return false;
        }
      });
    }),
  );
  const missing = sample.filter((e) => e.returnLink === false);
  if (!missing.length) return sample.some((e) => e.returnLink) ? { id: "hreflang-return", category: "Indexability", impact: 3, severity: "pass", title: `hreflang return links confirmed (${sample.filter((e) => e.returnLink).length} sampled)`, detail: "The alternates link back to this page." } : null;
  return { id: "hreflang-return", category: "Indexability", impact: 3, severity: "error", title: `${missing.length} alternate${missing.length > 1 ? "s" : ""} don't link back`, detail: "hreflang only works when every page in the set references the others; Google ignores one-way annotations.", fix: "Add the same full hreflang set to every language version.", items: missing.map((e) => `${e.lang} → ${e.href}`) };
}
