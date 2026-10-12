"use client";

import { useState } from "react";
import { IconDesktop, IconPhone } from "@/components/icons/Icons";
import { SERP, SERP_FONT, descState, isoDay, titleState, type Device, type Run, type Snippet } from "./serpMetrics";
import type { MetaFields } from "./fields";
import { Field, FitScale, Meter, SectionTitle, Toggle, fieldCls, monoFieldCls } from "./ui";

/** Frame widths include the 1px borders so the text column is exactly the measured width. */
const DESKTOP_W = SERP.desktop.descColumn + 48 + 2;
const MOBILE_W = SERP.mobile.viewport + 2;

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <span key={i} className={r.bold ? "font-bold" : undefined} style={r.muted ? { color: "#70757a" } : undefined}>
          {r.text}
        </span>
      ))}
    </>
  );
}

function Favicon({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const ok = src && failed !== src;
  return (
    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dadce0] bg-[#f1f3f4]">
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" referrerPolicy="no-referrer" onError={() => setFailed(src)} />
      ) : (
        <span className="text-[12px] font-bold uppercase text-[#5f6368]">{label.trim()[0] ?? "?"}</span>
      )}
    </span>
  );
}

const Kebab = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="ml-1 shrink-0 text-[#70757a]">
    <circle cx="12" cy="5" r="1.7" fill="currentColor" />
    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    <circle cx="12" cy="19" r="1.7" fill="currentColor" />
  </svg>
);

/** One organic result, drawn at Google's real sizes with the lines our measurer computed. */
export function GoogleResult({ snippet, device, siteName, favicon, query }: { snippet: Snippet; device: Device; siteName: string; favicon: string; query: string }) {
  const mobile = device === "mobile";
  const empty = snippet.title.usedPx === 0;
  const result = (
    <div style={{ fontFamily: SERP_FONT }} className={mobile ? "rounded-[18px] bg-white px-4 pb-4 pt-3.5 text-left" : "bg-white text-left"}>
      <div className="flex items-center gap-3">
        <Favicon src={favicon} label={siteName} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] leading-[20px] text-[#202124]">{siteName}</div>
          <div className="flex items-center whitespace-nowrap text-[12px] leading-[18px] text-[#4d5156]">
            <span className="truncate">
              {snippet.crumb.origin}
              <span>{snippet.crumb.trail}</span>
            </span>
            <Kebab />
          </div>
        </div>
      </div>
      <h3
        className={`${mobile ? "mt-2.5 text-[18px] leading-[24px]" : "mt-[7px] text-[20px] leading-[26px]"} font-normal text-[#1a0dab] decoration-1 underline-offset-2 hover:underline`}
        style={{ fontFamily: SERP_FONT }}
      >
        {empty ? (
          <span className="text-[#9aa0a6]">Your title appears here</span>
        ) : (
          snippet.title.lines.map((l, i) => (
            <span key={i} className="block whitespace-pre">
              <Runs runs={l} />
            </span>
          ))
        )}
      </h3>
      <div className={`${mobile ? "mt-2 leading-[20px]" : "mt-1 leading-[22px]"} text-[14px] text-[#4d5156]`}>
        {snippet.description.usedPx === 0 ? (
          <span className="text-[#9aa0a6]">No meta description: Google will pull text from the page.</span>
        ) : (
          snippet.description.lines.map((l, i) => (
            <span key={i} className="block whitespace-pre">
              <Runs runs={l} />
            </span>
          ))
        )}
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className="rounded-[30px] border border-[#dadce0] bg-[#f1f3f4] pb-4 shadow-[0_24px_50px_-34px_rgba(43,41,39,.55)]" style={{ width: MOBILE_W }}>
        <div className="flex items-center gap-2 px-4 pb-3 pt-4">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-white px-4 text-[14px] text-[#202124] shadow-[0_1px_3px_rgba(32,33,36,.2)]" style={{ fontFamily: SERP_FONT }}>
            <SearchGlyph />
            <span className="truncate">{query || "your search"}</span>
          </div>
        </div>
        {result}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#dadce0] bg-white shadow-[0_24px_50px_-34px_rgba(43,41,39,.45)]" style={{ width: DESKTOP_W }}>
      <div className="flex items-center gap-3 border-b border-[#ebebeb] px-6 py-3">
        <div className="flex h-10 flex-1 items-center gap-2.5 rounded-full border border-[#dfe1e5] px-4 text-[14px] text-[#202124]" style={{ fontFamily: SERP_FONT }}>
          <SearchGlyph />
          <span className="truncate">{query || "your search"}</span>
        </div>
      </div>
      <div className="px-6 pb-6 pt-5">{result}</div>
    </div>
  );
}

const SearchGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="shrink-0">
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m15.2 15.2 4.6 4.6" />
  </svg>
);

