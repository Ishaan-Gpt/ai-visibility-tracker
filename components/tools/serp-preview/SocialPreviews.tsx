"use client";

import { useState, type ReactNode } from "react";
import { ModeSwitch } from "@/components/tools/schema-generator/workspace/ModeSwitch";
import { IconInfo } from "@/components/icons/Icons";
import type { MetaFields } from "./fields";
import { PLATFORMS, type ImageFacts, type Picked, type Platform, type SocialCard } from "./socialRules";
import { Field, SectionTitle, fieldCls, monoFieldCls } from "./ui";

/* ---------------- image ---------------- */

function ShareImage({ src, ratio, className = "", rounded = "" }: { src: string; ratio: number; className?: string; rounded?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const ok = src && failed !== src;
  return (
    <div className={`relative w-full overflow-hidden bg-[#e4e6eb] ${rounded} ${className}`} style={{ aspectRatio: String(ratio) }}>
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(src)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[#8a8d91]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
            <path d="m4.5 16.5 4.6-4.4 3.4 3.1 2.6-2.2 4.4 3.9" />
            <circle cx="15.6" cy="9.4" r="1.4" />
          </svg>
        </div>
      )}
    </div>
  );
}

/** Platforms that show the whole image (Slack, Discord) keep its natural ratio within a ~400×300 box. */
function naturalRatio(f?: ImageFacts) {
  if (f?.state === "ok" && f.width && f.height) return Math.min(2.4, Math.max(0.8, f.width / f.height));
  return 1.91;
}

const or = (p: Picked, fallback: string) => p.value || fallback;

/* ---------------- one renderer per platform ---------------- */

function Facebook({ c }: { c: SocialCard }) {
  const text = (
    <div className="min-w-0 flex-1 bg-[#f0f2f5] px-3 py-2.5">
      <div className="truncate text-[12px] uppercase tracking-[0.02em] text-[#65676b]">{c.domain}</div>
      <div className="line-clamp-2 text-[16px] font-semibold leading-[20px] text-[#050505]">{or(c.title, c.domain)}</div>
      {c.description.value && <div className="truncate text-[14px] leading-[20px] text-[#65676b]">{c.description.value}</div>}
    </div>
  );
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#dadde1] bg-white" style={{ fontFamily: "Segoe UI, Helvetica, Arial, sans-serif" }}>
      {c.layout === "large" && <ShareImage src={c.image.value} ratio={1.91} />}
      {c.layout === "small" ? (
        <div className="flex">
          <div className="w-[32%] shrink-0 border-r border-[#dadde1]">
            <ShareImage src={c.image.value} ratio={1} />
          </div>
          {text}
        </div>
      ) : (
        text
      )}
    </div>
  );
}

function LinkedIn({ c }: { c: SocialCard }) {
  const text = (
    <div className="min-w-0 flex-1 px-3 py-2.5">
      <div className="line-clamp-2 text-[14px] font-semibold leading-[20px] text-black/90">{or(c.title, c.domain)}</div>
      <div className="mt-0.5 truncate text-[12px] text-black/60">{c.domain}</div>
    </div>
  );
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e0dfdc] bg-[#f9fafb]" style={{ fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      {c.layout === "large" && <ShareImage src={c.image.value} ratio={1.91} />}
      {c.layout === "small" ? (
        <div className="flex items-center">
          <div className="w-[26%] shrink-0">
            <ShareImage src={c.image.value} ratio={1} />
          </div>
          {text}
        </div>
      ) : (
        text
      )}
    </div>
  );
}

