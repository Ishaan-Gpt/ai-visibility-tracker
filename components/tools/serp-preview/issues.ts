import type { PageExtract } from "@/lib/tools/pageExtract/types";
import { isAbsoluteHttp, sameUrl, type TagSet } from "./fields";
import type { ImageFacts } from "./socialRules";
import { SERP, type Snippet } from "./serpMetrics";

export type IssueSeverity = "error" | "warning" | "info";

export interface Issue {
  id: string;
  severity: IssueSeverity;
  title: string;
  /** One line: why it matters. */
  why: string;
  fix: string;
  /** Evidence, e.g. the conflicting values. */
  detail?: string;
}

export interface IssueInput {
  mode: "manual" | "url";
  tags: TagSet;
  page: PageExtract | null;
  ogFacts?: ImageFacts;
  xFacts?: ImageFacts;
  desktop: Snippet;
  mobile: Snippet;
}

const RANK: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };
const VALID_CARDS = ["summary", "summary_large_image", "app", "player"];
const kb = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export function computeIssues({ mode, tags: t, page, ogFacts, xFacts, desktop, mobile }: IssueInput): Issue[] {
  const out: Issue[] = [];
  const add = (i: Issue) => out.push(i);
  const live = mode === "url" && page ? page : null;

  /* ---- fetch sanity ---- */
  if (live && live.status !== 200) {
    add({
      id: "status",
      severity: live.status >= 400 ? "error" : "warning",
      title: `The page answered HTTP ${live.status}`,
      why: live.status === 403 || live.status === 429 ? "It probably blocked our fetcher, so the tags below may be from a block page, not your real page." : "Crawlers expect a 200 response before they read any tags.",
      fix: "Make sure the URL returns 200 to bots (Googlebot, facebookexternalhit, Twitterbot) and load it again.",
    });
  }

  /* ---- title ---- */
  if (!t.title) {
    add({ id: "title-missing", severity: "error", title: "No <title> tag", why: "Google will invent a title from headings or links, and shares fall back to the URL.", fix: "Write a title of roughly 50–60 characters that leads with the topic." });
  } else if (desktop.title.truncated) {
    add({
      id: "title-long",
      severity: "warning",
      title: `Title is ${Math.round(-desktop.title.remainingPx)}px too wide for desktop`,
      why: `Google cuts it at about ${SERP.desktop.titleWidth}px, so searchers see "${desktop.title.shown}".`,
      fix: "Move the important words to the front or trim filler like the brand suffix.",
    });
  } else if (desktop.title.usedPx < SERP.shortTitlePx) {
    add({ id: "title-short", severity: "info", title: "Title is short", why: `It uses ${Math.round(desktop.title.usedPx)}px of about ${SERP.desktop.titleWidth}px; Google is more likely to rewrite thin titles.`, fix: "Add a qualifier searchers care about (year, audience, benefit) or your brand." });
  }
  if (t.title && !desktop.title.truncated && mobile.title.truncated) {
    add({ id: "title-mobile", severity: "info", title: "Title wraps past two lines on mobile", why: "On phones the end of the title will be cut.", fix: "Shorten slightly so it fits two lines at 360px." });
  }

  /* ---- description ---- */
  const descChars = t.description.length;
  if (!t.description) {
    add({ id: "desc-missing", severity: "warning", title: "No meta description", why: "Google will pull a snippet from the page text, which is often a cookie banner or menu.", fix: "Write 120–155 characters that answer the query and invite the click." });
  } else if (desktop.description.truncated) {
    add({
      id: "desc-long",
      severity: "warning",
      title: `Description is ${Math.round(-desktop.description.remainingPx)}px over on desktop`,
      why: `Google shows about ${SERP.desktop.descBudget}px (two lines) and cuts the rest with "...".`,
      fix: "Put the key message in the first ~150 characters; the cut-off part only helps Google, not the click.",
    });
  } else if (desktop.description.usedPx < SERP.shortDescPx || descChars < SERP.shortDescChars) {
    add({ id: "desc-short", severity: "warning", title: "Description is short", why: `At ${descChars} characters Google tends to replace it with text from the page.`, fix: "Aim for 120–155 characters (about 680–920px)." });
  }
  if (t.description && !desktop.description.truncated && mobile.description.truncated) {
    add({ id: "desc-mobile", severity: "info", title: "Description is cut on mobile", why: `Mobile snippets fit about ${SERP.mobile.descBudget}px.`, fix: "Keep the core message in the first ~120 characters." });
  }

  /* ---- live-page structure ---- */
  if (live) {
    if (live.titles.length > 1) add({ id: "title-dup", severity: "warning", title: `${live.titles.length} <title> tags on the page`, why: "Browsers and crawlers use the first one; the rest are usually a template bug.", fix: "Keep exactly one <title> inside <head>.", detail: live.titles.map((x, i) => `${i + 1}. ${x}`).join("\n") });
    if (live.metaDescriptions.length > 1) add({ id: "desc-dup", severity: "warning", title: `${live.metaDescriptions.length} meta descriptions on the page`, why: "Google may pick either one, or ignore both.", fix: "Keep a single <meta name=\"description\">.", detail: live.metaDescriptions.map((x, i) => `${i + 1}. ${x}`).join("\n") });

    const canon = [...new Set(live.canonicals)];
    if (live.canonicals.length === 0) add({ id: "canonical-missing", severity: "warning", title: "No canonical link", why: "Without it, URL variants (tracking parameters, trailing slashes) can split ranking signals.", fix: `Add <link rel="canonical" href="${live.finalUrl}">.` });
    else if (canon.length > 1) add({ id: "canonical-conflict", severity: "error", title: "Conflicting canonical links", why: "When canonicals disagree, Google ignores all of them.", fix: "Output exactly one canonical.", detail: canon.join("\n") });
    else if (live.canonicals.length > 1) add({ id: "canonical-dup", severity: "info", title: `Canonical declared ${live.canonicals.length} times`, why: "They agree, so it's harmless, but it points to duplicated head output.", fix: "Remove the extra copy." });

    const nameOg = live.metaTags.filter((m) => m.attr === "name" && /^og:/i.test(m.key));
    if (nameOg.length) add({ id: "og-name-attr", severity: "warning", title: `${nameOg.length} Open Graph tag${nameOg.length > 1 ? "s use" : " uses"} name= instead of property=`, why: "The Open Graph spec uses property=; Facebook's parser can skip name= tags.", fix: 'Write them as <meta property="og:…" content="…">.', detail: nameOg.map((m) => m.key).join(", ") });

    const ogImages = live.og["og:image"]?.filter(Boolean) ?? [];
    if (ogImages.length > 1) add({ id: "og-image-multi", severity: "info", title: `${ogImages.length} og:image tags`, why: "Most platforms take the first one, so make sure it's the best image.", fix: "List the preferred share image first.", detail: ogImages.join("\n") });

    const robots = [...live.robots.meta, ...live.robots.googlebot, live.robots.xRobotsTag ?? ""].join(",").toLowerCase();
    if (/noindex/.test(robots)) add({ id: "noindex", severity: "info", title: "The page is set to noindex", why: "Google won't show it in search at all, so the snippet above will never appear.", fix: "Remove noindex if this page should rank." });
    if (!live.lang) add({ id: "lang", severity: "info", title: "No lang attribute on <html>", why: "Search engines and screen readers guess the language instead.", fix: 'Add <html lang="en"> (or your language), and og:locale for social.' });
    if (!live.twitter["twitter:image"]?.length && live.twitter["twitter:image:src"]?.length) add({ id: "tw-src", severity: "info", title: "Uses the legacy twitter:image:src", why: "twitter:image is the documented name.", fix: "Rename it to twitter:image." });
  }

  /* ---- canonical vs og:url ---- */
  if (t.canonical && t.ogUrl && !sameUrl(t.canonical, t.ogUrl)) add({ id: "ogurl-canonical", severity: "warning", title: "og:url doesn't match the canonical", why: "Likes and shares get counted against a different URL than the one Google ranks.", fix: "Set og:url to the canonical URL.", detail: `canonical: ${t.canonical}\nog:url: ${t.ogUrl}` });

  /* ---- Open Graph presence (only meaningful for a live page; generated tags fill these in) ---- */
  if (mode === "url") {
    if (!t.ogTitle) add({ id: "og-title", severity: "warning", title: "Missing og:title", why: "Facebook, LinkedIn and WhatsApp fall back to <title>, which is often written for Google, not for a feed.", fix: "Add og:title (it's in the tag block below)." });
    if (!t.ogDescription) add({ id: "og-desc", severity: "warning", title: "Missing og:description", why: "Shares fall back to the meta description or show nothing.", fix: "Add og:description." });
    if (!t.ogUrl) add({ id: "og-url", severity: "info", title: "Missing og:url", why: "Platforms use the shared URL, so tracking parameters can split share counts.", fix: "Add og:url with the canonical URL." });
    if (!t.ogType) add({ id: "og-type", severity: "info", title: "Missing og:type", why: "Facebook assumes website; articles and products lose their richer treatment.", fix: 'Add og:type ("article" for posts, "website" otherwise).' });
    if (!t.siteName) add({ id: "og-site", severity: "info", title: "Missing og:site_name", why: "Slack and Discord show it above the title; without it they show the bare domain.", fix: "Add og:site_name with your brand name." });
  }

  /* ---- og:image ---- */
  if (!t.ogImage) {
    add({ id: "og-image-missing", severity: "error", title: "No og:image", why: "Shares on Facebook, LinkedIn, WhatsApp and Slack show no picture, which cuts clicks sharply.", fix: "Add a 1200×630 JPG or PNG as og:image (absolute https URL)." });
  } else {
    if (!isAbsoluteHttp(t.ogImage)) add({ id: "og-image-relative", severity: "error", title: "og:image is a relative URL", why: "Crawlers don't resolve relative paths, so the image is ignored.", fix: "Use the full URL starting with https://.", detail: t.ogImage });
    else if (/^http:\/\//i.test(t.ogImage)) add({ id: "og-image-http", severity: "warning", title: "og:image uses http://", why: "Some platforms refuse insecure images or show a blank thumbnail.", fix: "Serve the image over https (or add og:image:secure_url)." });

    const f = ogFacts;
    if (f && f.state === "error") {
      add({
        id: "og-image-broken",
        severity: f.source === "probe" ? "error" : "warning",
        title: f.source === "probe" ? `og:image can't be fetched${f.httpStatus ? ` (HTTP ${f.httpStatus})` : ""}` : "og:image didn't load in your browser",
        why: f.source === "probe" ? "Social crawlers will get the same error and show no image." : "It may be a typo, or the host blocks hot-linking. Platforms fetch it server-side, so check the URL.",
        fix: "Check the URL opens directly in a new tab and returns an image.",
        detail: f.error ?? f.url,
      });
    } else if (f && f.state === "ok") {
      if (f.contentType && !/^image\//i.test(f.contentType)) add({ id: "og-image-type", severity: "error", title: "og:image isn't an image", why: `The server returned ${f.contentType}.`, fix: "Point og:image at the image file itself, not a page." });
      if (f.format === "svg" || /svg/i.test(f.contentType ?? "") || /\.svg(\?|$)/i.test(f.url)) add({ id: "og-image-svg", severity: "error", title: "og:image is an SVG", why: "Facebook, LinkedIn, X and WhatsApp don't render SVG previews.", fix: "Export it as a 1200×630 PNG or JPG." });
      if (f.width && f.height) {
        const { width: w, height: h } = f;
        if (w < 200 || h < 200) add({ id: "og-image-tiny", severity: "error", title: `og:image is only ${w}×${h}`, why: "Facebook requires at least 200×200 and drops smaller images.", fix: "Use 1200×630." });
        else if (w < 1140 || h < 598) add({ id: "og-image-small", severity: "warning", title: `og:image is ${w}×${h}, below 1200×630`, why: "It will look soft on high-density screens, and some platforms show a small thumbnail instead.", fix: "Export at 1200×630 (or larger at the same ratio)." });
        const ratio = w / h;
        const dev = Math.abs(ratio - 1.91) / 1.91;
        if (dev > 0.1) {
          const lost = ratio < 1.91 ? Math.round((1 - ratio / 1.91) * 100) : Math.round((1 - 1.91 / ratio) * 100);
          add({ id: "og-image-ratio", severity: "warning", title: `og:image is ${ratio.toFixed(2)}:1, not 1.91:1`, why: `Facebook and LinkedIn crop it to 1.91:1, cutting about ${lost}% of the ${ratio < 1.91 ? "height" : "width"}.`, fix: "Design the share image at 1200×630 and keep text away from the edges." });
        }
      }
      if (f.bytes !== null) {
        if (f.bytes > 8 * 1024 * 1024) add({ id: "og-image-8mb", severity: "error", title: `og:image is ${kb(f.bytes)}`, why: "Facebook rejects images over 8 MB.", fix: "Compress it (a 1200×630 JPG is usually 100–300 KB)." });
        else if (f.bytes > 5 * 1024 * 1024) add({ id: "og-image-5mb", severity: "warning", title: `og:image is ${kb(f.bytes)}`, why: "X rejects card images over 5 MB.", fix: "Compress it under 1 MB." });
        else if (f.bytes > 600 * 1024) add({ id: "og-image-wa", severity: "info", title: `og:image is ${kb(f.bytes)}`, why: "WhatsApp often skips preview images larger than about 600 KB.", fix: "Compress it to under 300 KB if WhatsApp shares matter." });
      }
      if (live) {
        const dw = Number(live.og["og:image:width"]?.[0]);
        const dh = Number(live.og["og:image:height"]?.[0]);
        if (dw && dh && f.width && f.height && (dw !== f.width || dh !== f.height)) add({ id: "og-image-declared", severity: "info", title: "og:image:width/height don't match the file", why: `Declared ${dw}×${dh}, the file is ${f.width}×${f.height}. Facebook uses the declared size for its first render.`, fix: "Update the declared size or remove it." });
      }
    }
    if (!t.ogImageAlt) add({ id: "og-image-alt", severity: "info", title: "No og:image:alt", why: "Screen-reader users on X, LinkedIn and Facebook get no description of the image.", fix: "Describe the image in one sentence as og:image:alt (and twitter:image:alt)." });
  }

  /* ---- X ---- */
  const card = t.twitterCard.trim().toLowerCase();
  if (!card) add({ id: "tw-card-missing", severity: mode === "url" ? "warning" : "info", title: "No twitter:card", why: "X falls back to a small summary card even when you have a great image.", fix: 'Add <meta name="twitter:card" content="summary_large_image">.' });
  else if (!VALID_CARDS.includes(card)) add({ id: "tw-card-invalid", severity: "error", title: `twitter:card "${t.twitterCard}" isn't valid`, why: "X ignores unknown card types.", fix: "Use summary, summary_large_image, app or player." });
  else if (card === "summary_large_image" && !t.twitterImage && !t.ogImage) add({ id: "tw-card-noimage", severity: "warning", title: "Large card without an image", why: "summary_large_image needs twitter:image or og:image.", fix: "Add an image or switch to summary." });
  if (card === "summary_large_image" && xFacts?.state === "ok" && xFacts.width && xFacts.height && (xFacts.width < 300 || xFacts.height < 157)) {
    add({ id: "tw-image-small", severity: "warning", title: `X image is ${xFacts.width}×${xFacts.height}`, why: "Large cards need at least 300×157.", fix: "Use a 1200×628 (2:1-ish) image." });
  }
  if (card === "summary_large_image" && xFacts?.state === "ok" && xFacts.width && xFacts.height && xFacts.url !== ogFacts?.url) {
    const r = xFacts.width / xFacts.height;
    if (Math.abs(r - 2) / 2 > 0.15) add({ id: "tw-image-ratio", severity: "info", title: `twitter:image is ${r.toFixed(2)}:1`, why: "X crops large-card images to about 2:1, so the edges of this image will be cut.", fix: "Use a 1200×628 image for twitter:image, or drop it so X uses og:image." });
  }
  if (xFacts && xFacts !== ogFacts && xFacts.state === "ok" && xFacts.bytes && xFacts.bytes > 5 * 1024 * 1024) add({ id: "tw-image-5mb", severity: "warning", title: `twitter:image is ${kb(xFacts.bytes)}`, why: "X rejects card images over 5 MB.", fix: "Compress it." });

  /* ---- brand ---- */
  if (!t.themeColor) add({ id: "theme-color", severity: "info", title: "No theme-color", why: "Discord uses it for the embed's side stripe; mobile browsers tint their toolbar with it.", fix: 'Add <meta name="theme-color" content="#yourBrand">.' });

  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}

export function verdict(issues: Issue[]) {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  if (errors) return { lead: "Needs a few", accent: "fixes", body: `${errors} problem${errors > 1 ? "s" : ""} will visibly hurt how this page looks in search or when shared.`, errors, warnings };
  if (warnings) return { lead: "Almost", accent: "there", body: `Nothing is broken; ${warnings} refinement${warnings > 1 ? "s" : ""} will make the result sharper.`, errors, warnings };
  return { lead: "Ready to", accent: "share", body: "Search and social previews have everything they need.", errors, warnings };
}
