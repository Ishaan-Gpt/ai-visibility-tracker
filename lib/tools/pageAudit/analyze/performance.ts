import type { Resource } from "../types";
import { abs, add, evidence, type Ctx } from "./context";

/** Server-side performance signals we can measure from one fetch. Lab/field data comes from PageSpeed Insights separately. */
export function performance(ctx: Ctx): { renderBlocking: Resource[]; domElements: number } {
  const { $, input } = ctx;
  const { headers, elapsedMs } = input;
  const htmlBytes = Buffer.byteLength(input.html, "utf8");

  const ms = elapsedMs;
  const label = "Measured from our server (one request, network + server time), not a lab test.";
  if (ms > 4000) add(ctx, { id: "ttfb", category: "Performance", impact: 6, severity: "error", title: `Very slow response (${ms.toLocaleString()} ms)`, detail: label, fix: "Add full-page caching / a CDN and cut server work (slow queries, plugins)." });
  else if (ms > 1800) add(ctx, { id: "ttfb", category: "Performance", impact: 6, severity: "warning", title: `Slow response (${ms.toLocaleString()} ms)`, detail: label, fix: "Add caching or a CDN and reduce server work." });
  else if (ms > 800) add(ctx, { id: "ttfb", category: "Performance", impact: 6, severity: "info", title: `Response time ${ms.toLocaleString()} ms`, detail: `${label} Under 800 ms is a good target.`, fix: "Cache the HTML at the edge to get under 800 ms." });
  else add(ctx, { id: "ttfb", category: "Performance", impact: 6, severity: "pass", title: `Fast response (${ms.toLocaleString()} ms)`, detail: label });

  const kb = Math.round(htmlBytes / 1024);
  if (htmlBytes > 1_000_000) add(ctx, { id: "html-size", category: "Performance", impact: 3, severity: "warning", title: `Heavy HTML (${kb.toLocaleString()} KB)`, detail: "Large documents take longer to download and parse, especially on phones.", fix: "Move inline data/JSON out of the HTML, paginate long lists and remove unused markup." });
  else if (htmlBytes > 400_000) add(ctx, { id: "html-size", category: "Performance", impact: 3, severity: "info", title: `Large HTML (${kb} KB)`, detail: "Above 400 KB the document itself starts to cost noticeable load time on mobile.", fix: "Trim inlined scripts, styles and SVG sprites." });
  else add(ctx, { id: "html-size", category: "Performance", impact: 3, severity: "pass", title: `HTML size ${kb} KB`, detail: "A lean document." });
  if (input.truncated) add(ctx, { id: "html-truncated", category: "Performance", impact: 0, severity: "info", title: "HTML larger than 2 MB", detail: "We analysed only the first 2 MB." });

  const enc = (headers["content-encoding"] ?? "").toLowerCase();
  if (htmlBytes > 10_000) add(ctx, /gzip|br|zstd|deflate/.test(enc)
    ? { id: "compression", category: "Performance", impact: 4, severity: "pass", title: `Compressed (${enc})`, detail: `${Math.round((input.bytes ?? htmlBytes) / 1024)} KB transferred for ${kb} KB of HTML.` }
    : { id: "compression", category: "Performance", impact: 4, severity: "warning", title: "HTML is not compressed", detail: `${kb} KB sent uncompressed. Gzip/Brotli typically cut HTML by 70–80%.`, fix: "Enable Brotli or gzip compression on your server or CDN." });

  const cc = headers["cache-control"] ?? "";
  if (!cc && !headers["etag"] && !headers["last-modified"]) add(ctx, { id: "caching", category: "Performance", impact: 1, severity: "info", title: "No caching headers on the HTML", detail: "No Cache-Control, ETag or Last-Modified, so browsers and crawlers re-download the page every time.", fix: "Send ETag/Last-Modified (cheap revalidation) and a Cache-Control policy suited to the page." });
  else add(ctx, { id: "caching", category: "Performance", impact: 1, severity: "pass", title: "Caching headers present", detail: [cc && `Cache-Control: ${cc}`, headers["etag"] && "ETag", headers["last-modified"] && "Last-Modified"].filter(Boolean).join(" · ") });

  // Render-blocking resources in <head>: classic scripts without async/defer, and stylesheets for all media.
  const renderBlocking: Resource[] = [];
  $("head script[src]").each((_, el) => {
    const s = $(el);
    const type = (s.attr("type") ?? "").toLowerCase();
    if (s.attr("async") !== undefined || s.attr("defer") !== undefined || type === "module" || (type && !/javascript|ecmascript/.test(type))) return;
    renderBlocking.push({ url: abs(s.attr("src"), input.finalUrl) ?? s.attr("src")!, kind: "script" });
  });
  $('head link[rel~="stylesheet" i][href]').each((_, el) => {
    const l = $(el);
    const media = (l.attr("media") ?? "all").toLowerCase();
    if (l.attr("disabled") !== undefined || media === "print" || /^\(.*\)$/.test(media)) return;
    renderBlocking.push({ url: abs(l.attr("href"), input.finalUrl) ?? l.attr("href")!, kind: "stylesheet" });
  });
  const scripts = renderBlocking.filter((r) => r.kind === "script").length;
  const styles = renderBlocking.length - scripts;
  if (scripts > 0 || styles > 3) add(ctx, { id: "render-blocking", category: "Performance", impact: 5, severity: scripts > 2 || styles > 6 ? "warning" : "info", title: `${renderBlocking.length} render-blocking resource${renderBlocking.length > 1 ? "s" : ""} in <head>`, detail: `${scripts} synchronous script${scripts === 1 ? "" : "s"} and ${styles} stylesheet${styles === 1 ? "" : "s"} must download before anything is painted.`, fix: "Add defer (or async) to scripts, inline critical CSS and load the rest without blocking.", items: evidence(renderBlocking.map((r) => `${r.url} · ${r.kind}`)) });
  else add(ctx, { id: "render-blocking", category: "Performance", impact: 5, severity: "pass", title: "Few render-blocking resources", detail: `${styles} stylesheet${styles === 1 ? "" : "s"} and no synchronous scripts in <head>.` });

  const domElements = $("*").length;
  if (domElements > 3000) add(ctx, { id: "dom-size", category: "Performance", impact: 3, severity: "warning", title: `Very large DOM (${domElements.toLocaleString()} elements)`, detail: "Big DOMs slow style calculation and interactions (INP). Lighthouse flags pages above ~1,400.", fix: "Remove hidden duplicate menus, paginate long lists, simplify wrappers." });
  else if (domElements > 1400) add(ctx, { id: "dom-size", category: "Performance", impact: 3, severity: "info", title: `Large DOM (${domElements.toLocaleString()} elements)`, detail: "Above ~1,400 elements style and layout work grows noticeably.", fix: "Trim unnecessary wrapper elements and off-screen markup." });
  else add(ctx, { id: "dom-size", category: "Performance", impact: 3, severity: "pass", title: `${domElements.toLocaleString()} DOM elements`, detail: "A manageable document size." });

  return { renderBlocking, domElements };
}
