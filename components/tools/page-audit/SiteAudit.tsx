"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Dial } from "@/components/studio/Pieces";
import { SeverityIcon, verdictFor } from "@/components/ds/extras";
import { IconChevron as ChevronDown } from "@/components/icons/Icons";
import { PrintFooter, PrintHeader, type QuotaInfo } from "@/components/tools/shell/Bits";
import { exportPdf } from "@/components/tools/shell/ResultActions";
import type { CrawlProgress } from "@/lib/crawl/types";
import type { SiteAuditReport, SiteIssueGroup, SitePage } from "@/lib/tools/pageAudit/siteTypes";
import { CategoryBars, Panel } from "./DeepPanels";
import { CountPill, EvidenceList } from "./Evidence";

type Line = { type: "meta"; quota?: QuotaInfo; cap?: number } | { type: "progress"; progress: CrawlProgress } | { type: "result"; data: SiteAuditReport } | { type: "error"; message: string } | { type: "heartbeat" };

/** Streams /api/tools/page-audit/site (NDJSON) and exposes progress + the final report. */
export function useSiteAudit() {
  const [report, setReport] = useState<SiteAuditReport | null>(null);
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [error, setError] = useState<{ message: string; limited?: boolean } | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const ac = useRef<AbortController | null>(null);

  const run = useCallback(async (url: string) => {
    if (!url.trim()) return;
    ac.current?.abort();
    const ctrl = new AbortController();
    ac.current = ctrl;
    setLoading(true);
    setError(null);
    setProgress(null);
    setReport(null);
    try {
      const res = await fetch("/api/tools/page-audit/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }), signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ error: "Something went wrong." }));
        if (body.quota) setQuota(body.quota);
        throw Object.assign(new Error(body.error ?? "Something went wrong."), { limited: !!body.limited });
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const raw = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!raw) continue;
          const line = JSON.parse(raw) as Line;
          if (line.type === "meta" && line.quota) setQuota(line.quota);
          else if (line.type === "progress") setProgress(line.progress);
          else if (line.type === "result") setReport(line.data);
          else if (line.type === "error") throw new Error(line.message);
        }
      }
    } catch (e) {
      if (!ctrl.signal.aborted) setError({ message: e instanceof Error ? e.message : "Something went wrong.", limited: (e as { limited?: boolean }).limited });
    } finally {
      if (ac.current === ctrl) setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    ac.current?.abort();
    setLoading(false);
  }, []);

  return { report, progress, error, quota, loading, run, cancel };
}

export function SiteProgress({ progress, onCancel }: { progress: CrawlProgress | null; onCancel: () => void }) {
  const phase = !progress ? "Starting" : progress.phase === "robots" ? "Reading robots.txt" : progress.phase === "sitemaps" ? "Reading sitemaps" : progress.phase === "crawl" ? "Crawling and auditing pages" : "Building the report";
  const pct = progress ? Math.min(100, Math.round((progress.crawled / Math.max(1, Math.min(progress.cap, Math.max(progress.discovered, 1)))) * 100)) : 0;
  return (
    <div className="glass rounded-[24px] p-6 sm:p-8" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-serif text-[30px] leading-none">{phase}…</p>
          <p className="mt-2 truncate text-[13.5px] text-ds-ink-2">{progress?.current ?? "Connecting to the site"}</p>
        </div>
        <button type="button" onClick={onCancel} className="text-[13px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline">
          Stop
        </button>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-ds-muted">
        <div className="h-full rounded-full bg-ds-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
        {[
          `${progress?.crawled ?? 0} pages audited`,
          `${progress?.discovered ?? 0} URLs found`,
          `${progress?.sitemapUrls ?? 0} in sitemaps`,
          `cap ${progress?.cap ?? "…"} pages`,
          `${Math.round((progress?.elapsedMs ?? 0) / 1000)} s`,
        ].map((t) => (
          <span key={t} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">{t}</span>
        ))}
      </div>
    </div>
  );
}