/* ---------------- the section: previews + the search fields ---------------- */

export function GoogleSection({
  fields,
  set,
  desktop,
  mobile,
  siteName,
  mode,
}: {
  fields: MetaFields;
  set: <K extends keyof MetaFields>(k: K, v: MetaFields[K]) => void;
  desktop: Snippet;
  mobile: Snippet;
  siteName: string;
  mode: "manual" | "url";
}) {
  // Only mounted after hydration, so reading the viewport here is safe. Phones start on the mobile result.
  const [device, setDevice] = useState<Device>(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches ? "mobile" : "desktop"));
  const titleChars = fields.title.trim().length;
  const descChars = fields.description.trim().length;
  const dateOn = fields.showDate && !!fields.published;

  return (
    <section className="glass rounded-[24px] p-4 sm:p-6">
      <SectionTitle lead="How it looks on" accent="Google">
        <div className="glass-inset inline-flex rounded-[12px] p-0.5 lg:hidden" role="group" aria-label="Device">
          {(
            [
              ["desktop", "Desktop", IconDesktop],
              ["mobile", "Mobile", IconPhone],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[13px] transition-colors ${device === id ? "bg-white/90 text-ds-ink shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" : "text-ds-ink-2 hover:text-ds-ink"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </SectionTitle>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
        <figure className={`${device === "desktop" ? "" : "hidden"} min-w-0 lg:block`}>
          <figcaption className="mb-2 hidden items-center gap-1.5 text-[12.5px] text-ds-ink-2 lg:flex">
            <IconDesktop className="h-4 w-4" /> Desktop
          </figcaption>
          <FitScale width={DESKTOP_W}>
            <GoogleResult snippet={desktop} device="desktop" siteName={siteName} favicon={fields.favicon} query={fields.keyword} />
          </FitScale>
        </figure>
        <figure className={`${device === "mobile" ? "" : "hidden"} min-w-0 lg:block`}>
          <figcaption className="mb-2 hidden items-center gap-1.5 text-[12.5px] text-ds-ink-2 lg:flex">
            <IconPhone className="h-4 w-4" /> Mobile, 360px
          </figcaption>
          <div className="mx-auto w-full max-w-[362px] xl:w-[362px]">
            <FitScale width={MOBILE_W}>
              <GoogleResult snippet={mobile} device="mobile" siteName={siteName} favicon={fields.favicon} query={fields.keyword} />
            </FitScale>
          </div>
        </figure>
      </div>

      <div className="mt-6 grid gap-5 border-t border-white/60 pt-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Field label="Title tag" htmlFor="sp-title" aside={`${titleChars} chars`}>
            <input id="sp-title" value={fields.title} onChange={(e) => set("title", e.target.value)} className={fieldCls} placeholder="What the page is about, then your brand" />
            <div className="mt-2.5 space-y-1.5">
              <Meter label="Desktop" used={desktop.title.usedPx} limit={SERP.desktop.titleWidth} remaining={desktop.title.remainingPx} state={titleState(desktop.title)} />
              <Meter
                label="Mobile"
                used={mobile.title.usedPx}
                limit={SERP.mobile.titleColumn * SERP.mobile.titleLines}
                remaining={mobile.title.remainingPx}
                state={titleState(mobile.title)}
                note={mobile.title.usedPx ? `${mobile.title.lineCount} line${mobile.title.lineCount > 1 ? "s" : ""}` : undefined}
              />
            </div>
          </Field>
          <Field label="Meta description" htmlFor="sp-desc" aside={`${descChars} chars`}>
            <textarea id="sp-desc" rows={4} value={fields.description} onChange={(e) => set("description", e.target.value)} className={`${fieldCls} resize-y`} placeholder="Answer the search in 120–155 characters and give a reason to click." />
            <div className="mt-2.5 space-y-1.5">
              <Meter label="Desktop" used={desktop.description.usedPx} limit={SERP.desktop.descBudget} remaining={desktop.description.remainingPx} state={descState(desktop.description, descChars)} note={dateOn ? "incl. date" : undefined} />
              <Meter label="Mobile" used={mobile.description.usedPx} limit={SERP.mobile.descBudget} remaining={mobile.description.remainingPx} state={descState(mobile.description, descChars)} />
            </div>
          </Field>
        </div>

        <div className="space-y-5">
          <Field label="Page URL" htmlFor="sp-url" hint={mode === "url" ? "From the canonical link (or the final URL). Also used as the canonical in the tag block." : "Shown as Google's breadcrumb and used as the canonical."}>
            <input id="sp-url" value={fields.url} onChange={(e) => set("url", e.target.value)} className={monoFieldCls} placeholder="https://yoursite.com/page" inputMode="url" spellCheck={false} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Site name" htmlFor="sp-site" hint="og:site_name">
              <input id="sp-site" value={fields.siteName} onChange={(e) => set("siteName", e.target.value)} className={fieldCls} placeholder={siteName} />
            </Field>
            <Field label="Target keyword" htmlFor="sp-kw" hint="Bolded in the description, as Google does.">
              <input id="sp-kw" value={fields.keyword} onChange={(e) => set("keyword", e.target.value)} className={fieldCls} placeholder="e.g. running shoes" />
            </Field>
          </div>
          <Field label="Published date" htmlFor="sp-date">
            <div className="flex flex-wrap items-center gap-3">
              <input id="sp-date" type="date" value={isoDay(fields.published)} onChange={(e) => set("published", e.target.value)} className={`${fieldCls} w-auto min-w-0 flex-1 sm:max-w-[200px]`} />
              <Toggle id="sp-date-on" checked={fields.showDate} onChange={(v) => set("showDate", v)} label="Show in snippet" />
            </div>
          </Field>
          <Field label="Favicon URL" htmlFor="sp-fav" hint="Google shows it in the circle beside the site name.">
            <input id="sp-fav" value={fields.favicon} onChange={(e) => set("favicon", e.target.value)} className={monoFieldCls} placeholder="https://yoursite.com/favicon.png" spellCheck={false} />
          </Field>
        </div>
      </div>

      <HowWeMeasure />
    </section>
  );
}

function HowWeMeasure() {
  const d = SERP.desktop;
  const m = SERP.mobile;
  return (
    <details className="group/h mt-6 rounded-[16px] border border-white/60 bg-white/25 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] text-ds-ink">
        <span>
          How we measure <span className="text-ds-ink-2">· these are estimates</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden className="text-ds-ink-2 transition-transform duration-300 group-open/h:rotate-180">
          <path d="m6.5 9.5 5.5 5.2 5.4-5.4" />
        </svg>
      </summary>
      <div className="space-y-2 border-t border-white/60 px-4 py-3 text-[13.5px] leading-6 text-ds-ink-2">
        <p>
          Widths are measured in your browser with canvas <code className="font-mono text-[12px] text-ds-ink">measureText</code> using Arial, the font Google uses on desktop. Query words are measured in bold, and the date counts against the space.
        </p>
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <li>Desktop title: {d.titleSize}px, one line, cut at {d.titleWidth}px with &ldquo;...&rdquo;</li>
          <li>Desktop description: {d.descSize}px in a {d.descColumn}px column, about {d.descBudget}px total, {d.descLines} lines</li>
          <li>Mobile title: ~{m.titleSize}px in a {m.titleColumn}px column ({m.viewport}px screen), {m.titleLines} lines</li>
          <li>Mobile description: {m.descSize}px, about {m.descBudget}px total</li>
        </ul>
        <p>Google changes fonts and widths, uses its own font on mobile, and rewrites many titles and descriptions. Treat ±10px as noise and leave a little room.</p>
      </div>
    </details>
  );
}
