"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SeverityIcon } from "@/components/ds/extras";
import { IconChevron } from "@/components/icons/Icons";
import { EXCLUDE_LABEL, type CrawlIssue, type CrawlPage, type CrawlResult } from "@/lib/crawl/types";
import { isIndexable } from "@/lib/crawl/report";
import { compilePatterns } from "@/lib/crawl/url";

export type PageFilter = "all" | "indexable" | "included" | "excluded" | "broken" | "redirects" | "sitemap" | "orphans" | "missing";

const pathOf = (u: string) => {
  try {
    const x = new URL(u);
    return (x.pathname + x.search) || "/";
  } catch {
    return u;
  }
};

export function matchesFilter(p: CrawlPage, f: PageFilter, included: Set<string>, sitemapFound: boolean): boolean {
  switch (f) {
    case "all":
      return true;
    case "indexable":
      return isIndexable(p);
    case "included":
      return included.has(p.url);
    case "excluded":
      return !isIndexable(p);
    case "broken":
      return p.reason === "client-error" || p.reason === "server-error" || p.reason === "fetch-error";
    case "redirects":
      return p.reason === "redirect";
    case "sitemap":
      return p.inSitemap && ((p.status !== null && !isIndexable(p)) || p.reason === "blocked-robots" || !!p.blockedForGoogle);
    case "orphans":
      return p.inSitemap && p.depth === null && p.status !== null && isIndexable(p);
    case "missing":
      return sitemapFound && isIndexable(p) && !p.inSitemap;
  }
}

function stopLine(r: CrawlResult): string {
  const secs = Math.round(r.durationMs / 1000);
  const base = `${r.summary.crawled.toLocaleString()} URLs crawled on ${r.host} in ${secs}s.`;
  if (r.stoppedBy === "complete") return `${base} We reached every page linked from your site${r.sitemaps.found ? " and listed in your sitemap" : ""}.`;
  if (r.stoppedBy === "page-cap") return `${base} Stopped at your ${r.cap.toLocaleString()}-page limit; ${r.summary.notCrawled.toLocaleString()} more URLs were found but not crawled.`;
  if (r.stoppedBy === "time-budget") return `${base} Stopped at the time limit; ${r.summary.notCrawled.toLocaleString()} found URLs were not crawled yet.`;
  return `${base} The crawl was cancelled.`;
}

