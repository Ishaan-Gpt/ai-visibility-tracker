import type { Cheerio } from "cheerio";
import type { Element } from "domhandler";
import type { AltState, ImageInfo, ImagesReport } from "../types";
import { abs, add, clip, evidence, type Ctx } from "./context";

/** Lazy-load attributes used by common libraries/themes (lazysizes, WP Rocket, Salient/Nectar, jQuery lazyload…). */
const LAZY_ATTRS = ["data-src", "data-lazy-src", "data-nectar-img-src", "data-original", "data-lazy", "data-orig-src", "data-ll-src", "data-url", "data-hi-res-src", "data-full-src"];
const LAZY_SRCSET = ["data-srcset", "data-lazy-srcset", "data-nectar-img-srcset", "srcset"];
const DECORATIVE_SRC = /(spacer|pixel|blank|transparent|1x1|divider|separator|bullet|placeholder|loader|spinner|sprite)/i;
const FILENAME_ALT = /^[\w\-. ]+\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?)$|^(img|image|dsc|dscn|photo|pic|picture|screenshot|screen shot|untitled|wp-image)[-_ ]?\d*$/i;

/** Largest candidate of a srcset ("a.jpg 480w, b.jpg 1080w" → b.jpg), skipping data: URIs. */
function fromSrcset(v: string | undefined): string | null {
  if (!v) return null;
  const cands = v
    .split(/,\s+(?=\S)/)
    .map((c) => c.trim().split(/\s+/))
    .filter(([u]) => u && !u.startsWith("data:"))
    .map(([u, d = "1x"]) => ({ u, n: parseFloat(d) || 1 }));
  if (!cands.length) return null;
  return cands.sort((a, b) => b.n - a.n)[0].u;
}

function resolveSrc(img: Cheerio<Element>, base: string): { src: string | null; lazy: ImageInfo["lazy"] } {
  const native = (img.attr("loading") ?? "").toLowerCase() === "lazy";
  for (const a of LAZY_ATTRS) {
    const v = img.attr(a);
    if (v && !v.startsWith("data:")) return { src: abs(v, base), lazy: "js" };
  }
  for (const a of LAZY_SRCSET) {
    const v = fromSrcset(img.attr(a));
    if (v) return { src: abs(v, base), lazy: a === "srcset" ? (native ? "native" : "none") : "js" };
  }
  const pictureSource = img.parent("picture").find("source").toArray();
  for (const s of pictureSource) {
    const el = img.parent("picture").find(s);
    const v = fromSrcset(el.attr("srcset") ?? el.attr("data-srcset"));
    if (v) return { src: abs(v, base), lazy: native ? "native" : el.attr("data-srcset") ? "js" : "none" };
  }
  const src = img.attr("src");
  if (src && !src.startsWith("data:")) return { src: abs(src, base), lazy: native ? "native" : "none" };
  return { src: null, lazy: native ? "native" : "none" };
}

function dims(img: Cheerio<Element>): { w?: string; h?: string; ok: boolean } {
  const w = img.attr("width");
  const h = img.attr("height");
  const style = (img.attr("style") ?? "").toLowerCase();
  const ok = (!!w && !!h) || /aspect-ratio/.test(style) || (/(^|;)\s*width\s*:/.test(style) && /(^|;)\s*height\s*:/.test(style));
  return { w, h, ok };
}

