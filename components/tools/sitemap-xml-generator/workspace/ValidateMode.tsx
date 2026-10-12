"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Dial } from "@/components/studio/Pieces";
import { SeverityIcon } from "@/components/ds/extras";
import { IconChevron } from "@/components/icons/Icons";
import { ErrorNote, PrintFooter, PrintHeader, QuotaNote } from "@/components/tools/shell/Bits";
import { ResultActions } from "@/components/tools/shell/ResultActions";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { VERDICT_LABEL, type ProtocolIssue, type SampleVerdict, type SitemapCheckReport } from "@/lib/crawl/types";
import { CrawlProgressCard } from "@/components/tools/sitemap-xml-generator/crawl/CrawlRunner";
import { useCrawlStream } from "@/components/tools/sitemap-xml-generator/crawl/useCrawlStream";

const EASE = [0.22, 1, 0.36, 1] as const;
const GOOD: SampleVerdict[] = ["ok", "ok-non-html"];

const fmtBytes = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);
const short = (u: string) => u.replace(/^https?:\/\//, "");

function headline(r: SitemapCheckReport): [string, string] {
  if (!r.found) return ["No sitemap", "found."];
  if (r.score >= 90) return ["Your sitemap is", "healthy."];
  if (r.score >= 70) return ["A few things to", "fix."];
  if (r.score >= 45) return ["This sitemap needs", "work."];
  return ["Search engines will", "struggle."];
}

function ProtocolIssues({ issues }: { issues: ProtocolIssue[] }) {
  const [open, setOpen] = useState<string | null>(issues[0]?.severity === "error" ? issues[0].code : null);
  if (!issues.length) {
    return (
      <section data-print-card className="glass flex items-center gap-3 rounded-[22px] p-5">
        <SeverityIcon severity="pass" />
        <p className="text-[15px] text-ds-ink">Valid against the sitemaps.org protocol: namespace, URLs, dates, sizes and limits all check out.</p>
      </section>
    );
  }
  return (
    <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
      <h3 className="font-serif text-[32px] leading-none">
        Protocol <span className="italic">check</span>
      </h3>
      <ul className="mt-4 divide-y divide-white/60">
        {issues.map((it) => {
          const isOpen = open === it.code;
          return (
            <li key={it.code} className="py-3">
              <button type="button" onClick={() => setOpen(isOpen ? null : it.code)} className="flex w-full items-start gap-3 text-left" aria-expanded={isOpen}>
                <SeverityIcon severity={it.severity} />
                <span className="min-w-0 flex-1 pt-0.5 text-[15px] font-medium text-ds-ink">
                  {it.message}
                  {it.count > 1 && <span className="ml-2 rounded-md bg-white/70 px-1.5 py-0.5 text-[12px] font-normal tabular-nums text-ds-ink-2">{it.count.toLocaleString()}×</span>}
                </span>
                <IconChevron className={`mt-1.5 h-4 w-4 shrink-0 text-ds-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="ml-10 mt-2 space-y-2">
                  <p className="text-[13.5px] leading-5 text-ds-ink">
                    <span className="font-medium">Fix: </span>
                    {it.fix}
                  </p>
                  {it.examples.length > 0 && (
                    <ul className="space-y-1">
                      {it.examples.map((ex, i) => (
                        <li key={i} className="break-all font-mono text-[12px] leading-5 text-ds-ink-2">
                          {ex.line ? <span className="mr-2 rounded bg-white/70 px-1 text-ds-ink">line {ex.line}</span> : null}
                          {ex.value}
                          {ex.file ? <span className="ml-2 text-ds-ink-3">in {short(ex.file)}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Validate mode: fetch the live sitemap(s), check the protocol, then live-check a sample of listed URLs. */
export function ValidateMode({ onFixWithCrawl }: { onFixWithCrawl: (host: string) => void }) {
  const [url, setUrl] = useState("");
  const [showAll, setShowAll] = useState(false);
  const check = useCrawlStream<SitemapCheckReport>("/api/tools/sitemap-check");
  const r = check.result;
  const reduce = useReducedMotion();
  const running = check.status === "running";
  const sampleCap = (check.meta?.sample as number | undefined) ?? 50;

  const verdictCounts = useMemo(() => {
    const m = new Map<SampleVerdict, number>();
    for (const x of r?.sample.results ?? []) m.set(x.verdict, (m.get(x.verdict) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [r]);
  const sampleRows = (r?.sample.results ?? []).filter((x) => showAll || !GOOD.includes(x.verdict));
  const [h1, h2] = r ? headline(r) : ["", ""];

  return (
    <div className="space-y-6">
      <div className="space-y-3 [&_form_input]:!rounded-none [&_form_input]:!border-0 [&_form_input]:!shadow-none">
        <ToolInputBar
          value={url}
          onChange={setUrl}
          onSubmit={() => check.run({ url })}
          loading={running}
          placeholder="yoursite.com or yoursite.com/sitemap.xml"
          label="Domain or sitemap URL"
          cta="Validate sitemap"
          slug="sitemap-xml-generator"
          examples={r || running ? undefined : ["nextjs.org", "ma.tt/sitemap.xml"]}
        />
        {check.quota ? (
          <QuotaNote quota={check.quota} noun="crawls" />
        ) : (
          <p className="pl-3 text-[13px] text-ds-ink-2">Reads every sitemap file (indexes and .gz included), validates it line by line, then live-checks a sample of the listed URLs. Uses one of your daily crawls.</p>
        )}
      </div>

      {check.error && <ErrorNote message={check.error.message} limited={check.error.limited} />}
      {running && <CrawlProgressCard progress={check.progress} startedAt={check.startedAt} cap={sampleCap} onCancel={check.cancel} noun="URLs checked" />}

      {r && !running && (
        <motion.div key={r.checkedAt} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-6">
          <PrintHeader title="Sitemap validation report" subject={r.input} when={r.checkedAt} />
          <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-9">
            <div aria-hidden className="pointer-events-none absolute -left-20 -bottom-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.5),transparent)] print:hidden" />
            <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="text-center">
                <Dial value={r.score} size={136} />
                <p className="mt-2 text-[12.5px] text-ds-ink-2">Sitemap score</p>
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-[42px] leading-[0.98] sm:text-[54px]">
                  {h1} <span className="italic">{h2}</span>
                </h2>
                <p className="mt-3 text-[15.5px] leading-6 text-ds-ink-2">
                  {r.found ? (
                    <>
                      {r.totals.uniqueUrls.toLocaleString()} URLs in {r.totals.files} file{r.totals.files === 1 ? "" : "s"}
                      {r.totals.indexes ? ` (${r.totals.indexes} index${r.totals.indexes === 1 ? "" : "es"})` : ""}
                      {r.discoveredVia === "robots" ? ", found through robots.txt" : r.discoveredVia === "default-path" ? ", found at a default location" : ""}. {r.sample.size} URLs live-checked
                      {r.sample.problemCount ? `: ${r.sample.problemCount} with problems, so roughly ${r.sample.estimatedAffected.toLocaleString()} of all listed URLs are likely affected.` : ", all fine."}
                      {r.totals.truncated ? " Very large sitemap: we read as much as fit in the time limit." : ""}
                    </>
                  ) : (
                    <>We looked in robots.txt and at /sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml and /sitemap-index.xml. Crawl your site to generate one.</>
                  )}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onFixWithCrawl(r.host)}
                    className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-ds-btn px-4 text-[14px] font-medium text-[var(--ds-btn-text)] transition hover:opacity-90 active:translate-y-px"
                  >
                    {r.found ? "Build a clean sitemap from a crawl" : "Crawl and generate a sitemap"}
                  </button>
                  <ResultActions title={r.host} pdfName={`seowise sitemap report - ${r.host}`} onRerun={() => check.run({ url: r.input })} />
                </div>
              </div>
            </div>
          </section>

          <ProtocolIssues issues={r.issues} />

          {r.files.length > 0 && (
            <section data-print-card className="glass rounded-[24px]">
              <h3 className="border-b border-white/60 px-5 py-4 font-serif text-[28px] leading-none sm:px-7">
                Files <span className="italic">read</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13.5px]">
                  <thead>
                    <tr className="border-b border-white/60 text-[12px] text-ds-ink-3">
                      <th className="py-2 pl-5 font-normal sm:pl-7">File</th>
                      <th className="py-2 font-normal">Type</th>
                      <th className="py-2 text-right font-normal">Entries</th>
                      <th className="py-2 text-right font-normal">Size</th>
                      <th className="py-2 pl-4 pr-5 font-normal">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/50">
                    {r.files.map((f) => {
                      const errs = f.issues.filter((i) => i.severity === "error").length;
                      const warns = f.issues.filter((i) => i.severity === "warning").length;
                      return (
                        <tr key={f.url}>
                          <td className="max-w-[360px] py-2 pl-5 sm:pl-7">
                            <a href={f.url} target="_blank" rel="noreferrer" className="block truncate font-mono text-[12.5px] text-ds-ink hover:underline" title={f.url}>
                              {short(f.url)}
                            </a>
                          </td>
                          <td className="py-2 text-ds-ink-2">
                            {f.kind === "sitemapindex" ? "Index" : f.kind === "urlset" ? "URLs" : "?"}
                            {f.gzip ? " · gz" : ""}
                          </td>
                          <td className="py-2 text-right tabular-nums text-ds-ink-2">{f.urlCount.toLocaleString()}</td>
                          <td className="py-2 text-right tabular-nums text-ds-ink-2">{f.bytes ? fmtBytes(f.bytes) : "–"}</td>
                          <td className="py-2 pl-4 pr-5 text-[12.5px]">
                            {f.error ? (
                              <span className="text-[#b23a2a]">{f.error}</span>
                            ) : errs || warns ? (
                              <span className={errs ? "text-[#b23a2a]" : "text-[#a56312]"}>
                                {errs ? `${errs} error type${errs === 1 ? "" : "s"}` : ""}
                                {errs && warns ? ", " : ""}
                                {warns ? `${warns} warning type${warns === 1 ? "" : "s"}` : ""}
                              </span>
                            ) : (
                              <span className="text-[#4c6b57]">Valid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {r.sample.size > 0 && (
            <section data-print-card className="glass rounded-[24px]">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/60 px-5 py-4 sm:px-7">
                <h3 className="font-serif text-[28px] leading-none">
                  Live <span className="italic">check</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {verdictCounts.map(([v, n]) => (
                    <span key={v} className={`rounded-[9px] px-2 py-0.5 text-[12.5px] ${GOOD.includes(v) ? "bg-[#dbe6dc]/80 text-[#4c6b57]" : v === "blocked-us" ? "bg-white/60 text-ds-ink-2" : "bg-[#f6d5cc]/70 text-[#b23a2a]"}`}>
                      {VERDICT_LABEL[v]} <span className="tabular-nums">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
              <p className="px-5 pt-3 text-[13px] leading-5 text-ds-ink-3 sm:px-7">
                {r.sample.size} URLs picked evenly across all files, fetched like a search engine would (no redirects followed), and checked for status, noindex, canonical and robots.txt.
              </p>
              {sampleRows.length > 0 ? (
                <ul className="divide-y divide-white/50 px-5 py-2 sm:px-7">
                  {sampleRows.map((x) => (
                    <li key={x.url} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
                      <span className={`inline-flex min-w-[42px] justify-center rounded-[8px] px-1.5 py-0.5 font-mono text-[11.5px] ${GOOD.includes(x.verdict) ? "bg-[#dbe6dc]/80 text-[#4c6b57]" : "bg-[#f6d5cc]/80 text-[#b23a2a]"}`}>{x.status ?? "–"}</span>
                      <a href={x.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ds-ink hover:underline" title={x.url}>
                        {short(x.url)}
                      </a>
                      <span className="text-[12.5px] text-ds-ink-2">
                        {VERDICT_LABEL[x.verdict]}
                        {x.detail ? ` · ${x.detail}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-[14px] text-ds-ink sm:px-7">Every sampled URL returned 200, is indexable and self-canonical.</p>
              )}
              <div className="px-5 pb-4 sm:px-7">
                <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[13px] text-ds-ink-2 underline underline-offset-2 hover:text-ds-ink">
                  {showAll ? "Show problems only" : `Show all ${r.sample.size} checked URLs`}
                </button>
              </div>
            </section>
          )}
          <PrintFooter />
        </motion.div>
      )}
    </div>
  );
}
