"use client";

import { useMemo, useState } from "react";
import { useAfterMount } from "@/components/tools/sitemap-xml-generator/crawl/useAfterMount";
import { motion, useReducedMotion } from "framer-motion";
import type { CrawlResult } from "@/lib/crawl/types";
import { isIndexable } from "@/lib/crawl/report";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { groupEntries } from "@/lib/tools/htmlSitemap/htmlSitemapGenerator";
import { crawlToHtmlEntries, DEFAULT_HTML_OPTIONS, detectSiteNameAffix, type HtmlFromCrawlOptions } from "@/lib/tools/htmlSitemap/fromCrawl";
import { loadLastCrawl, saveLastCrawl } from "@/lib/tools/sitemap/sitemapWorkspaceStorage";
import { CrawlRunner, Toggle } from "@/components/tools/sitemap-xml-generator/crawl/CrawlRunner";
import { CrawlOverview, CrawlPagesTable, type PageFilter } from "@/components/tools/sitemap-xml-generator/crawl/CrawlReport";

const EASE = [0.22, 1, 0.36, 1] as const;

function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="glass-inset inline-flex rounded-[12px] p-0.5">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-[10px] px-3 py-1 text-[13px] transition ${value === o.v ? "bg-white/90 text-ds-ink shadow-[0_6px_16px_-10px_rgba(43,41,39,.5)]" : "text-ds-ink-2 hover:text-ds-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Crawl the site, pick pages, choose how to group and label them, then hand rows to the editor. */
export function CrawlImport({ onBuild }: { onBuild: (entries: HtmlSitemapEntry[], siteName: string, host: string) => void }) {
  const reduce = useReducedMotion();
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [last, setLast] = useState<{ savedAt: number; result: CrawlResult } | null>(null);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PageFilter>("included");
  const [opts, setOpts] = useState<HtmlFromCrawlOptions>(DEFAULT_HTML_OPTIONS);

  useAfterMount(() => {
    const prev = loadLastCrawl<CrawlResult>();
    if (prev?.result?.pages) setLast(prev);
  });

  function accept(r: CrawlResult, persist = true) {
    setResult(r);
    setIncluded(new Set(r.pages.filter(isIndexable).map((p) => p.url)));
    setFilter("included");
    if (persist) {
      saveLastCrawl(r);
      setLast({ savedAt: Date.now(), result: r });
    }
  }

  const pages = useMemo(() => (result ? result.pages.filter((p) => included.has(p.url)) : []), [result, included]);
  const entries = useMemo(() => crawlToHtmlEntries(pages, opts), [pages, opts]);
  const grouped = useMemo(() => groupEntries(entries), [entries]);
  const siteName = useMemo(() => {
    const affix = detectSiteNameAffix(pages.map((p) => p.title ?? "").filter(Boolean));
    return affix.suffix ?? affix.prefix ?? result?.host ?? "Sitemap";
  }, [pages, result]);
  const set = <K extends keyof HtmlFromCrawlOptions>(k: K, v: HtmlFromCrawlOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div className="space-y-6">
      <CrawlRunner
        slug="sitemap-html-generator"
        cta={result ? "Crawl again" : "Crawl my site"}
        onResult={(r) => accept(r)}
        initialUrl={result?.host ?? ""}
        compact={!!result}
        lastCrawl={!result && last ? { savedAt: last.savedAt, host: last.result.host, pages: last.result.summary.indexable } : null}
        onReuse={() => last && accept(last.result, false)}
      />

      {result && (
        <motion.div key={result.crawledAt} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-6">
          <CrawlOverview result={result} onFilter={setFilter} active={filter} />

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="min-w-0">
              <CrawlPagesTable result={result} included={included} onChange={setIncluded} filter={filter} onFilter={setFilter} />
            </div>
            <section className="glass space-y-5 rounded-[24px] p-5 sm:p-6 xl:sticky xl:top-6 xl:h-fit">
              <h3 className="font-serif text-[30px] leading-none">
                Shape the <span className="italic">page</span>
              </h3>
              <div className="space-y-2">
                <p className="text-[14px] text-ds-ink">Sections from URL folders</p>
                <Segmented value={opts.depth} onChange={(v) => set("depth", v)} options={[{ v: 1, label: "/blog" }, { v: 2, label: "/blog/news" }]} />
              </div>
              <div className="space-y-2">
                <p className="text-[14px] text-ds-ink">Link text</p>
                <Segmented value={opts.label} onChange={(v) => set("label", v)} options={[{ v: "title", label: "Page title" }, { v: "h1", label: "Main heading" }, { v: "url", label: "From URL" }]} />
              </div>
              <Toggle checked={opts.stripSiteName} onChange={(v) => set("stripSiteName", v)} label="Drop the site name from titles" hint={`"Pricing | ${siteName}" becomes "Pricing".`} />
              <Toggle checked={opts.minSection > 1} onChange={(v) => set("minSection", v ? 2 : 1)} label="Fold one-page sections into Pages" hint="Keeps the sitemap from turning into dozens of tiny headings." />

              <div className="glass-inset max-h-[260px] overflow-auto rounded-[14px] p-3">
                {grouped.length ? (
                  <ul className="space-y-2.5">
                    {grouped.map((g) => (
                      <li key={g.section}>
                        <p className="flex items-baseline justify-between gap-2 text-[13.5px] font-medium text-ds-ink">
                          <span className="truncate">{g.section}</span>
                          <span className="shrink-0 text-[12px] font-normal tabular-nums text-ds-ink-3">{g.entries.length}</span>
                        </p>
                        <p className="truncate text-[12.5px] text-ds-ink-2">{g.entries.slice(0, 3).map((e) => e.label).join(" · ")}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-ds-ink-3">Select some pages in the table.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onBuild(entries, siteName, result.host)}
                disabled={!entries.length}
                className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-ds-accent px-5 text-[15px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)] active:translate-y-px disabled:opacity-40"
              >
                Build the HTML sitemap · {entries.length.toLocaleString()} links
              </button>
              <p className="text-[12.5px] leading-5 text-ds-ink-3">Only indexable pages are selected by default: linking people to noindex, redirecting or broken pages helps nobody.</p>
            </section>
          </div>
        </motion.div>
      )}
    </div>
  );
}
