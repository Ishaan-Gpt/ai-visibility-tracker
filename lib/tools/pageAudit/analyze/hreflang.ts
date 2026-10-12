import type { HreflangReport } from "../types";
import { abs, add, evidence, type Ctx } from "./context";

// language[-script][-region] per BCP 47 as Google accepts it, plus x-default.
const LANG = /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i;
const BAD_REGION = /^en-uk$/i;

/** Static hreflang checks from <link rel=alternate hreflang>. Return links are verified by an enricher in single-page mode. */
export function hreflang(ctx: Ctx): HreflangReport | undefined {
  const { $, input } = ctx;
  const entries = $('link[rel~="alternate"][hreflang]')
    .map((_, el) => {
      const lang = ($(el).attr("hreflang") ?? "").trim();
      const href = abs($(el).attr("href"), input.finalUrl);
      let problem: string | undefined;
      if (!href) problem = "Missing or invalid href";
      else if (!LANG.test(lang)) problem = `"${lang}" is not a valid language-region code`;
      else if (BAD_REGION.test(lang)) problem = 'Use "en-GB", not "en-UK"';
      else if (ctx.isHttps && href.startsWith("http://")) problem = "Points to an http:// URL";
      return { lang, href: href ?? "", valid: !problem, problem, returnLink: null };
    })
    .get();
  if (!entries.length) return undefined;

  const self = (u: string) => u.replace(/#.*$/, "").replace(/\/$/, "") === input.finalUrl.replace(/#.*$/, "").replace(/\/$/, "");
  const selfReference = entries.some((e) => e.href && self(e.href));
  const xDefault = entries.some((e) => e.lang.toLowerCase() === "x-default");
  const seen = new Map<string, number>();
  for (const e of entries) seen.set(e.lang.toLowerCase(), (seen.get(e.lang.toLowerCase()) ?? 0) + 1);
  const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([l]) => l);

  const invalid = entries.filter((e) => !e.valid);
  const problems = [
    ...invalid.map((e) => `${e.lang || "(empty)"} → ${e.href || "(no href)"}: ${e.problem}`),
    ...(!selfReference ? ["No entry points back to this page itself (self-reference is required)"] : []),
    ...dupes.map((l) => `"${l}" is declared more than once`),
  ];
  add(ctx, problems.length
    ? { id: "hreflang", category: "Indexability", impact: 4, severity: invalid.length || !selfReference ? "error" : "warning", title: `hreflang: ${problems.length} problem${problems.length > 1 ? "s" : ""} in ${entries.length} alternates`, detail: "Google ignores hreflang sets with invalid codes or missing self-references, so the wrong language version can rank.", fix: "Use valid ISO 639-1 language (+ ISO 3166-1 region) codes, include this page in its own set, and list each language once.", items: evidence(problems) }
    : { id: "hreflang", category: "Indexability", impact: 4, severity: "pass", title: `hreflang: ${entries.length} valid alternates`, detail: `Self-reference present${xDefault ? ", x-default set" : ""}.`, items: entries.map((e) => `${e.lang} → ${e.href}`) });
  if (!xDefault) add(ctx, { id: "hreflang-xdefault", category: "Indexability", impact: 1, severity: "info", title: "No x-default hreflang", detail: "x-default tells Google which version to show users whose language you don't target.", fix: 'Add <link rel="alternate" hreflang="x-default" href="…"> pointing at your language selector or main version.' });

  return { entries, selfReference, xDefault };
}
