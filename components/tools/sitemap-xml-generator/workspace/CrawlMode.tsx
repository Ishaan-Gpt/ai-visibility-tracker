"use client";

import { useMemo, useState } from "react";
import { useAfterMount } from "@/components/tools/sitemap-xml-generator/crawl/useAfterMount";
import { motion, useReducedMotion } from "framer-motion";
import type { CrawlResult } from "@/lib/crawl/types";
import { isIndexable } from "@/lib/crawl/report";
import type { ChangeFreq, SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { generateSitemap } from "@/lib/tools/sitemap/sitemapGenerator";
import { scoreSitemap } from "@/lib/tools/sitemap/sitemapValidation";
import { crawlToEntries, DEFAULT_XML_OPTIONS, type XmlFromCrawlOptions } from "@/lib/tools/sitemap/fromCrawl";
import { loadLastCrawl, saveLastCrawl } from "@/lib/tools/sitemap/sitemapWorkspaceStorage";
import { CrawlRunner, Toggle } from "@/components/tools/sitemap-xml-generator/crawl/CrawlRunner";
import { CrawlOverview, CrawlPagesTable, IssueList, type PageFilter } from "@/components/tools/sitemap-xml-generator/crawl/CrawlReport";
import { timeAgo } from "@/components/tools/sitemap-xml-generator/crawl/useCrawlStream";
import { SitemapHealthScore } from "@/components/tools/sitemap-xml-generator/workspace/SitemapHealthScore";
import { XmlPreviewPanel } from "@/components/tools/sitemap-xml-generator/workspace/XmlPreviewPanel";

const EASE = [0.22, 1, 0.36, 1] as const;
const CHANGEFREQ: ChangeFreq[] = ["", "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

function defaultIncluded(r: CrawlResult): Set<string> {
  return new Set(r.pages.filter(isIndexable).map((p) => p.url));
}

/**
 * Crawl mode: crawl the live site, review every URL with the reason it is (or isn't) suggested,
 * then generate the sitemap from the rows you keep.
 */
export function CrawlMode({ onSendToManual, initialUrl }: { onSendToManual: (entries: SitemapUrlEntry[]) => void; initialUrl?: string }) {
  const reduce = useReducedMotion();
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PageFilter>("included");
  const [opts, setOpts] = useState<XmlFromCrawlOptions>(DEFAULT_XML_OPTIONS);
  const [gzip, setGzip] = useState(false);
  const [last, setLast] = useState<{ savedAt: number; result: CrawlResult } | null>(null);

  // Restore the last crawl after mount (localStorage is browser-only).
  useAfterMount(() => {
    const prev = loadLastCrawl<CrawlResult>();
    if (prev?.result?.pages) {
      setLast(prev);
      setResult(prev.result);
      setSavedAt(prev.savedAt);
      setIncluded(defaultIncluded(prev.result));
      setOpts((o) => ({ ...o, images: false, hreflang: prev.result.summary.hreflangPages > 0 }));
    }
  });

  function accept(r: CrawlResult) {
    setResult(r);
    setSavedAt(null);
    setIncluded(defaultIncluded(r));
    setFilter("included");
    setOpts((o) => ({ ...o, hreflang: r.summary.hreflangPages > 0 }));
    saveLastCrawl(r);
    setLast({ savedAt: Date.now(), result: r });
  }

  const entries = useMemo(() => {
    if (!result) return [];
    return crawlToEntries(result.pages.filter((p) => included.has(p.url)), opts);
  }, [result, included, opts]);
  const generated = useMemo(() => generateSitemap(entries, undefined, { gzip }), [entries, gzip]);
  const score = useMemo(() => scoreSitemap(entries), [entries]);
  const set = <K extends keyof XmlFromCrawlOptions>(k: K, v: XmlFromCrawlOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  const lastmodCoverage = entries.length ? Math.round((entries.filter((e) => e.lastmod).length / entries.length) * 100) : 0;
  const imagePages = result ? result.pages.filter((p) => included.has(p.url) && p.images?.length).length : 0;
  const hreflangPages = result ? result.pages.filter((p) => included.has(p.url) && p.hreflang?.length).length : 0;

  return (
    <div className="space-y-6">
      <CrawlRunner
        slug="sitemap-xml-generator"
        cta={result ? "Crawl again" : "Crawl my site"}
        onResult={accept}
        initialUrl={initialUrl ?? (result ? result.host : "")}
        compact={!!result}
      />

      {result && (
        <motion.div key={result.crawledAt} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-6">
          {savedAt && (
            <p className="pl-3 text-[13px] text-ds-ink-3">
              Showing your crawl of {result.host} from {timeAgo(savedAt)}. Crawl again for fresh data.
            </p>
          )}
          <CrawlOverview result={result} onFilter={setFilter} active={filter} />
          <IssueList issues={result.issues} />
          <CrawlPagesTable result={result} included={included} onChange={setIncluded} filter={filter} onFilter={setFilter} />

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-6">
              <section className="glass rounded-[24px] p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h3 className="font-serif text-[32px] leading-none">
                    Your <span className="italic">sitemap</span>
                  </h3>
                  <p className="text-[13.5px] text-ds-ink-2">
                    <span className="font-serif text-[18px] text-ds-ink">{entries.length.toLocaleString()}</span> URLs selected
                    {result.pages.filter(isIndexable).length !== entries.length && (
                      <>
                        {" · "}
                        <button type="button" onClick={() => setIncluded(defaultIncluded(result))} className="underline underline-offset-2 hover:text-ds-ink">
                          reset to all indexable
                        </button>
                      </>
                    )}
                  </p>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Toggle
                    checked={opts.lastmod}
                    onChange={(v) => set("lastmod", v)}
                    label="Include lastmod"
                    hint={`From your current sitemap, the page's own modified date, or the Last-Modified header; never invented. ${lastmodCoverage}% of selected URLs have one.`}
                  />
                  <Toggle
                    checked={opts.images}
                    onChange={(v) => set("images", v)}
                    label="Add image entries"
                    hint={imagePages ? `Lists up to 20 images found on each of ${imagePages.toLocaleString()} pages (image:image), so Google Images can find them.` : "No images were found on the selected pages."}
                  />
                  <Toggle
                    checked={opts.hreflang}
                    onChange={(v) => set("hreflang", v)}
                    label="Add hreflang alternates"
                    hint={hreflangPages ? `${hreflangPages.toLocaleString()} pages declare language versions; they are listed as xhtml:link alternates.` : "No page declares hreflang alternates."}
                  />
                  <Toggle checked={opts.priority} onChange={(v) => set("priority", v)} label="Suggest priority from depth" hint="Home 1.0, one click 0.8, two 0.6, deeper 0.4-0.5. Google ignores priority; other engines may read it." />
                  <label className="flex items-start gap-3">
                    <select
                      value={opts.changefreq}
                      onChange={(e) => set("changefreq", e.target.value as ChangeFreq)}
                      className="mt-0.5 h-8 rounded-[10px] border border-white/70 bg-white/60 px-2 text-[13px] text-ds-ink"
                    >
                      {CHANGEFREQ.map((c) => (
                        <option key={c || "none"} value={c}>
                          {c || "Leave out"}
                        </option>
                      ))}
                    </select>
                    <span className="min-w-0">
                      <span className="block text-[14px] text-ds-ink">changefreq</span>
                      <span className="block text-[12.5px] leading-5 text-ds-ink-3">Google ignores it too. Leaving it out keeps the file honest and small.</span>
                    </span>
                  </label>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSendToManual(entries)}
                    disabled={!entries.length}
                    className="glass-inset inline-flex h-10 items-center rounded-[12px] px-4 text-[14px] text-ds-ink transition hover:bg-white/80 disabled:opacity-40"
                  >
                    Edit these URLs by hand
                  </button>
                </div>
              </section>
              <XmlPreviewPanel generated={generated} gzip={gzip} onGzipChange={setGzip} />
              <p className="pl-1 text-[12.5px] leading-5 text-ds-ink-3">
                Upload the file{generated.index ? "s" : ""} to your site root, add <span className="font-mono">Sitemap: https://{result.host}/{generated.index ? generated.index.filename : generated.files[0].filename}</span> to robots.txt, then submit it in
                Search Console.{generated.index ? " Over 50,000 URLs or 50 MB, the sitemap is split automatically and tied together by a sitemap index." : ""}
              </p>
            </div>
            <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
              <SitemapHealthScore score={score} />
            </div>
          </div>
        </motion.div>
      )}

      {!result && last === null && <EmptyHint />}
    </div>
  );
}

function EmptyHint() {
  const steps = [
    ["Reads robots.txt and your sitemaps", "So we respect your rules and know which URLs you already submit."],
    ["Follows every internal link", "Like a search engine would, recording status, depth, titles and dates."],
    ["Keeps only pages Google can index", "noindex, redirects, broken and canonicalised pages are left out, with the reason shown."],
  ];
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {steps.map(([t, b], i) => (
        <li key={t} className="glass rounded-[20px] p-5">
          <span className="font-serif text-[30px] italic leading-none text-ds-accent-ink">{i + 1}</span>
          <p className="mt-2 text-[15px] font-medium text-ds-ink">{t}</p>
          <p className="mt-1 text-[13.5px] leading-5 text-ds-ink-2">{b}</p>
        </li>
      ))}
    </ol>
  );
}