const STOPPED: Record<SiteAuditReport["stoppedBy"], string> = {
  complete: "Crawled every page we could find.",
  "page-cap": "Stopped at your plan's page limit.",
  "time-budget": "Stopped at the time limit; larger plans crawl longer.",
  aborted: "Stopped early.",
};

export function SiteReportView({ report, onAuditPage }: { report: SiteAuditReport; onAuditPage: (url: string) => void }) {
  const v = verdictFor(report.score, report.aiScore);
  const t = report.totals;
  return (
    <div className="space-y-6">
      <PrintHeader title="Site audit" subject={report.resolvedUrl} when={report.checkedAt} />
      <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.5),transparent)] print:hidden" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <Dial value={report.score} size={128} />
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">Site score</p>
            </div>
            <div className="text-center">
              <Dial value={report.aiScore} size={128} />
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">AI ready</p>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-[44px] leading-[0.98] sm:text-[56px]">
              {v.head.replace(/\.$/, "").split(" ").slice(0, -1).join(" ")} <span className="italic">{v.head.replace(/\.$/, "").split(" ").slice(-1)}.</span>
            </h2>
            <p className="mt-3 max-w-[600px] text-[16px] leading-6 text-ds-ink-2">
              {report.host}: {t.crawled} pages crawled, {t.indexable} indexable. {STOPPED[report.stoppedBy]}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
              {[
                `${t.analysed} pages audited`,
                `${t.excluded} not indexable`,
                `${t.broken} broken`,
                `${t.redirects} redirects`,
                `${t.sitemapUrls} sitemap URLs`,
                `${report.issues.length} issue types`,
                `${Math.round(report.durationMs / 1000)} s`,
              ].map((p) => (
                <span key={p} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">{p}</span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => exportPdf(`seowise site audit - ${report.host}`)}
              className="no-print mt-6 inline-flex h-10 items-center rounded-[12px] bg-ds-ink px-4 text-[14px] font-medium text-white"
              data-print-hide
            >
              Export PDF
            </button>
          </div>
        </div>
      </section>

      <CategoryBars categories={report.categories} />
      <IssueList issues={report.issues} crawlIssues={report.crawlIssues} />
      <PageTable pages={report.pages} onAuditPage={onAuditPage} />
      <Panel title="Sitemaps" italic="& robots.txt" badge={<CountPill tone={report.sitemaps.found ? "good" : "accent"}>{report.sitemaps.found ? `${report.sitemaps.urlCount} URLs` : "None found"}</CountPill>}>
        <p className="text-[14px] text-ds-ink-2">
          robots.txt {report.robots.found ? "found" : "not found"}
          {report.robots.sitemaps.length ? `, declares ${report.robots.sitemaps.length} sitemap${report.robots.sitemaps.length > 1 ? "s" : ""}` : ", declares no sitemap"}.
          {!t.linkCrawlComplete && " The link crawl didn't finish, so orphan-page counts are partial."}
        </p>
        <EvidenceList items={report.sitemaps.files.map((f) => `${f.url} · ${f.error ?? `HTTP ${f.status}`} · ${f.urlCount} URLs`)} label="files" />
      </Panel>
      <PrintFooter />
    </div>
  );
}

const SEV_RANK = { error: 0, warning: 1, info: 2, pass: 3 } as const;

function IssueList({ issues, crawlIssues }: { issues: SiteIssueGroup[]; crawlIssues: SiteAuditReport["crawlIssues"] }) {
  const [cat, setCat] = useState<string>("All");
  const all: SiteIssueGroup[] = useMemo(
    () =>
      [
        ...issues,
        ...crawlIssues.map((c) => ({ id: `crawl-${c.id}`, severity: c.severity, category: "Site" as const, title: `${c.title} (${c.count})`, detail: c.detail, fix: c.fix, count: c.count, pages: c.examples.map((url) => ({ url })) })),
      ].sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.count - a.count),
    [issues, crawlIssues],
  );
  const cats = ["All", ...new Set(all.map((i) => i.category))];
  const shown = cat === "All" ? all : all.filter((i) => i.category === cat);
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-serif text-[34px] leading-none">
          Issues <span className="italic">across the site</span>
        </h3>
        <div className="no-print glass inline-flex flex-wrap rounded-[14px] p-1 text-[13px]" data-print-hide role="group" aria-label="Filter issues">
          {cats.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={`rounded-[10px] px-3 py-1.5 transition-colors ${cat === c ? "bg-white/85 text-ds-ink shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" : "text-ds-ink-2 hover:text-ds-ink"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {!shown.length && <p className="glass rounded-[20px] p-5 text-ds-ink-2">No issues in this area.</p>}
      <div className="space-y-3">
        {shown.map((g) => (
          <details key={g.id} data-print-card className="group/d glass rounded-[20px] [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4">
              <SeverityIcon severity={g.severity} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-ds-ink">{g.title}</span>
                <span className="block text-[13px] text-ds-ink-3">{g.category}</span>
              </span>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ds-ink-2 transition-transform duration-300 group-open/d:rotate-180" />
            </summary>
            <div className="border-t border-white/60 px-5 py-4">
              <p className="text-[14px] leading-5 text-ds-ink-2">{g.detail}</p>
              {g.fix && (
                <p className="mt-2 text-[14px] leading-5 text-ds-ink">
                  <span className="font-medium text-ds-accent-ink">Fix · </span>
                  {g.fix}
                </p>
              )}
              <AffectedPages pages={g.pages} total={g.count} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function AffectedPages({ pages, total }: { pages: SiteIssueGroup["pages"]; total: number }) {
  const [n, setN] = useState(10);
  return (
    <div className="mt-3">
      <ul className="divide-y divide-white/60">
        {pages.slice(0, n).map((p, i) => (
          <li key={`${p.url}-${i}`} className="py-2">
            <a href={p.url} target="_blank" rel="noreferrer nofollow" className="break-all font-mono text-[12.5px] text-ds-ink hover:underline">{p.url}</a>
            {p.note && <span className="block text-[12.5px] text-ds-ink-2">{p.note}</span>}
            {p.items && p.items.length > 0 && <EvidenceList items={p.items} initial={3} />}
          </li>
        ))}
      </ul>
      {pages.length > n && (
        <button type="button" onClick={() => setN((x) => x + 50)} className="no-print mt-2 text-[12.5px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline" data-print-hide>
          Show more ({pages.length - n} left)
        </button>
      )}
      {total > pages.length && <p className="mt-1 text-[12px] text-ds-ink-3">{pages.length} of {total} listed.</p>}
    </div>
  );
}

type PageFilter = "all" | "issues" | "excluded";

function PageTable({ pages, onAuditPage }: { pages: SitePage[]; onAuditPage: (url: string) => void }) {
  const [filter, setFilter] = useState<PageFilter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [n, setN] = useState(50);
  const shown = pages.filter((p) => (filter === "all" || (filter === "issues" ? p.errors + p.warnings > 0 : !!p.excluded)) && (!q || p.url.toLowerCase().includes(q.toLowerCase()) || (p.title ?? "").toLowerCase().includes(q.toLowerCase())));
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-serif text-[34px] leading-none">
          Every <span className="italic">page</span>
        </h3>
        <div className="no-print flex flex-wrap items-center gap-2" data-print-hide>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by URL or title" aria-label="Filter pages" className="glass-inset h-9 rounded-[12px] px-3 text-[13px] outline-none" />
          <div className="glass inline-flex rounded-[14px] p-1 text-[13px]" role="group" aria-label="Filter pages">
            {(
              [
                ["all", `All ${pages.length}`],
                ["issues", `With issues ${pages.filter((p) => p.errors + p.warnings > 0).length}`],
                ["excluded", `Not indexable ${pages.filter((p) => p.excluded).length}`],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={`rounded-[10px] px-3 py-1.5 transition-colors ${filter === id ? "bg-white/85 text-ds-ink shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" : "text-ds-ink-2 hover:text-ds-ink"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="glass overflow-x-auto rounded-[20px]">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="text-[12px] text-ds-ink-3">
            <tr className="border-b border-white/60">
              <th className="px-5 py-3 font-normal">Page</th>
              <th className="px-3 py-3 font-normal">Status</th>
              <th className="px-3 py-3 font-normal">Score</th>
              <th className="px-3 py-3 font-normal">AI</th>
              <th className="px-3 py-3 font-normal">Issues</th>
              <th className="px-3 py-3 font-normal">Depth</th>
              <th className="px-3 py-3 font-normal">Words</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {shown.slice(0, n).map((p) => (
              <PageRow key={p.url} page={p} open={open === p.url} onToggle={() => setOpen(open === p.url ? null : p.url)} onAuditPage={onAuditPage} />
            ))}
          </tbody>
        </table>
      </div>
      {shown.length > n && (
        <button type="button" onClick={() => setN((x) => x + 100)} className="no-print mt-2 text-[13px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline" data-print-hide>
          Show more ({shown.length - n} left)
        </button>
      )}
    </section>
  );
}

function PageRow({ page: p, open, onToggle, onAuditPage }: { page: SitePage; open: boolean; onToggle: () => void; onAuditPage: (url: string) => void }) {
  return (
    <>
      <tr className="cursor-pointer align-top hover:bg-white/30" onClick={onToggle}>
        <td className="max-w-[360px] px-5 py-2.5">
          <span className="block truncate text-ds-ink">{p.title ?? "(no title)"}</span>
          <span className="block truncate font-mono text-[11.5px] text-ds-ink-3">{p.url}</span>
          {p.excluded && <span className="block text-[11.5px] text-ds-warning">{p.excluded}</span>}
        </td>
        <td className="px-3 py-2.5 tabular-nums">{p.status || "—"}</td>
        <td className="px-3 py-2.5 tabular-nums">{p.score ?? "—"}</td>
        <td className="px-3 py-2.5 tabular-nums">{p.aiScore ?? "—"}</td>
        <td className="px-3 py-2.5 tabular-nums">
          {p.errors > 0 && <span className="text-[#a32121]">{p.errors} err </span>}
          {p.warnings > 0 && <span className="text-ds-warning">{p.warnings} warn</span>}
          {!p.errors && !p.warnings && <span className="text-ds-ink-3">—</span>}
        </td>
        <td className="px-3 py-2.5 tabular-nums">{p.depth ?? "—"}</td>
        <td className="px-3 py-2.5 tabular-nums">{p.words || "—"}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="bg-white/25 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-ds-ink-2">
              <span>{p.inlinks} internal links in</span>
              <span>{p.inSitemap ? "In sitemap" : "Not in sitemap"}</span>
              <span>{p.ms} ms</span>
              {p.schemaTypes.length > 0 && <span>Schema: {p.schemaTypes.join(", ")}</span>}
              <button type="button" onClick={() => onAuditPage(p.url)} className="ml-auto inline-flex h-8 items-center rounded-[10px] bg-ds-ink px-3 text-[12.5px] font-medium text-white">
                Full single-page audit
              </button>
            </div>
            {p.issues.length ? (
              <ul className="mt-3 space-y-2.5">
                {p.issues.map((i) => (
                  <li key={i.id} className="flex gap-2.5">
                    <SeverityIcon severity={i.severity} />
                    <div className="min-w-0">
                      <p className="text-[14px] text-ds-ink">{i.title}</p>
                      <EvidenceList items={i.items} initial={3} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13.5px] text-ds-ink-2">{p.excluded ? "Not audited: the page isn't an indexable HTML page." : "No errors or warnings on this page."}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
