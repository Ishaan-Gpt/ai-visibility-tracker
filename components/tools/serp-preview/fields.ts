import type { PageExtract } from "@/lib/tools/pageExtract/types";
import { isoDay, parseUrl } from "./serpMetrics";

/** Everything the user can edit. Social fields left empty mean "not set" (platform fallbacks apply). */
export interface MetaFields {
  title: string;
  description: string;
  /** Page URL, also used as the canonical. */
  url: string;
  siteName: string;
  favicon: string;
  keyword: string;
  /** yyyy-mm-dd or an ISO date string. */
  published: string;
  showDate: boolean;

  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageAlt: string;
  ogUrl: string;
  ogType: string;

  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterImageAlt: string;

  themeColor: string;
  lang: string;
}

export type FieldKey = keyof MetaFields;

/** The tag values a crawler would read. In "Write tags" mode these are the generated tags; from a URL, the live page (plus edits). */
export interface TagSet {
  title: string;
  description: string;
  canonical: string;
  siteName: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageAlt: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterImageAlt: string;
  themeColor: string;
  lang: string;
  favicon: string;
}

export function emptyFields(): MetaFields {
  return {
    title: "",
    description: "",
    url: "",
    siteName: "",
    favicon: "",
    keyword: "",
    published: "",
    showDate: false,
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogImageAlt: "",
    ogUrl: "",
    ogType: "",
    twitterCard: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    twitterImageAlt: "",
    themeColor: "",
    lang: "",
  };
}

export function defaultFields(brandName: string, domain: string): MetaFields {
  const host = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "yoursite.com";
  return {
    ...emptyFields(),
    title: `${brandName || "Your Brand"} | Your main value proposition`,
    description: "",
    url: `https://${host}/`,
    siteName: brandName || "",
  };
}

const first = (r: Record<string, string[]>, ...keys: string[]) => {
  for (const k of keys) {
    const v = r[k]?.find((x) => x.trim());
    if (v) return v.trim();
  }
  return "";
};

/** Maps the live page onto editable fields, literally: empty means the page does not set it. */
export function fieldsFromPage(page: PageExtract, keep: Pick<MetaFields, "keyword">): MetaFields {
  const published = page.dates.published ?? "";
  return {
    title: page.titles[0] ?? "",
    description: page.metaDescriptions[0] ?? "",
    url: page.canonicals[0] || page.finalUrl,
    siteName: first(page.og, "og:site_name"),
    favicon: page.favicon ?? "",
    keyword: keep.keyword,
    published: isoDay(published) || published,
    showDate: !!published,
    ogTitle: first(page.og, "og:title"),
    ogDescription: first(page.og, "og:description"),
    ogImage: first(page.og, "og:image", "og:image:url", "og:image:secure_url"),
    ogImageAlt: first(page.og, "og:image:alt"),
    ogUrl: first(page.og, "og:url"),
    ogType: first(page.og, "og:type"),
    twitterCard: first(page.twitter, "twitter:card"),
    twitterTitle: first(page.twitter, "twitter:title"),
    twitterDescription: first(page.twitter, "twitter:description"),
    twitterImage: first(page.twitter, "twitter:image", "twitter:image:src", "twitter:image:url"),
    twitterImageAlt: first(page.twitter, "twitter:image:alt"),
    themeColor: page.themeColor ?? "",
    lang: page.lang ?? "",
  };
}

/** Literal tags (what the page / the fields actually say). */
export function literalTags(f: MetaFields): TagSet {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    canonical: f.url.trim(),
    siteName: f.siteName.trim(),
    ogTitle: f.ogTitle.trim(),
    ogDescription: f.ogDescription.trim(),
    ogImage: f.ogImage.trim(),
    ogImageAlt: f.ogImageAlt.trim(),
    ogUrl: f.ogUrl.trim(),
    ogType: f.ogType.trim(),
    twitterCard: f.twitterCard.trim(),
    twitterTitle: f.twitterTitle.trim(),
    twitterDescription: f.twitterDescription.trim(),
    twitterImage: f.twitterImage.trim(),
    twitterImageAlt: f.twitterImageAlt.trim(),
    themeColor: f.themeColor.trim(),
    lang: f.lang.trim(),
    favicon: f.favicon.trim(),
  };
}

/** The complete set we generate: every empty social tag inherits from the search fields. */
export function derivedTags(f: MetaFields): TagSet {
  const t = literalTags(f);
  const url = canonicalUrl(t.canonical);
  const ogTitle = t.ogTitle || t.title;
  const ogDescription = t.ogDescription || t.description;
  const ogImage = t.ogImage;
  const image = t.twitterImage || ogImage;
  return {
    ...t,
    canonical: url,
    ogTitle,
    ogDescription,
    ogUrl: t.ogUrl || url,
    ogType: t.ogType || "website",
    ogImageAlt: t.ogImageAlt,
    twitterCard: t.twitterCard || (image ? "summary_large_image" : "summary"),
    twitterTitle: t.twitterTitle || ogTitle,
    twitterDescription: t.twitterDescription || ogDescription,
    twitterImage: t.twitterImage || ogImage,
    twitterImageAlt: t.twitterImageAlt || t.ogImageAlt,
  };
}

/** "yoursite.com/pricing" → "https://yoursite.com/pricing". */
export function canonicalUrl(raw: string) {
  const u = parseUrl(raw);
  return u ? u.toString() : raw.trim();
}

export function hostOf(raw: string) {
  return parseUrl(raw)?.host ?? raw.replace(/^https?:\/\//, "").split("/")[0];
}

export function bareHost(raw: string) {
  return hostOf(raw).replace(/^www\./, "");
}

/** Resolves a possibly relative URL against the page URL. */
export function resolveUrl(raw: string, base: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    return new URL(s, parseUrl(base)?.toString() ?? undefined).toString();
  } catch {
    return s;
  }
}

export function isAbsoluteHttp(raw: string) {
  return /^https?:\/\//i.test(raw.trim());
}

/** Loose URL equality: same scheme+host (case-insensitive), path with or without trailing slash, same query. */
export function sameUrl(a: string, b: string) {
  const x = parseUrl(a);
  const y = parseUrl(b);
  if (!x || !y) return a.trim() === b.trim();
  const norm = (u: URL) => `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, "") || "/"}${u.search}`;
  return norm(x) === norm(y);
}

/* ---------------- draft persistence (manual fields only) ---------------- */

const KEY = (domain: string) => `seowise.serpPreview.v2:${domain || "public"}`;

export function loadDraft(domain: string): MetaFields | null {
  try {
    const raw = window.localStorage.getItem(KEY(domain));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MetaFields>;
    const base = emptyFields();
    const out = { ...base };
    for (const k of Object.keys(base) as FieldKey[]) {
      const v = parsed[k];
      if (typeof v === typeof base[k]) (out as Record<FieldKey, unknown>)[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

export function saveDraft(domain: string, f: MetaFields) {
  try {
    window.localStorage.setItem(KEY(domain), JSON.stringify(f));
  } catch {
    /* storage full or blocked: the draft just won't survive a reload */
  }
}

export function clearDraft(domain: string) {
  try {
    window.localStorage.removeItem(KEY(domain));
  } catch {
    /* ignore */
  }
}
