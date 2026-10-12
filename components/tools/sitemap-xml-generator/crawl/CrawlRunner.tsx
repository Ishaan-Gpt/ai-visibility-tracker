"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ErrorNote, QuotaNote } from "@/components/tools/shell/Bits";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { useViewer } from "@/components/viewer/useViewer";
import { CRAWL_PAGE_LIMITS } from "@/lib/limits";
import type { CrawlProgress, CrawlResult } from "@/lib/crawl/types";
import { timeAgo, useCrawlStream } from "@/components/tools/sitemap-xml-generator/crawl/useCrawlStream";

function SlidersGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className} aria-hidden>
      <path d="M3 6h8M15 6h2M3 14h3M10 14h7" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="8" cy="14" r="2" />
    </svg>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-ds-accent" : "bg-ds-ink/15"}`}
      >
        <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ds-spring)] ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
      <span className="min-w-0">
        <span className="block text-[14px] text-ds-ink">{label}</span>
        {hint && <span className="block text-[12.5px] leading-5 text-ds-ink-3">{hint}</span>}
      </span>
    </label>
  );
}
export { Toggle };

const PHASE: Record<CrawlProgress["phase"], string> = {
  robots: "Reading robots.txt",
  sitemaps: "Reading your sitemaps",
  crawl: "Following links",
  finishing: "Putting the report together",
};