function X({ c }: { c: SocialCard }) {
  const font = { fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" };
  if (c.layout === "large") {
    return (
      <div style={font}>
        <div className="relative overflow-hidden rounded-[16px] border border-[#cfd9de]">
          <ShareImage src={c.image.value} ratio={2} />
          <span className="absolute bottom-3 left-3 max-w-[80%] truncate rounded-[4px] bg-black/75 px-1.5 py-px text-[13px] text-white">{c.domain}</span>
        </div>
        <div className="mt-1 text-[13px] text-[#536471]">From {c.domain}</div>
      </div>
    );
  }
  return (
    <div className="flex overflow-hidden rounded-[16px] border border-[#cfd9de] bg-white" style={font}>
      <div className="w-[30%] max-w-[130px] shrink-0 border-r border-[#cfd9de]">
        <ShareImage src={c.layout === "none" ? "" : c.image.value} ratio={1} className="bg-[#f7f9f9]" />
      </div>
      <div className="flex min-w-0 flex-col justify-center px-3 py-2 text-[15px] leading-5">
        <div className="truncate text-[#536471]">{c.domain}</div>
        <div className="truncate text-[#0f1419]">{c.title.value || <span className="text-[#8b98a5]">No title</span>}</div>
        {c.description.value && <div className="line-clamp-2 text-[#536471]">{c.description.value}</div>}
      </div>
    </div>
  );
}

function SmallIcon({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#e8e8e8] text-[10px] font-bold uppercase text-[#616061]">{label[0] ?? "?"}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={16} height={16} className="h-4 w-4 rounded-[3px] object-contain" referrerPolicy="no-referrer" onError={() => setFailed(src)} />;
}

function Slack({ c, favicon }: { c: SocialCard; favicon: string }) {
  return (
    <div className="rounded-[8px] bg-white p-3 text-[15px] leading-[22px] text-[#1d1c1d]" style={{ fontFamily: "Lato, Helvetica Neue, Helvetica, Arial, sans-serif" }}>
      <div className="flex gap-3">
        <span className="w-1 shrink-0 rounded-full bg-[#dddddd]" />
        <div className="min-w-0 flex-1">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <SmallIcon src={favicon} label={c.siteName} />
                <span className="truncate font-bold">{c.siteName}</span>
              </div>
              <div className="line-clamp-2 font-bold text-[#1264a3]">{or(c.title, c.domain)}</div>
              {c.description.value && <div className="line-clamp-3">{c.description.value}</div>}
            </div>
            {c.layout === "small" && (
              <div className="w-[72px] shrink-0 pt-1">
                <ShareImage src={c.image.value} ratio={1} rounded="rounded-[6px]" />
              </div>
            )}
          </div>
          {c.layout === "large" && (
            <div className="mt-2 max-w-full overflow-hidden rounded-[8px] border border-black/10" style={{ width: Math.min(360, 300 * naturalRatio(c.facts)) }}>
              <ShareImage src={c.image.value} ratio={naturalRatio(c.facts)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Ticks = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline-block">
    <path d="m1 5.8 3 3L10.4 1.6" />
    <path d="m6.6 8.4.5.4 6.4-7.2" />
  </svg>
);

function WhatsApp({ c, url }: { c: SocialCard; url: string }) {
  const text = (
    <div className="min-w-0 flex-1 px-2.5 py-2">
      <div className="line-clamp-2 text-[14px] font-semibold leading-[19px] text-[#111b21]">{or(c.title, c.domain)}</div>
      {c.description.value && <div className="mt-0.5 line-clamp-2 text-[13px] leading-[17px] text-[#667781]">{c.description.value}</div>}
      <div className="mt-0.5 truncate text-[12.5px] text-[#667781]">{c.domain}</div>
    </div>
  );
  return (
    <div className="rounded-[8px] bg-[#efeae2] p-3" style={{ fontFamily: "Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif" }}>
      <div className="ml-auto max-w-[330px] rounded-[8px] rounded-tr-[2px] bg-[#d9fdd3] p-1 shadow-[0_1px_0.5px_rgba(11,20,26,.13)]">
        <div className="overflow-hidden rounded-[6px] bg-[#d1f4cc]">
          {c.layout === "large" && <ShareImage src={c.image.value} ratio={1.91} />}
          {c.layout === "small" ? (
            <div className="flex">
              <div className="w-[84px] shrink-0">
                <ShareImage src={c.image.value} ratio={1} />
              </div>
              {text}
            </div>
          ) : (
            text
          )}
        </div>
        <div className="px-1.5 pb-0.5 pt-1 text-[14px] leading-[19px] text-[#111b21]">
          <span className="break-all text-[#027eb5] underline">{url}</span>
          <span className="float-right ml-2 mt-1.5 inline-flex items-center gap-1 text-[11px] leading-none text-[#667781]">
            12:04 <Ticks />
          </span>
        </div>
      </div>
    </div>
  );
}

function Discord({ c, url, theme }: { c: SocialCard; url: string; theme: string }) {
  return (
    <div className="rounded-[8px] bg-[#313338] p-3" style={{ fontFamily: "gg sans, Noto Sans, Helvetica Neue, Helvetica, Arial, sans-serif" }}>
      <div className="break-all text-[15px] leading-[22px] text-[#00a8fc] underline">{url}</div>
      <div className="mt-1 max-w-[432px] rounded-[4px] border-l-4 bg-[#2b2d31] py-2 pl-3 pr-4" style={{ borderLeftColor: theme || "#1e1f22" }}>
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <div className="mt-1 truncate text-[12px] text-[#dbdee1]">{c.siteName}</div>
            <div className="mt-1 line-clamp-2 text-[16px] font-semibold leading-[22px] text-[#00a8fc]">{or(c.title, c.domain)}</div>
            {c.description.value && <div className="mt-1 line-clamp-4 text-[14px] leading-[18px] text-[#dbdee1]">{c.description.value}</div>}
          </div>
          {c.layout === "small" && (
            <div className="mt-2 w-[80px] shrink-0">
              <ShareImage src={c.image.value} ratio={1} rounded="rounded-[4px]" />
            </div>
          )}
        </div>
        {c.layout === "large" && (
          <div className="mt-4 max-w-full overflow-hidden rounded-[4px]" style={{ width: Math.min(400, 300 * naturalRatio(c.facts)) }}>
            <ShareImage src={c.image.value} ratio={naturalRatio(c.facts)} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- "which tag did it use" ---------------- */

function Chain({ label, p, hidden }: { label: string; p: Picked; hidden?: string }) {
  const usedAt = p.used ? p.chain.indexOf(p.used) : -1;
  return (
    <div className="grid grid-cols-[76px_1fr] items-start gap-2 py-1">
      <span className="pt-0.5 text-[12px] text-ds-ink-3">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {p.chain.map((tag, i) => (
          <span key={tag} className="inline-flex items-center gap-1">
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="text-ds-ink-3">
                <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
              </svg>
            )}
            <span
              className={`rounded-[6px] px-1.5 py-px font-mono text-[11px] ${
                i === usedAt ? "bg-white/85 text-ds-ink shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_2px_6px_-3px_rgba(43,41,39,.4)]" : i < usedAt || usedAt === -1 ? "text-ds-ink-3 line-through decoration-ds-ink-3/60" : "text-ds-ink-3"
              }`}
              title={i === usedAt ? "Used" : i < usedAt || usedAt === -1 ? "Empty, skipped" : "Not needed"}
            >
              {tag}
            </span>
          </span>
        ))}
        {usedAt === -1 && <span className="text-[11.5px] text-[#b23a2a]">nothing set</span>}
        {hidden && <span className="text-[11.5px] text-ds-ink-3">· {hidden}</span>}
      </div>
    </div>
  );
}

const LAYOUT_LABEL: Record<Platform, (c: SocialCard) => string> = {
  facebook: (c) => (c.layout === "large" ? "Large image, 1.91:1" : c.layout === "small" ? "Small thumbnail" : "No image"),
  linkedin: (c) => (c.layout === "large" ? "Large image, 1.91:1" : c.layout === "small" ? "Small thumbnail" : "No image"),
  x: (c) => `${c.cardType}${c.layout === "large" ? ", 2:1" : ""}`,
  slack: (c) => (c.layout === "large" ? "Large image" : c.layout === "small" ? "Thumbnail" : "No image"),
  whatsapp: (c) => (c.layout === "large" ? "Large image, 1.91:1" : c.layout === "small" ? "Small thumbnail" : "No image"),
  discord: (c) => (c.layout === "large" ? "Large image" : c.layout === "small" ? "Thumbnail" : "No image"),
};

function PlatformCard({ c, url, favicon, theme, detailed }: { c: SocialCard; url: string; favicon: string; theme: string; detailed: boolean }) {
  const name = PLATFORMS.find((p) => p.id === c.platform)!.name;
  let body: ReactNode;
  switch (c.platform) {
    case "facebook":
      body = <Facebook c={c} />;
      break;
    case "linkedin":
      body = <LinkedIn c={c} />;
      break;
    case "x":
      body = <X c={c} />;
      break;
    case "slack":
      body = <Slack c={c} favicon={favicon} />;
      break;
    case "whatsapp":
      body = <WhatsApp c={c} url={url} />;
      break;
    case "discord":
      body = <Discord c={c} url={url} theme={theme} />;
      break;
  }
  return (
    <article className={`glass-inset flex min-w-0 flex-col rounded-[18px] p-3 sm:p-4 ${detailed ? "lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6" : ""}`}>
      <div className="min-w-0">
        <header className="mb-2.5 flex items-baseline justify-between gap-2">
          <h4 className="font-serif text-[20px] leading-none text-ds-ink">{name}</h4>
          <span className="truncate text-[12px] text-ds-ink-2">{LAYOUT_LABEL[c.platform](c)}</span>
        </header>
        {body}
      </div>
      <div className={`min-w-0 ${detailed ? "mt-4 lg:mt-8" : "mt-3"}`}>
        <div className="border-t border-white/70 pt-2">
          <Chain label="Title" p={c.title} hidden={c.showsTitle ? undefined : "hidden on this card"} />
          <Chain label="Description" p={c.description} hidden={c.showsDescription ? undefined : "not shown"} />
          <Chain label="Image" p={c.image} hidden={c.image.used && c.facts?.width ? `${c.facts.width}×${c.facts.height}` : undefined} />
        </div>
        {c.notes.length > 0 && (
          <ul className="mt-2 space-y-1">
            {c.notes.map((n) => (
              <li key={n} className="flex gap-1.5 text-[12.5px] leading-[18px] text-ds-ink-2">
                <IconInfo className="mt-px h-3.5 w-3.5 shrink-0 text-ds-ink-3" />
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/* ---------------- image facts line ---------------- */

function kb(b: number) {
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}

export function FactsLine({ f, raw }: { f?: ImageFacts; raw: string }) {
  if (!raw) return <>No image set. Use 1200×630, JPG or PNG, under 1 MB.</>;
  if (!/^https?:\/\//i.test(raw)) return <span className="text-[#b23a2a]">Relative URL: platforms ignore it. Use the full https:// address.</span>;
  if (!f || f.state === "loading") return <>Checking the image…</>;
  if (f.state === "error") return <span className="text-[#b23a2a]">{f.source === "probe" ? `Our server couldn't fetch it${f.httpStatus ? ` (HTTP ${f.httpStatus})` : ""}.` : "Didn't load in your browser. Check the URL."}</span>;
  const bits = [f.width && f.height ? `${f.width}×${f.height}` : "size unknown", f.format?.toUpperCase() ?? null, f.bytes ? kb(f.bytes) : null].filter(Boolean);
  return (
    <>
      {bits.join(" · ")} <span className="text-ds-ink-3">· {f.source === "probe" ? "checked by our server" : "measured in your browser, file size unknown"}</span>
    </>
  );
}

/* ---------------- the section ---------------- */

const OG_TYPES = ["website", "article", "product", "profile", "book", "video.other", "music.song"];
const CARDS = ["summary_large_image", "summary", "app", "player"];

type View = "all" | Platform;

export function SocialSection({
  fields,
  set,
  cards,
  mode,
  ogFacts,
  pageUrl,
}: {
  fields: MetaFields;
  set: <K extends keyof MetaFields>(k: K, v: MetaFields[K]) => void;
  cards: SocialCard[];
  mode: "manual" | "url";
  ogFacts?: ImageFacts;
  pageUrl: string;
}) {
  const [view, setView] = useState<View>("all");
  const manual = mode === "manual";
  const inherit = (what: string, value: string) => (manual ? (value ? `Uses the ${what}: ${value.slice(0, 60)}${value.length > 60 ? "…" : ""}` : `Uses the ${what}`) : "Not set on the page");
  const shown = view === "all" ? cards : cards.filter((c) => c.platform === view);
  const typeOptions = OG_TYPES.includes(fields.ogType) || !fields.ogType ? OG_TYPES : [fields.ogType, ...OG_TYPES];
  const cardOptions = CARDS.includes(fields.twitterCard) || !fields.twitterCard ? CARDS : [fields.twitterCard, ...CARDS];

  return (
    <section className="glass rounded-[24px] p-4 sm:p-6">
      <SectionTitle lead="How it looks when" accent="shared">
        <ModeSwitch<View> value={view} onChange={setView} label="Platform" options={[{ value: "all", label: "All" }, ...PLATFORMS.map((p) => ({ value: p.id as View, label: p.name }))]} />
      </SectionTitle>

      <div className={`grid min-w-0 gap-4 ${view === "all" ? "md:grid-cols-2" : ""}`}>
        {shown.map((c) => (
          <PlatformCard key={c.platform} c={c} url={pageUrl} favicon={fields.favicon} theme={fields.themeColor} detailed={view !== "all"} />
        ))}
      </div>

      <div className="mt-6 grid gap-5 border-t border-white/60 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Field label="Share image" htmlFor="sp-ogimg" hint={<FactsLine f={ogFacts} raw={fields.ogImage.trim()} />}>
            <input id="sp-ogimg" value={fields.ogImage} onChange={(e) => set("ogImage", e.target.value)} className={monoFieldCls} placeholder="https://yoursite.com/og.png" spellCheck={false} inputMode="url" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Image alt text" htmlFor="sp-ogalt" hint="og:image:alt, read aloud by screen readers.">
            <input id="sp-ogalt" value={fields.ogImageAlt} onChange={(e) => set("ogImageAlt", e.target.value)} className={fieldCls} placeholder="What the image shows" />
          </Field>
        </div>
        <Field label="og:type" htmlFor="sp-ogtype">
          <select id="sp-ogtype" value={fields.ogType} onChange={(e) => set("ogType", e.target.value)} className={`${fieldCls} appearance-none pr-2 text-[14px]`}>
            <option value="">{manual ? "website (default)" : "Not set"}</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="twitter:card" htmlFor="sp-twcard">
          <select id="sp-twcard" value={fields.twitterCard} onChange={(e) => set("twitterCard", e.target.value)} className={`${fieldCls} appearance-none pr-2 text-[14px]`}>
            <option value="">{manual ? "Automatic" : "Not set"}</option>
            {cardOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="theme-color" htmlFor="sp-theme">
          <div className="glass-inset flex items-center gap-2 rounded-[12px] py-1 pl-1.5 pr-2.5">
            <input
              type="color"
              aria-label="Pick theme color"
              value={/^#[0-9a-f]{6}$/i.test(fields.themeColor) ? fields.themeColor : "#f2a97f"}
              onChange={(e) => set("themeColor", e.target.value)}
              className="h-8 w-8 shrink-0 cursor-pointer rounded-[8px] border-0 bg-transparent p-0"
            />
            <input id="sp-theme" value={fields.themeColor} onChange={(e) => set("themeColor", e.target.value)} placeholder="none" className="h-8 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ds-ink outline-none placeholder:text-ds-ink-3" spellCheck={false} />
          </div>
        </Field>
        <Field label="Language" htmlFor="sp-lang">
          <input id="sp-lang" value={fields.lang} onChange={(e) => set("lang", e.target.value)} className={monoFieldCls} placeholder="en-US" spellCheck={false} />
        </Field>
      </div>
      <div className="mt-5">
        <details className="group/o rounded-[16px] border border-white/60 bg-white/25 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] text-ds-ink">
            Social titles and text
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden className="text-ds-ink-2 transition-transform duration-300 group-open/o:rotate-180">
              <path d="m6.5 9.5 5.5 5.2 5.4-5.4" />
            </svg>
          </summary>
          <div className="grid gap-4 border-t border-white/60 px-4 py-4 sm:grid-cols-2">
            <Field label="og:title" htmlFor="sp-ogt">
              <input id="sp-ogt" value={fields.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} className={fieldCls} placeholder={inherit("title", fields.title)} />
            </Field>
            <Field label="og:description" htmlFor="sp-ogd">
              <textarea id="sp-ogd" rows={2} value={fields.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} className={`${fieldCls} resize-y`} placeholder={inherit("description", fields.description)} />
            </Field>
            <Field label="og:url" htmlFor="sp-ogu">
              <input id="sp-ogu" value={fields.ogUrl} onChange={(e) => set("ogUrl", e.target.value)} className={monoFieldCls} placeholder={manual ? "Uses the page URL" : "Not set on the page"} spellCheck={false} />
            </Field>
            <Field label="twitter:title" htmlFor="sp-twt">
              <input id="sp-twt" value={fields.twitterTitle} onChange={(e) => set("twitterTitle", e.target.value)} className={fieldCls} placeholder={manual ? "Uses og:title" : "Not set: X uses og:title"} />
            </Field>
            <Field label="twitter:description" htmlFor="sp-twd">
              <textarea id="sp-twd" rows={2} value={fields.twitterDescription} onChange={(e) => set("twitterDescription", e.target.value)} className={`${fieldCls} resize-y`} placeholder={manual ? "Uses og:description" : "Not set: X uses og:description"} />
            </Field>
            <Field label="twitter:image" htmlFor="sp-twi">
              <input id="sp-twi" value={fields.twitterImage} onChange={(e) => set("twitterImage", e.target.value)} className={monoFieldCls} placeholder={manual ? "Uses the share image" : "Not set: X uses og:image"} spellCheck={false} />
            </Field>
            <Field label="twitter:image:alt" htmlFor="sp-twia">
              <input id="sp-twia" value={fields.twitterImageAlt} onChange={(e) => set("twitterImageAlt", e.target.value)} className={fieldCls} placeholder={manual ? "Uses the image alt text" : "Not set"} />
            </Field>
          </div>
        </details>
      </div>
    </section>
  );
}