/** Headline, stat tiles (which double as table filters) and the Search-Console-style issue list. */
export function CrawlOverview({ result, onFilter, active, children }: { result: CrawlResult; onFilter: (f: PageFilter) => void; active: PageFilter; children?: React.ReactNode }) {
  const s = result.summary;
  const pathname = usePathname();
  const excludedCount = Object.values(s.excluded).reduce((a, b) => a + (b ?? 0), 0);
  const tiles: { f: PageFilter; label: string; value: number; tone: "good" | "warn" | "bad" | "plain"; hint: string }[] = [
    { f: "indexable", label: "Ready to list", value: s.indexable, tone: "good", hint: "200, indexable, self-canonical" },
    { f: "excluded", label: "Excluded", value: excludedCount, tone: "plain", hint: "noindex, redirects, errors, canonicalised" },
    { f: "broken", label: "Broken", value: s.broken, tone: s.broken ? "bad" : "plain", hint: "4xx, 5xx or unreachable" },
    { f: "redirects", label: "Redirects", value: s.redirects, tone: "plain", hint: "3xx and meta refresh" },
    result.sitemaps.found
      ? { f: "sitemap", label: "Sitemap problems", value: s.sitemapProblems, tone: s.sitemapProblems ? "bad" : "good", hint: "listed URLs Google will reject" }
      : { f: "missing", label: "Sitemap", value: 0, tone: "warn", hint: "none found on this site" },
    { f: "orphans", label: "Only in sitemap", value: s.orphans, tone: s.orphans ? "warn" : "plain", hint: "no internal link found" },
  ];
  const toneCls = { good: "text-[#4c6b57]", warn: "text-[#a56312]", bad: "text-[#b23a2a]", plain: "text-ds-ink" } as const;

  return (
    <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-5 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-32 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.45),transparent)] print:hidden" />
      <div className="relative">
        <h2 className="font-serif text-[40px] leading-[0.98] sm:text-[52px]">
          {s.indexable.toLocaleString()} {s.indexable === 1 ? "page is" : "pages are"} <span className="italic">ready.</span>
        </h2>
        <p className="mt-3 max-w-[760px] text-[15px] leading-6 text-ds-ink-2">
          {stopLine(result)}
          {result.stoppedBy === "page-cap" && result.cap <= 150 && (
            <>
              {" "}
              <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className="font-medium text-ds-accent-ink underline underline-offset-2">
                A free account crawls 500 pages.
              </Link>
            </>
          )}
        </p>
        {children && <div className="mt-5">{children}</div>}

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((t) => (
            <button
              key={t.f}
              type="button"
              onClick={() => onFilter(t.f)}
              className={`rounded-[16px] p-3.5 text-left transition ${active === t.f ? "bg-white/85 shadow-[0_0_0_2px_rgba(242,169,127,.6)]" : "glass-inset hover:bg-white/75"}`}
            >
              <span className="block text-[12.5px] text-ds-ink-2">{t.label}</span>
              <span className={`block font-serif text-[30px] leading-tight tabular-nums ${toneCls[t.tone]}`}>{t.f === "missing" ? "None" : t.value.toLocaleString()}</span>
              <span className="block text-[11.5px] leading-4 text-ds-ink-3">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function IssueList({ issues, title = "What needs fixing" }: { issues: CrawlIssue[]; title?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!issues.length) {
    return (
      <section data-print-card className="glass flex items-center gap-3 rounded-[22px] p-5">
        <SeverityIcon severity="pass" />
        <p className="text-[15px] text-ds-ink">No sitemap or indexing problems found in the pages we crawled.</p>
      </section>
    );
  }
  const [head, ...rest] = title.split(" ");
  return (
    <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
      <h3 className="font-serif text-[32px] leading-none">
        {head} <span className="italic">{rest.join(" ")}</span>
      </h3>
      <ul className="mt-4 divide-y divide-white/60">
        {issues.map((it) => {
          const isOpen = open === it.id;
          return (
            <li key={it.id} className="py-3">
              <button type="button" onClick={() => setOpen(isOpen ? null : it.id)} className="flex w-full items-start gap-3 text-left" aria-expanded={isOpen}>
                <SeverityIcon severity={it.severity} />
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="text-[15px] font-medium text-ds-ink">{it.title}</span>
                  {it.count > 1 || it.examples.length ? <span className="ml-2 rounded-md bg-white/70 px-1.5 py-0.5 text-[12px] tabular-nums text-ds-ink-2">{it.count.toLocaleString()}</span> : null}
                  <span className="mt-0.5 block text-[13.5px] leading-5 text-ds-ink-2">{it.detail}</span>
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
                      {it.examples.map((ex) => (
                        <li key={ex} className="break-all font-mono text-[12px] leading-5 text-ds-ink-2">
                          {ex}
                        </li>
                      ))}
                      {it.count > it.examples.length && <li className="text-[12px] text-ds-ink-3">and {(it.count - it.examples.length).toLocaleString()} more (filter the table below)</li>}
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

function StatusPill({ p }: { p: CrawlPage }) {
  const st = p.status;
  const cls =
    st === null
      ? "bg-white/60 text-ds-ink-3"
      : st === 0 || st >= 400
        ? "bg-[#f6d5cc]/80 text-[#b23a2a]"
        : st >= 300
          ? "bg-[#f7e2c4]/80 text-[#a56312]"
          : isIndexable(p)
            ? "bg-[#dbe6dc]/80 text-[#4c6b57]"
            : "bg-[#f7e2c4]/80 text-[#a56312]";
  return <span className={`inline-flex min-w-[42px] justify-center rounded-[8px] px-1.5 py-0.5 font-mono text-[11.5px] ${cls}`}>{st === null ? "skip" : st === 0 ? "err" : st}</span>;
}

function noteFor(p: CrawlPage): string {
  if (p.reason === "redirect") return `${p.detail === "Meta refresh" ? "Meta refresh" : "Redirects"} → ${p.redirectTo ? pathOf(p.redirectTo) : "?"}`;
  if (p.reason === "canonicalised") return `Canonical → ${p.canonical ?? ""}`;
  if (p.reason === "noindex") return `noindex (${p.detail ?? "meta"})`;
  if (p.reason) return p.detail ? `${EXCLUDE_LABEL[p.reason]}: ${p.detail}` : EXCLUDE_LABEL[p.reason];
  if (p.blockedForGoogle) return "Blocked for Googlebot in robots.txt";
  if (p.soft404) return "Looks like an error page (soft 404)";
  return "";
}

const FILTERS: { f: PageFilter; label: string }[] = [
  { f: "all", label: "All" },
  { f: "included", label: "In your sitemap" },
  { f: "indexable", label: "Indexable" },
  { f: "excluded", label: "Excluded" },
  { f: "broken", label: "Broken" },
  { f: "redirects", label: "Redirects" },
  { f: "sitemap", label: "Sitemap problems" },
  { f: "orphans", label: "Only in sitemap" },
  { f: "missing", label: "Missing from sitemap" },
];

const PAGE = 200;

/** Every crawled URL with include checkboxes, filters, search and pattern-based bulk exclude. */
export function CrawlPagesTable({
  result,
  included,
  onChange,
  filter,
  onFilter,
  selectable = true,
}: {
  result: CrawlResult;
  included: Set<string>;
  onChange: (next: Set<string>) => void;
  filter: PageFilter;
  onFilter: (f: PageFilter) => void;
  selectable?: boolean;
}) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [pattern, setPattern] = useState("");
  const counts = useMemo(() => {
    const m = {} as Record<PageFilter, number>;
    for (const { f } of FILTERS) m[f] = result.pages.filter((p) => matchesFilter(p, f, included, result.sitemaps.found)).length;
    return m;
  }, [result, included]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return result.pages
      .filter((p) => matchesFilter(p, filter, included, result.sitemaps.found))
      .filter((p) => !needle || p.url.toLowerCase().includes(needle) || (p.title ?? "").toLowerCase().includes(needle))
      .sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || a.url.localeCompare(b.url));
  }, [result, filter, q, included]);

  const selectableRow = (p: CrawlPage) => p.status !== null && p.status >= 200 && p.status < 300;
  const visibleSelectable = rows.filter(selectableRow);
  const allVisibleOn = visibleSelectable.length > 0 && visibleSelectable.every((p) => included.has(p.url));

  function toggle(url: string) {
    const next = new Set(included);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    onChange(next);
  }
  function setVisible(on: boolean) {
    const next = new Set(included);
    for (const p of visibleSelectable) {
      if (on) next.add(p.url);
      else next.delete(p.url);
    }
    onChange(next);
  }
  function excludePattern() {
    const m = compilePatterns(pattern.split(/[\n,]+/));
    if (!m) return;
    const next = new Set([...included].filter((u) => !m(u)));
    onChange(next);
    setPattern("");
  }

  return (
    <section data-print-card className="glass rounded-[24px]">
      <div className="space-y-3 border-b border-white/60 p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.filter(({ f }) => f === "all" || f === filter || counts[f] > 0).map(({ f, label }) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                onFilter(f);
                setLimit(PAGE);
              }}
              className={`rounded-[10px] px-2.5 py-1 text-[13px] transition ${filter === f ? "bg-ds-btn text-[var(--ds-btn-text)]" : "glass-inset text-ds-ink-2 hover:bg-white/80 hover:text-ds-ink"}`}
            >
              {label} <span className="tabular-nums opacity-60">{counts[f].toLocaleString()}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search URLs or titles"
            className="h-10 min-w-0 flex-1 rounded-[12px] border border-white/70 bg-white/55 px-3 text-[14px] text-ds-ink outline-none placeholder:text-ds-ink-3"
          />
          {selectable && (
            <div className="flex min-w-0 gap-2 sm:w-[340px]">
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && excludePattern()}
                placeholder="Leave out a pattern, e.g. /tag/*"
                className="h-10 min-w-0 flex-1 rounded-[12px] border border-white/70 bg-white/55 px-3 font-mono text-[12.5px] text-ds-ink outline-none placeholder:font-sans placeholder:text-ds-ink-3"
              />
              <button type="button" onClick={excludePattern} disabled={!pattern.trim()} className="glass-inset h-10 shrink-0 rounded-[12px] px-3 text-[13.5px] text-ds-ink transition hover:bg-white/80 disabled:opacity-40">
                Leave out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[760px] text-left text-[13.5px]">
          <thead className="sticky top-0 z-10 bg-[#f6f2ea]/95 backdrop-blur">
            <tr className="border-b border-white/60 text-[12px] text-ds-ink-3">
              {selectable && (
                <th className="w-10 py-2 pl-5">
                  <input type="checkbox" aria-label="Select all visible" checked={allVisibleOn} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[#f2a97f]" />
                </th>
              )}
              <th className={`py-2 font-normal ${selectable ? "" : "pl-5"}`}>Page</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 text-right font-normal">Depth</th>
              <th className="py-2 text-right font-normal">Inlinks</th>
              <th className="py-2 pl-4 font-normal">Last modified</th>
              <th className="py-2 pr-5 font-normal">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50">
            {rows.slice(0, limit).map((p) => {
              const note = noteFor(p);
              return (
                <tr key={p.url} className={included.has(p.url) ? "" : "opacity-[0.72]"}>
                  {selectable && (
                    <td className="py-2 pl-5 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Include ${p.url}`}
                        checked={included.has(p.url)}
                        disabled={!selectableRow(p)}
                        onChange={() => toggle(p.url)}
                        className="mt-1 h-4 w-4 accent-[#f2a97f] disabled:opacity-30"
                      />
                    </td>
                  )}
                  <td className={`max-w-[380px] py-2 align-top ${selectable ? "" : "pl-5"}`}>
                    <a href={p.url} target="_blank" rel="noreferrer" className="block truncate font-mono text-[12.5px] text-ds-ink hover:underline" title={p.url}>
                      {pathOf(p.url)}
                    </a>
                    {p.title && <span className="block truncate text-[12.5px] text-ds-ink-3">{p.title}</span>}
                  </td>
                  <td className="py-2 align-top">
                    <StatusPill p={p} />
                    {p.inSitemap && <span className="ml-1.5 text-[11px] text-ds-ink-3" title="Listed in your current sitemap">in sitemap</span>}
                  </td>
                  <td className="py-2 text-right align-top tabular-nums text-ds-ink-2">{p.depth ?? "–"}</td>
                  <td className="py-2 text-right align-top tabular-nums text-ds-ink-2">{p.status !== null ? p.inlinks : "–"}</td>
                  <td className="py-2 pl-4 align-top tabular-nums text-ds-ink-2">
                    {p.lastmod ?? "–"}
                    {p.lastmodSource && <span className="block text-[11px] text-ds-ink-3">{p.lastmodSource === "sitemap" ? "from sitemap" : p.lastmodSource === "page" ? "from page" : "Last-Modified"}</span>}
                  </td>
                  <td className="max-w-[260px] py-2 pr-5 align-top text-[12.5px] leading-5 text-ds-ink-2">
                    <span className="line-clamp-2 break-all">{note}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-5 py-8 text-center text-[14px] text-ds-ink-3">Nothing here.</p>}
      </div>
      {rows.length > limit && (
        <div className="border-t border-white/60 p-3 text-center">
          <button type="button" onClick={() => setLimit((l) => l + PAGE * 2)} className="glass-inset rounded-[11px] px-4 py-1.5 text-[13.5px] text-ds-ink transition hover:bg-white/80">
            Show more ({(rows.length - limit).toLocaleString()} left)
          </button>
        </div>
      )}
    </section>
  );
}