export function images(ctx: Ctx, mainEl: Cheerio<Element> | null): ImagesReport {
  const { $, input } = ctx;
  const items: ImageInfo[] = [];
  const mainNode = mainEl?.get(0);

  $("img").each((i, el) => {
    const img = $(el);
    const { src, lazy } = resolveSrc(img, input.finalUrl);
    const altAttr = img.attr("alt");
    const alt = altAttr === undefined ? null : altAttr.trim();
    const { w, h, ok } = dims(img);
    const link = img.closest("a");
    const linked = link.length > 0 && !link.text().replace(/\s+/g, "").length && !link.attr("aria-label");
    const inMain = !!mainNode && img.parents().toArray().includes(mainNode);
    const tiny = Number(w) > 0 && Number(h) > 0 && Number(w) <= 40 && Number(h) <= 40;
    const hidden = /^(presentation|none)$/i.test(img.attr("role") ?? "") || img.attr("aria-hidden") === "true";
    const shown = src ?? "(no resolvable source)";

    let state: AltState = "ok";
    let reason: string | undefined;
    if (alt === null) state = "missing";
    else if (alt === "") {
      if (hidden) [state, reason] = ["empty-decorative", "role=presentation / aria-hidden"];
      else if (tiny) [state, reason] = ["empty-decorative", `tiny (${w}×${h})`];
      else if (linked) [state, reason] = ["empty-content", "only content of a link, so the link has no name"];
      else if (src && DECORATIVE_SRC.test(src)) [state, reason] = ["empty-decorative", "spacer/placeholder file name"];
      else if (inMain) [state, reason] = ["empty-content", "inside the main content"];
      else if (Number(w) >= 150 || Number(h) >= 150) [state, reason] = ["empty-content", `large image (${w}×${h})`];
      else if (src && /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(src)) [state, reason] = ["empty-content", "photo/raster image, likely meaningful"];
      else [state, reason] = ["empty-decorative", "no signal that it carries meaning"];
    } else if (FILENAME_ALT.test(alt) || (src && alt.toLowerCase() === decodeURIComponent(src.split("/").pop() ?? "").replace(/\.[a-z0-9]+(\?.*)?$/i, "").toLowerCase())) state = "filename";
    else if (alt.length > 125) state = "too-long";

    items.push({ src: shown, alt, state, reason, linked, lazy, width: w, height: h, hasDimensions: ok });
    void i;
  });

  const by = (s: AltState) => items.filter((x) => x.state === s);
  const fmt = (x: ImageInfo) => `${x.src}${x.alt ? ` (alt="${clip(x.alt, 60)}")` : ""}${x.reason ? ` · ${x.reason}` : ""}`;
  const missing = by("missing");
  const emptyContent = by("empty-content");
  const emptyDecorative = by("empty-decorative");
  const fileAlt = by("filename");
  const longAlt = by("too-long");
  const noDims = items.filter((x) => !x.hasDimensions && x.state !== "empty-decorative");

  if (items.length) {
    add(ctx, missing.length
      ? { id: "alt", category: "Content", impact: 5, severity: "warning", title: `${missing.length} of ${items.length} images have no alt attribute`, detail: "Screen readers announce the file name instead, and image search gets no description.", fix: 'Add descriptive alt text to every image (alt="" only for purely decorative ones).', items: evidence(missing.map(fmt)) }
      : emptyContent.length
        ? { id: "alt", category: "Content", impact: 5, severity: "info", title: `Every image has an alt attribute, but ${emptyContent.length} are empty`, detail: "See the empty-alt warning for the images that need a description." }
        : { id: "alt", category: "Content", impact: 5, severity: "pass", title: `All ${items.length} images have an alt attribute`, detail: "Every <img> declares alt text or marks itself decorative." });
    if (emptyContent.length) add(ctx, { id: "alt-empty", category: "Content", impact: 4, severity: "warning", title: `${emptyContent.length} meaningful image${emptyContent.length > 1 ? "s" : ""} with empty alt=""`, detail: `alt="" tells search engines and screen readers to ignore the image. These look like content images (heuristic; ${emptyDecorative.length} more look decorative and are fine).`, fix: "Describe what each image shows in a few words; keep alt=\"\" only for decoration.", items: evidence(emptyContent.map(fmt)) });
    if (fileAlt.length || longAlt.length) add(ctx, { id: "alt-quality", category: "Content", impact: 2, severity: "info", title: [fileAlt.length && `${fileAlt.length} alt text${fileAlt.length > 1 ? "s" : ""} look like file names`, longAlt.length && `${longAlt.length} over 125 characters`].filter(Boolean).join(", "), detail: "File-name alts (IMG_2041.jpg) say nothing; very long alts get cut off by screen readers.", fix: "Write a short, specific description (5–15 words).", items: evidence([...fileAlt, ...longAlt].map(fmt)) });
    add(ctx, noDims.length
      ? { id: "img-dimensions", category: "Performance", impact: 4, severity: "warning", title: `${noDims.length} image${noDims.length > 1 ? "s" : ""} without width/height`, detail: "The browser can't reserve space, so content jumps as they load (Cumulative Layout Shift).", fix: "Set width and height attributes (or CSS aspect-ratio) on every image.", items: evidence(noDims.map((x) => x.src)) }
      : { id: "img-dimensions", category: "Performance", impact: 4, severity: "pass", title: "Images reserve their space", detail: "Every content image declares its dimensions." });

    // Lazy loading heuristics: hero images should load eagerly; images far down the page should be lazy.
    const content = items.filter((x) => x.state !== "empty-decorative" && x.src !== "(no resolvable source)");
    const heroLazy = content.slice(0, 2).filter((x) => x.lazy !== "none");
    const lateEager = content.slice(4).filter((x) => x.lazy === "none");
    if (heroLazy.length) add(ctx, { id: "lazy-hero", category: "Performance", impact: 3, severity: "warning", title: "Top-of-page image is lazy-loaded", detail: "If this is the largest image in view, lazy-loading delays Largest Contentful Paint (heuristic: first images in the HTML).", fix: 'Load the hero image eagerly with fetchpriority="high"; lazy-load only images below the fold.', items: heroLazy.map((x) => `${x.src} (${x.lazy === "js" ? "JS lazy-load" : 'loading="lazy"'})`) });
    if (lateEager.length >= 3) add(ctx, { id: "lazy-offscreen", category: "Performance", impact: 2, severity: "info", title: `${lateEager.length} images further down load eagerly`, detail: "Images below the fold that load immediately compete with the visible content (heuristic: 5th image onwards).", fix: 'Add loading="lazy" to images below the fold.', items: evidence(lateEager.map((x) => x.src)) });
  }

  return {
    total: items.length,
    missingAlt: missing.length,
    emptyAltContent: emptyContent.length,
    emptyAltDecorative: emptyDecorative.length,
    filenameAlt: fileAlt.length,
    longAlt: longAlt.length,
    noDimensions: noDims.length,
    items: items.slice(0, 300),
  };
}
