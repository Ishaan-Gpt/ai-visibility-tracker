import type { PageExtract } from "@/lib/tools/pageExtract/types";
import { sameUrl, type TagSet } from "./fields";
import type { ImageFacts } from "./socialRules";

export type LiveStatus = "missing" | "changed" | "same";

export interface TagLine {
  key: string;
  html: string;
  value: string;
  group: "search" | "og" | "x" | "brand";
  /** Compared with the loaded page (absent in "Write tags" mode). */
  status?: LiveStatus;
}

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;");

/** "en-GB" → "en_GB"; a bare language has no safe territory, so it's skipped. */
export function ogLocale(lang: string) {
  const m = lang.trim().match(/^([a-z]{2,3})[-_]([a-z]{2})$/i);
  return m ? `${m[1].toLowerCase()}_${m[2].toUpperCase()}` : "";
}

function liveValue(page: PageExtract, key: string): string {
  const firstOf = (r: Record<string, string[]>, ...ks: string[]) => ks.map((k) => r[k]?.find((v) => v.trim())).find(Boolean)?.trim() ?? "";
  if (key === "title") return page.titles[0] ?? "";
  if (key === "description") return page.metaDescriptions[0] ?? "";
  if (key === "canonical") return page.canonicals[0] ?? "";
  if (key === "theme-color") return page.themeColor ?? "";
  if (key.startsWith("og:")) return firstOf(page.og, key, ...(key === "og:image" ? ["og:image:url", "og:image:secure_url"] : []));
  if (key.startsWith("twitter:")) return firstOf(page.twitter, key, ...(key === "twitter:image" ? ["twitter:image:src", "twitter:image:url"] : []));
  return "";
}

export function buildTagLines(t: TagSet, opts: { ogFacts?: ImageFacts; page: PageExtract | null }): TagLine[] {
  const lines: TagLine[] = [];
  const meta = (group: TagLine["group"], attr: "name" | "property", key: string, value: string) => {
    if (value) lines.push({ key, group, value, html: `<meta ${attr}="${key}" content="${escAttr(value)}">` });
  };

  if (t.title) lines.push({ key: "title", group: "search", value: t.title, html: `<title>${escText(t.title)}</title>` });
  meta("search", "name", "description", t.description);
  if (t.canonical) lines.push({ key: "canonical", group: "search", value: t.canonical, html: `<link rel="canonical" href="${escAttr(t.canonical)}">` });

  meta("og", "property", "og:type", t.ogType);
  meta("og", "property", "og:site_name", t.siteName);
  meta("og", "property", "og:title", t.ogTitle);
  meta("og", "property", "og:description", t.ogDescription);
  meta("og", "property", "og:url", t.ogUrl);
  meta("og", "property", "og:image", t.ogImage);
  const f = opts.ogFacts;
  if (t.ogImage && f?.state === "ok" && f.width && f.height) {
    meta("og", "property", "og:image:width", String(f.width));
    meta("og", "property", "og:image:height", String(f.height));
  }
  if (t.ogImage) meta("og", "property", "og:image:alt", t.ogImageAlt);
  meta("og", "property", "og:locale", ogLocale(t.lang));

  meta("x", "name", "twitter:card", t.twitterCard);
  meta("x", "name", "twitter:title", t.twitterTitle);
  meta("x", "name", "twitter:description", t.twitterDescription);
  meta("x", "name", "twitter:image", t.twitterImage);
  if (t.twitterImage) meta("x", "name", "twitter:image:alt", t.twitterImageAlt);

  meta("brand", "name", "theme-color", t.themeColor);

  const page = opts.page;
  if (page) {
    for (const l of lines) {
      const live = liveValue(page, l.key);
      l.status = !live ? "missing" : l.key === "canonical" || l.key === "og:url" ? (sameUrl(live, l.value) ? "same" : "changed") : live.trim() === l.value.trim() ? "same" : "changed";
    }
  }
  return lines;
}

const COMMENT: Record<TagLine["group"], string> = {
  search: "<!-- Search -->",
  og: "<!-- Open Graph: Facebook, LinkedIn, WhatsApp, Slack, Discord -->",
  x: "<!-- X (Twitter) -->",
  brand: "<!-- Browser and Discord accent -->",
};

export function renderBlock(lines: TagLine[]): string {
  const out: string[] = [];
  let group: TagLine["group"] | null = null;
  for (const l of lines) {
    if (l.group !== group) {
      if (group) out.push("");
      out.push(COMMENT[l.group]);
      group = l.group;
    }
    out.push(l.html);
  }
  return out.join("\n");
}