/** Live crawl meter: a 100-cell page grid fills as pages come in; a hairline tracks the time budget. */
export function CrawlProgressCard({ progress, startedAt, cap, onCancel, noun = "pages" }: { progress: CrawlProgress | null; startedAt: number | null; cap: number; onCancel: () => void; noun?: string }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const elapsed = startedAt ? now - startedAt : 0;
  const budget = progress?.budgetMs ?? 50_000;
  const crawled = progress?.crawled ?? 0;
  const total = progress?.cap ?? cap;
  const filled = Math.min(100, Math.round((crawled / Math.max(1, total)) * 100));
  const phase = progress ? PHASE[progress.phase] : "Connecting";

  return (
    <div className="glass relative overflow-hidden rounded-[24px] p-5 sm:p-7" aria-live="polite">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.45),transparent)]" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_1.05fr] md:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13.5px] text-ds-ink-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ds-accent/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ds-accent" />
            </span>
            {phase}
          </p>
          <p className="mt-3 font-serif text-[64px] leading-[0.9] tabular-nums text-ds-ink sm:text-[76px]">
            {crawled.toLocaleString()}
            <span className="ml-2 text-[22px] italic text-ds-ink-3">/ {total.toLocaleString()} {noun}</span>
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-[12.5px]">
            {[
              ["Discovered", progress?.discovered ?? 0],
              ["Waiting", progress?.queued ?? 0],
              ["In sitemaps", progress?.sitemapUrls ?? 0],
            ].map(([k, v]) => (
              <div key={k as string} className="glass-inset rounded-[12px] px-3 py-2">
                <dt className="text-ds-ink-3">{k}</dt>
                <dd className="font-serif text-[20px] tabular-nums text-ds-ink">{(v as number).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 h-5 truncate font-mono text-[12px] text-ds-ink-3" title={progress?.current}>
            {progress?.current ? progress.current.replace(/^https?:\/\//, "") : " "}
          </p>
        </div>

        <div>
          <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]" aria-hidden>
            {Array.from({ length: 100 }, (_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{ opacity: i < filled ? 1 : 0.35, scale: i < filled ? 1 : 0.86 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`aspect-square rounded-[3px] ${i < filled ? "bg-ds-accent" : "bg-ds-ink/[0.07]"}`}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[12.5px] text-ds-ink-3">
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-ds-ink/10">
              <div className="h-full rounded-full bg-ds-ink/40 transition-[width] duration-300" style={{ width: `${Math.min(100, (elapsed / budget) * 100)}%` }} />
            </div>
            <span className="tabular-nums">
              {Math.floor(elapsed / 1000)}s of ~{Math.round(budget / 1000)}s
            </span>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onCancel} className="glass-inset inline-flex h-9 items-center rounded-[11px] px-3.5 text-[13.5px] text-ds-ink-2 transition hover:bg-white/80 hover:text-ds-ink">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function parsePatterns(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

/**
 * Domain field, crawl options and the live progress card. Shared by the XML and HTML sitemap tools.
 * Calls `onResult` with the finished crawl; the parent decides what to show.
 */
export function CrawlRunner({
  slug,
  cta,
  onResult,
  initialUrl = "",
  lastCrawl,
  onReuse,
  compact = false,
}: {
  slug: string;
  cta: string;
  onResult: (r: CrawlResult) => void;
  initialUrl?: string;
  lastCrawl?: { savedAt: number; host: string; pages: number } | null;
  onReuse?: () => void;
  compact?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [showOptions, setShowOptions] = useState(false);
  const [includeSubdomains, setIncludeSubdomains] = useState(false);
  const [patterns, setPatterns] = useState("");
  const viewer = useViewer();
  const pathname = usePathname();
  const crawl = useCrawlStream<CrawlResult>("/api/tools/crawl");
  const tier = viewer?.tier ?? "anon";
  const cap = (crawl.meta?.cap as number | undefined) ?? CRAWL_PAGE_LIMITS[tier];
  const running = crawl.status === "running";

  // Follow a new initialUrl from the parent (e.g. "fix with a crawl" from Validate mode).
  const [prevInitial, setPrevInitial] = useState(initialUrl);
  if (initialUrl !== prevInitial) {
    setPrevInitial(initialUrl);
    if (initialUrl) setUrl(initialUrl);
  }

  async function start() {
    const r = await crawl.run({ url, includeSubdomains, excludePatterns: parsePatterns(patterns) });
    if (r) onResult(r);
  }

  return (
    // The legacy studio-scope gives every input a box + focus ring; the shared input bar has its own.
    <div className="space-y-4 [&_form_input]:!rounded-none [&_form_input]:!border-0 [&_form_input]:!shadow-none">
      <ToolInputBar
        value={url}
        onChange={setUrl}
        onSubmit={start}
        loading={running}
        placeholder="yoursite.com"
        label="Your site's domain"
        cta={cta}
        slug={slug}
        examples={compact || running ? undefined : ["nextjs.org", "ma.tt", "example.com"]}
      >
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          aria-expanded={showOptions}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] px-4 text-[14px] transition ${showOptions ? "bg-white/80 text-ds-ink" : "text-ds-ink-2 hover:bg-white/60 hover:text-ds-ink"}`}
        >
          <SlidersGlyph className="h-4 w-4" /> Options
        </button>
      </ToolInputBar>

      {showOptions && !running && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="glass grid gap-5 rounded-[20px] p-5 md:grid-cols-2">
          <Toggle checked={includeSubdomains} onChange={setIncludeSubdomains} label="Include subdomains" hint="Also crawl blog.yoursite.com, shop.yoursite.com and so on. www and the bare domain always count as one site." />
          <label className="block">
            <span className="block text-[14px] text-ds-ink">Skip URLs matching</span>
            <textarea
              value={patterns}
              onChange={(e) => setPatterns(e.target.value)}
              rows={2}
              placeholder={"/tag/*\n/cart"}
              className="mt-1.5 w-full resize-y rounded-[12px] border border-white/70 bg-white/55 px-3 py-2 font-mono text-[12.5px] text-ds-ink outline-none placeholder:text-ds-ink-3"
            />
            <span className="block text-[12.5px] leading-5 text-ds-ink-3">One per line. Starting with / matches the path from the start (* is a wildcard, $ ends it); anything else matches anywhere in the URL.</span>
          </label>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {crawl.quota ? (
          <QuotaNote quota={crawl.quota} noun="crawls" />
        ) : (
          <p className="pl-3 text-[13px] text-ds-ink-2">
            Crawls up to <span className="font-serif text-[16px] text-ds-ink">{CRAWL_PAGE_LIMITS[tier].toLocaleString()}</span> pages in about 50 seconds on our servers, following robots.txt.
            {tier === "anon" && (
              <>
                {" "}
                <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className="underline underline-offset-2 hover:text-ds-ink">
                  Free account: {CRAWL_PAGE_LIMITS.free}
                </Link>
                .
              </>
            )}
          </p>
        )}
        {lastCrawl && onReuse && !running && (
          <button type="button" onClick={onReuse} className="glass-inset inline-flex items-center gap-2 rounded-[11px] px-3 py-1.5 text-[13px] text-ds-ink-2 transition hover:bg-white/80 hover:text-ds-ink">
            Reuse your crawl of <span className="font-medium text-ds-ink">{lastCrawl.host}</span> · {lastCrawl.pages} pages · {timeAgo(lastCrawl.savedAt)}
          </button>
        )}
      </div>

      {crawl.error && <ErrorNote message={crawl.error.message} limited={crawl.error.limited} />}
      {running && <CrawlProgressCard progress={crawl.progress} startedAt={crawl.startedAt} cap={cap} onCancel={crawl.cancel} />}
    </div>
  );
}
