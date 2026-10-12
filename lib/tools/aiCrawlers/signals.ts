import * as cheerio from "cheerio";

export interface RobotsDirectiveSource {
  /** "meta:robots", "meta:googlebot", "header" … */
  source: string;
  value: string;
}

export interface PageSignals {
  /** Every robots meta tag / X-Robots-Tag value found on the homepage. */
  directives: RobotsDirectiveSource[];
  noindex: boolean;
  nosnippet: boolean;
  /** Lowest max-snippet value found (-1 = unlimited). null = not set. */
  maxSnippet: number | null;
  noai: boolean;
  noimageai: boolean;
  /** Elements marked data-nosnippet (excluded from Google snippets and AI Overviews). */
  dataNosnippet: number;
  /** TDM Reservation Protocol: header or meta value ("1" = rights reserved). */
  tdmReservation: string | null;
  tdmPolicy: string | null;
}

const AGENT_META = /^(robots|googlebot|googlebot-news|bingbot|gptbot|oai-searchbot|chatgpt-user|claudebot|perplexitybot|ccbot|google-extended)$/i;

/** Reads homepage robots directives that affect search and AI snippet use. */
export function readPageSignals(html: string, headers: Record<string, string>): PageSignals {
  const directives: RobotsDirectiveSource[] = [];
  let dataNosnippet = 0;
  let tdmMeta: string | null = null;
  let tdmPolicyMeta: string | null = null;
  if (html) {
    const $ = cheerio.load(html.slice(0, 600_000));
    $("meta[name]").each((_, el) => {
      const name = ($(el).attr("name") ?? "").trim();
      const content = ($(el).attr("content") ?? "").trim();
      if (AGENT_META.test(name) && content) directives.push({ source: `meta:${name.toLowerCase()}`, value: content });
      if (/^tdm-reservation$/i.test(name)) tdmMeta = content;
      if (/^tdm-policy$/i.test(name)) tdmPolicyMeta = content;
    });
    dataNosnippet = $("[data-nosnippet]").length;
  }
  const xrt = headers["x-robots-tag"];
  if (xrt) for (const part of xrt.split(/,(?=\s*[a-z-]+\s*:)|\n/i)) if (part.trim()) directives.push({ source: "header:x-robots-tag", value: part.trim() });

  // Directives aimed at a specific agent ("googlebot: nosnippet") still count: Google is the main consumer of snippet rules.
  const tokens = directives.flatMap((d) =>
    d.value
      .toLowerCase()
      .replace(/^[a-z-]+\s*:\s*(?=[a-z])/i, (m) => (/(max-snippet|max-image-preview|max-video-preview|unavailable_after)/.test(m) ? m : ""))
      .split(/\s*,\s*/),
  );
  let maxSnippet: number | null = null;
  for (const t of tokens) {
    const m = t.match(/max-snippet\s*:\s*(-?\d+)/);
    if (m) {
      const n = Number(m[1]);
      maxSnippet = maxSnippet === null ? n : n === -1 ? maxSnippet : maxSnippet === -1 ? n : Math.min(maxSnippet, n);
    }
  }
  const has = (w: string) => tokens.some((t) => t.trim() === w);
  return {
    directives,
    noindex: has("noindex") || has("none"),
    nosnippet: has("nosnippet"),
    maxSnippet,
    noai: has("noai"),
    noimageai: has("noimageai"),
    dataNosnippet,
    tdmReservation: headers["tdm-reservation"] ?? tdmMeta,
    tdmPolicy: headers["tdm-policy"] ?? tdmPolicyMeta,
  };
}
