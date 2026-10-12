import type { Resource } from "../types";
import { abs, add, evidence, type Ctx } from "./context";

export function technical(ctx: Ctx): { mixed: Resource[]; lang: string | null } {
  const { $, input } = ctx;
  const { headers, finalUrl, redirects } = input;

  if (!ctx.isHtml) add(ctx, { id: "html", category: "Technical", impact: 8, severity: "error", title: "Response is not HTML", detail: `Content-Type is "${headers["content-type"] || "unknown"}".`, fix: "Point the audit at an HTML page." });

  add(ctx, ctx.isHttps
    ? { id: "https", category: "Technical", impact: 8, severity: "pass", title: "Served over HTTPS", detail: "Connection is encrypted." }
    : { id: "https", category: "Technical", impact: 8, severity: "error", title: "Not served over HTTPS", detail: "Browsers mark the page 'Not secure' and HTTPS is a ranking signal.", fix: "Install a TLS certificate and 301-redirect HTTP to HTTPS." });

  if (redirects.length > 1) add(ctx, { id: "redirects", category: "Technical", impact: 4, severity: "warning", title: `Redirect chain: ${redirects.length} hops`, detail: "Each hop costs a round trip and dilutes crawl efficiency.", fix: "Link and redirect straight to the final URL.", items: [...redirects, `200 ${finalUrl}`] });
  else if (redirects.length === 1) add(ctx, { id: "redirects", category: "Technical", impact: 4, severity: "info", title: "One redirect before the page", detail: `${redirects[0]} → ${finalUrl}`, fix: "Update internal links to point at the final URL." });
  else add(ctx, { id: "redirects", category: "Technical", impact: 4, severity: "pass", title: "No redirects", detail: "The URL resolves directly." });

  const viewports = $('meta[name="viewport" i]');
  const vp = viewports.attr("content") ?? "";
  if (!viewports.length) add(ctx, { id: "viewport", category: "Technical", impact: 6, severity: "error", title: "Missing viewport meta tag", detail: "Phones render the desktop layout zoomed out; Google indexes mobile-first.", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });
  else if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(vp)) add(ctx, { id: "viewport", category: "Technical", impact: 6, severity: "info", title: "Viewport blocks zooming", detail: vp, fix: "Remove user-scalable=no / maximum-scale=1 so people can zoom (accessibility)." });
  else add(ctx, { id: "viewport", category: "Technical", impact: 6, severity: "pass", title: "Mobile viewport set", detail: vp });

  const lang = $("html").attr("lang")?.trim() || null;
  add(ctx, lang
    ? { id: "lang", category: "Technical", impact: 3, severity: /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/i.test(lang) ? "pass" : "warning", title: `Language declared (${lang})`, detail: "Helps search engines and screen readers serve the right audience.", fix: 'Use a valid BCP 47 code such as "en" or "en-GB".' }
    : { id: "lang", category: "Technical", impact: 3, severity: "warning", title: "Missing html lang attribute", detail: "The page's language isn't declared.", fix: 'Add lang="en" (or your language) to <html>.' });

  const metaCharset = $("meta[charset]").attr("charset") ?? $('meta[http-equiv="content-type" i]').attr("content")?.match(/charset=([\w-]+)/i)?.[1];
  const headerCharset = (headers["content-type"] ?? "").match(/charset=([\w-]+)/i)?.[1];
  const charset = headerCharset ?? metaCharset;
  add(ctx, !charset
    ? { id: "charset", category: "Technical", impact: 2, severity: "warning", title: "No character encoding declared", detail: "Browsers may guess wrong and garble accented characters.", fix: 'Add <meta charset="utf-8"> as the first element in <head>.' }
    : /utf-?8/i.test(charset)
      ? { id: "charset", category: "Technical", impact: 2, severity: "pass", title: "UTF-8 encoding", detail: `Declared in ${headerCharset ? "the Content-Type header" : "a meta tag"}.` }
      : { id: "charset", category: "Technical", impact: 2, severity: "info", title: `Encoding is ${charset}`, detail: "Legacy encodings work but UTF-8 is the web standard.", fix: "Serve the page as UTF-8." });

  const start = input.html.replace(/^﻿/, "").replace(/^\s*(<!--[\s\S]*?-->\s*)*/, "").slice(0, 30);
  add(ctx, /^<!doctype html/i.test(start)
    ? { id: "doctype", category: "Technical", impact: 2, severity: "pass", title: "HTML5 doctype", detail: "Pages render in standards mode." }
    : { id: "doctype", category: "Technical", impact: 2, severity: "warning", title: "Missing or legacy doctype", detail: "Without <!DOCTYPE html> browsers use quirks mode, which breaks layout in subtle ways.", fix: "Start the document with <!DOCTYPE html>." });

  // Mixed content: http:// subresources on an https page. Active content is blocked by browsers outright.
  const mixed: Resource[] = [];
  if (ctx.isHttps) {
    const scan = (sel: string, attr: string, kind: string) =>
      $(sel).each((_, el) => {
        const v = $(el).attr(attr);
        if (v && /^http:\/\//i.test(v.trim())) mixed.push({ url: v.trim(), kind });
      });
    scan("script[src]", "src", "script (blocked)");
    scan('link[rel~="stylesheet" i][href]', "href", "stylesheet (blocked)");
    scan("iframe[src]", "src", "iframe (blocked)");
    scan("object[data]", "data", "object (blocked)");
    scan("form[action]", "action", "form posts insecurely");
    scan("img[src]", "src", "image");
    scan("video[src], audio[src], source[src]", "src", "media");
  }
  const active = mixed.filter((m) => /blocked|form/.test(m.kind));
  if (mixed.length) add(ctx, { id: "mixed-content", category: "Technical", impact: 5, severity: active.length ? "error" : "warning", title: `${mixed.length} insecure http:// resource${mixed.length > 1 ? "s" : ""} on an HTTPS page`, detail: active.length ? "Browsers block insecure scripts, styles and frames, which can break the page." : "Browsers upgrade or flag insecure images and media, and show a warning.", fix: "Change these URLs to https:// (or protocol-relative paths you serve over HTTPS).", items: evidence(mixed.map((m) => `${m.url} · ${m.kind}`)) });
  else if (ctx.isHttps) add(ctx, { id: "mixed-content", category: "Technical", impact: 5, severity: "pass", title: "No mixed content", detail: "Every subresource in the HTML uses HTTPS." });

  // Security headers: low impact on rankings, but cheap hardening and a trust signal.
  const h = headers;
  const missingSec = [
    ctx.isHttps && !h["strict-transport-security"] && "Strict-Transport-Security (HSTS)",
    !h["content-security-policy"] && "Content-Security-Policy",
    !/nosniff/i.test(h["x-content-type-options"] ?? "") && "X-Content-Type-Options: nosniff",
    !h["x-frame-options"] && !/frame-ancestors/i.test(h["content-security-policy"] ?? "") && "X-Frame-Options or CSP frame-ancestors",
    !h["referrer-policy"] && "Referrer-Policy",
  ].filter((x): x is string => !!x);
  add(ctx, missingSec.length
    ? { id: "security-headers", category: "Technical", impact: 2, severity: "info", title: `${missingSec.length} security header${missingSec.length > 1 ? "s" : ""} missing`, detail: "Not a ranking factor, but they protect visitors from clickjacking, sniffing and downgrade attacks.", fix: "Add the missing headers at your CDN or server.", items: missingSec }
    : { id: "security-headers", category: "Technical", impact: 2, severity: "pass", title: "Security headers in place", detail: "HSTS, CSP, nosniff, frame protection and Referrer-Policy are all set." });

  const icon = $('link[rel~="icon" i], link[rel="shortcut icon" i], link[rel="apple-touch-icon" i]').attr("href");
  if (icon) add(ctx, { id: "favicon", category: "Technical", impact: 2, severity: "pass", title: "Favicon declared", detail: abs(icon, finalUrl) ?? icon });

  return { mixed, lang };
}
