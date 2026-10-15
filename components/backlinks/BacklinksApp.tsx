"use client";

import { useMemo, useState } from "react";
import { IconCaret, IconDownload, IconInfo, IconSpinner } from "@/components/icons/Icons";
import { Glass } from "@/components/studio/Glass";
import { Chip, darkButton, field, smallField, softButton } from "@/components/rank-tracker/bits";
import { fmtCompact, fmtInt, timeAgo } from "@/components/rank-tracker/format";
import { download, workbook, type Cell, type Sheet } from "@/components/tools/page-audit/exportXlsx";
import type { BacklinksResult, BlAnchor, BlDomain, BlHistoryPoint, BlLink } from "@/lib/backlinks/types";

type Tab = "domains" | "links" | "anchors" | "lost";
const SPAM = 40;
const PAGE = 50;

const hostPath = (u: string) => {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, "")}${x.pathname === "/" ? "" : x.pathname}`;
  } catch {
    return u;
  }
};

function RankPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ds-ink-3">–</span>;
  const tone = value >= 60 ? "bg-[#e6ede8] text-[#46604f]" : value >= 30 ? "bg-ds-accent-soft text-ds-accent-ink" : "bg-white/60 text-ds-ink-2";
  return <span className={`inline-flex min-w-[34px] justify-center rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums ${tone}`}>{value}</span>;
}

function SpamMark({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ds-ink-3">–</span>;
  return <span className={`tabular-nums ${value >= SPAM ? "font-medium text-ds-danger" : "text-ds-ink-2"}`}>{value}</span>;
}

/** Referring domains over the last 12 months, with new (above) and lost (below) bars per month. */
function Trend({ points }: { points: BlHistoryPoint[] }) {
  const pts = points.filter((p) => p.referringDomains !== null);
  if (pts.length < 2) return null;
  const W = 640;
  const H = 150;
  const pad = 8;
  const vals = pts.map((p) => p.referringDomains ?? 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const x = (i: number) => pad + (i * (W - pad * 2)) / (pts.length - 1);
  const y = (v: number) => H - 40 - ((v - min) / span) * (H - 60);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.referringDomains ?? 0).toFixed(1)}`).join(" ");
  const flow = Math.max(1, ...pts.map((p) => Math.max(p.newDomains ?? 0, p.lostDomains ?? 0)));
  const bar = (v: number | null) => ((v ?? 0) / flow) * 14;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" role="img" aria-label="Referring domains over the last 12 months">
      <path d={`${line} L${x(pts.length - 1)},${H - 40} L${x(0)},${H - 40} Z`} fill="#f2a97f" opacity={0.18} />
      <path d={line} fill="none" stroke="#2b2927" strokeWidth={1.6} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={p.month}>
          <rect x={x(i) - 3} y={H - 26 - bar(p.newDomains)} width={6} height={bar(p.newDomains)} rx={1.5} fill="#5f8a6d" opacity={0.75}>
            <title>{`${p.month.slice(0, 7)}: +${p.newDomains ?? 0} new, -${p.lostDomains ?? 0} lost, ${fmtInt(p.referringDomains)} total`}</title>
          </rect>
          <rect x={x(i) - 3} y={H - 25} width={6} height={bar(p.lostDomains)} rx={1.5} fill="#c4664f" opacity={0.6} />
          {(i === 0 || i === pts.length - 1 || i % 3 === 0) && (
            <text x={x(i)} y={H - 1} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} className="fill-[#8a847d] text-[10px]">
              {new Date(`${p.month}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const csvCell = (v: Cell) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function sheets(d: BacklinksResult): Sheet[] {
  const dom = (list: BlDomain[]): Cell[][] => [["Referring domain", "Authority", "Backlinks", "Dofollow", "Spam score", "First seen"], ...list.map((x) => [x.domain, x.rank, x.backlinks, x.dofollow, x.spamScore, x.firstSeen])];
  const links: Cell[][] = [["Linking page", "Linking domain", "Target page", "Anchor", "Follow", "Type", "Domain authority", "Page authority", "Spam score", "First seen", "Last seen", "New", "Broken"], ...d.links.map((l) => [l.from, l.fromDomain, l.to, l.anchor, l.dofollow ? "dofollow" : "nofollow", l.type, l.domainRank, l.pageRank, l.spamScore, l.firstSeen, l.lastSeen, l.isNew ? "yes" : "", l.isBroken ? "yes" : ""])];
  const anchors: Cell[][] = [["Anchor", "Referring domains", "Backlinks", "Dofollow", "First seen"], ...d.anchors.map((a) => [a.anchor || "(empty)", a.referringDomains, a.backlinks, a.dofollow, a.firstSeen])];
  const hist: Cell[][] = [["Month", "Referring domains", "Backlinks", "New domains", "Lost domains"], ...d.history.map((h) => [h.month.slice(0, 7), h.referringDomains, h.backlinks, h.newDomains, h.lostDomains])];
  return [
    { name: "Referring domains", rows: dom(d.domains), widths: [36, 12, 12, 12, 12, 14] },
    { name: "Backlinks", rows: links, widths: [60, 28, 50, 36, 10, 10, 12, 12, 12, 12, 12, 8, 8] },
    { name: "Anchors", rows: anchors, widths: [48, 16, 12, 12, 14] },
    { name: "Lost domains", rows: dom(d.lostDomains), widths: [36, 12, 12, 12, 12, 14] },
    { name: "Trend", rows: hist, widths: [12, 18, 14, 14, 14] },
  ];
}

export function BacklinksApp({ defaultTarget, lookupsLeft, lookupsLimit, rowLimit }: { defaultTarget: string; lookupsLeft: number; lookupsLimit: number; rowLimit: number }) {
  const [target, setTarget] = useState(defaultTarget);
  const [subdomains, setSubdomains] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BacklinksResult | null>(null);
  const [left, setLeft] = useState(lookupsLeft);
  const [tab, setTab] = useState<Tab>("domains");
  const [hideSpam, setHideSpam] = useState(true);
  const [followOnly, setFollowOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "rank", dir: -1 });

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backlinks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, includeSubdomains: subdomains }) });
      const d = (await res.json().catch(() => ({}))) as BacklinksResult & { error?: string; quota?: { remaining: number } };
      if (d.quota) setLeft(d.quota.remaining);
      if (!res.ok) {
        setError(d.error ?? "The lookup failed.");
        return;
      }
      setData(d);
      setPage(0);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const spamCount = useMemo(() => {
    if (!data) return 0;
    if (tab === "links") return data.links.filter((l) => (l.spamScore ?? 0) >= SPAM).length;
    if (tab === "domains") return data.domains.filter((x) => (x.spamScore ?? 0) >= SPAM).length;
    if (tab === "lost") return data.lostDomains.filter((x) => (x.spamScore ?? 0) >= SPAM).length;
    return 0;
  }, [data, tab]);

  const list = useMemo((): (BlDomain | BlLink | BlAnchor)[] => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const spamOk = (s: number | null) => !hideSpam || (s ?? 0) < SPAM;
    let rows: (BlDomain | BlLink | BlAnchor)[];
    if (tab === "links") rows = data.links.filter((l) => spamOk(l.spamScore) && (!followOnly || l.dofollow) && (!q || l.from.toLowerCase().includes(q) || l.anchor.toLowerCase().includes(q) || l.to.toLowerCase().includes(q)));
    else if (tab === "anchors") rows = data.anchors.filter((a) => !q || a.anchor.toLowerCase().includes(q));
    else rows = (tab === "lost" ? data.lostDomains : data.domains).filter((x) => spamOk(x.spamScore) && (!followOnly || (x.dofollow ?? 0) > 0) && (!q || x.domain.includes(q)));
    const val = (r: BlDomain | BlLink | BlAnchor): number | string => {
      const o = r as unknown as Record<string, unknown>;
      const v = o[sort.key === "rank" ? ("domainRank" in r ? "domainRank" : "rank") : sort.key];
      return typeof v === "number" ? v : typeof v === "string" ? v : -1;
    };
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [data, tab, query, hideSpam, followOnly, sort]);

  const pageRows = list.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const s = data?.summary;
  const dofollowShare = s?.backlinks && s.dofollow !== null ? Math.round((s.dofollow / s.backlinks) * 100) : null;

  const head = (key: string, label: string, className = "") => (
    <th className={`px-3 py-2.5 font-normal ${className}`}>
      <button type="button" onClick={() => setSort((p) => ({ key, dir: p.key === key ? ((p.dir * -1) as 1 | -1) : key === "domain" || key === "anchor" || key === "from" ? 1 : -1 }))} className="inline-flex items-center gap-1 hover:text-ds-ink">
        {label}
        {sort.key === key && <IconCaret className={`h-3 w-3 ${sort.dir === -1 ? "rotate-180" : ""}`} />}
      </button>
    </th>
  );

  function switchTab(t: Tab) {
    setTab(t);
    setPage(0);
    setSort({ key: t === "anchors" ? "referringDomains" : "rank", dir: -1 });
  }

  function exportCsv() {
    if (!data) return;
    const sh = sheets(data)[{ domains: 0, links: 1, anchors: 2, lost: 3 }[tab]];
    download(new Blob([`﻿${sh.rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" }), `seowise-backlinks-${sh.name.toLowerCase().replace(/\s+/g, "-")}-${hostPath(data.target).replace(/[^a-z0-9.-]+/gi, "_")}.csv`);
  }

  return (
    <div className="space-y-5">
      <Glass className="p-5 sm:p-6">
        <form onSubmit={run} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ds-ink-2">A domain, or one page&apos;s full URL</span>
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="competitor.com or https://site.com/guide" className={field} required autoComplete="off" spellCheck={false} inputMode="url" />
          </label>
          <label className="flex h-10 items-center gap-2 text-[13.5px] text-ds-ink-2">
            <input type="checkbox" checked={subdomains} onChange={(e) => setSubdomains(e.target.checked)} className="h-4 w-4 accent-[#2b2927]" />
            Include subdomains
          </label>
          <button type="submit" disabled={loading || !target.trim()} className={darkButton}>
            {loading && <IconSpinner className="h-4 w-4 animate-spin" />}
            {loading ? "Reading the link graph…" : "Find backlinks"}
          </button>
        </form>
        <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-5 text-ds-ink-2">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            From the DataForSEO backlink index (updated continuously). Up to {fmtInt(rowLimit)} referring domains, links and anchors per lookup. {left} of {lookupsLimit} lookups left today; repeating a lookup within 3 days is free.
          </span>
        </p>
        {error && <p className="mt-3 text-[13.5px] text-ds-danger">{error}</p>}
      </Glass>

      {data && s && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              ["Authority", s.rank === null ? "–" : String(s.rank), "0–100, from the link graph"],
              ["Referring domains", fmtCompact(s.referringDomains), `${fmtCompact(s.referringIps)} IPs`],
              ["Backlinks", fmtCompact(s.backlinks), dofollowShare === null ? "" : `${dofollowShare}% dofollow`],
              ["New domains", s.newDomains === null ? "–" : `+${fmtInt(s.newDomains)}`, "last month"],
              ["Lost domains", s.lostDomains === null ? "–" : `−${fmtInt(s.lostDomains)}`, "last month"],
              ["Spam score", s.spamScore === null ? "–" : String(s.spamScore), s.spamScore !== null && s.spamScore >= SPAM ? "worth a disavow review" : "lower is better"],
            ].map(([l, v, sub]) => (
              <div key={l} className="glass-inset rounded-[16px] px-4 py-3">
                <p className="font-serif text-[28px] leading-none tabular-nums">{v}</p>
                <p className="mt-1 text-[12.5px] text-ds-ink-2">{l}</p>
                {sub && <p className="text-[11.5px] text-ds-ink-3">{sub}</p>}
              </div>
            ))}
          </div>

          {data.history.length > 1 && (
            <Glass className="p-5 sm:p-6">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-[24px] leading-none">
                  Referring domains, <span className="italic">12 months</span>
                </h3>
                <p className="text-[12px] text-ds-ink-3">
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#5f8a6d]" />
                  gained <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-sm bg-[#c4664f]" />
                  lost
                </p>
              </div>
              <Trend points={data.history} />
            </Glass>
          )}

          <Glass className="min-w-0 p-0">
            <div className="flex flex-col gap-3 border-b border-white/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="min-w-0 font-serif text-[24px] leading-none">
                  <span className="break-all">{hostPath(data.target)}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={exportCsv} className={softButton}>
                    <IconDownload className="h-4 w-4" /> CSV
                  </button>
                  <button type="button" onClick={() => download(workbook(sheets(data)), `seowise-backlinks-${hostPath(data.target).replace(/[^a-z0-9.-]+/gi, "_")}.xlsx`)} className={softButton}>
                    <IconDownload className="h-4 w-4" /> Excel (all tabs)
                  </button>
                </div>
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    ["domains", `Referring domains ${data.domains.length}`],
                    ["links", `Backlinks ${data.links.length}`],
                    ["anchors", `Anchors ${data.anchors.length}`],
                    ["lost", `Lost domains ${data.lostDomains.length}`],
                  ] as const
                ).map(([t, l]) => (
                  <Chip key={t} active={tab === t} onClick={() => switchTab(t)}>
                    {l}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder={tab === "anchors" ? "Filter anchors…" : tab === "links" ? "Filter pages or anchors…" : "Filter domains…"}
                  aria-label="Filter"
                  className={`${smallField} min-w-0 flex-1 sm:max-w-[260px]`}
                />
                {tab !== "anchors" && (
                  <>
                    <label className="flex items-center gap-2 text-[13px] text-ds-ink-2">
                      <input type="checkbox" checked={hideSpam} onChange={(e) => setHideSpam(e.target.checked)} className="h-4 w-4 accent-[#2b2927]" />
                      Hide spammy (score {SPAM}+){spamCount ? `, ${spamCount}` : ""}
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-ds-ink-2">
                      <input type="checkbox" checked={followOnly} onChange={(e) => setFollowOnly(e.target.checked)} className="h-4 w-4 accent-[#2b2927]" />
                      Dofollow only
                    </label>
                  </>
                )}
              </div>
              <p className="text-[12px] text-ds-ink-3">
                {data.cachedAt ? `Saved lookup from ${timeAgo(data.cachedAt)}.` : "Fresh lookup."}
                {tab === "links" ? " One link per referring domain, strongest first." : ""}
                {data.partial.length ? ` Couldn't load ${data.partial.join(", ")} this time; look up again to retry.` : ""}
              </p>
            </div>

            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[13.5px]">
                <thead className="text-[12px] text-ds-ink-2">
                  <tr className="border-b border-white/60">
                    {tab === "links" ? (
                      <>
                        {head("from", "Linking page")}
                        {head("anchor", "Anchor")}
                        {head("rank", "Authority")}
                        {head("spamScore", "Spam")}
                        {head("firstSeen", "First seen")}
                      </>
                    ) : tab === "anchors" ? (
                      <>
                        {head("anchor", "Anchor")}
                        {head("referringDomains", "Referring domains")}
                        {head("backlinks", "Backlinks")}
                        {head("dofollow", "Dofollow")}
                        {head("firstSeen", "First seen")}
                      </>
                    ) : (
                      <>
                        {head("domain", "Domain")}
                        {head("rank", "Authority")}
                        {head("backlinks", "Backlinks")}
                        {head("dofollow", "Dofollow")}
                        {head("spamScore", "Spam")}
                        {head("firstSeen", "First seen")}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => {
                    if (tab === "links") {
                      const l = r as BlLink;
                      return (
                        <tr key={`${l.from}-${i}`} className="border-b border-white/40 align-top last:border-0">
                          <td className="max-w-[360px] px-3 py-2.5">
                            <a href={l.from} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-ds-ink underline-offset-4 hover:underline">
                              {hostPath(l.from)}
                            </a>
                            <span className="block truncate text-[12px] text-ds-ink-3">→ {hostPath(l.to)}</span>
                          </td>
                          <td className="max-w-[240px] px-3 py-2.5">
                            <span className="block truncate">{l.anchor || <span className="text-ds-ink-3">(no text)</span>}</span>
                            <span className="text-[11.5px] text-ds-ink-3">
                              {l.dofollow ? "dofollow" : "nofollow"}
                              {l.type && l.type !== "anchor" ? ` · ${l.type}` : ""}
                              {l.isNew ? " · new" : ""}
                              {l.isBroken ? " · broken" : ""}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <RankPill value={l.domainRank} />
                          </td>
                          <td className="px-3 py-2.5">
                            <SpamMark value={l.spamScore} />
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-ds-ink-2">{l.firstSeen ?? "–"}</td>
                        </tr>
                      );
                    }
                    if (tab === "anchors") {
                      const a = r as BlAnchor;
                      return (
                        <tr key={`${a.anchor}-${i}`} className="border-b border-white/40 last:border-0">
                          <td className="max-w-[420px] truncate px-3 py-2.5">{a.anchor || <span className="text-ds-ink-3">(no text / image)</span>}</td>
                          <td className="px-3 py-2.5 tabular-nums">{fmtInt(a.referringDomains)}</td>
                          <td className="px-3 py-2.5 tabular-nums">{fmtInt(a.backlinks)}</td>
                          <td className="px-3 py-2.5 tabular-nums">{fmtInt(a.dofollow)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-ds-ink-2">{a.firstSeen ?? "–"}</td>
                        </tr>
                      );
                    }
                    const d = r as BlDomain;
                    return (
                      <tr key={`${d.domain}-${i}`} className="border-b border-white/40 last:border-0">
                        <td className="px-3 py-2.5">
                          <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline-offset-4 hover:underline">
                            {d.domain}
                          </a>
                        </td>
                        <td className="px-3 py-2.5">
                          <RankPill value={d.rank} />
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{fmtInt(d.backlinks)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{fmtInt(d.dofollow)}</td>
                        <td className="px-3 py-2.5">
                          <SpamMark value={d.spamScore} />
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-ds-ink-2">{d.firstSeen ?? "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!pageRows.length && <p className="px-5 py-10 text-center text-[14px] text-ds-ink-2">{tab === "lost" ? "No referring domains lost recently." : "Nothing matches these filters."}</p>}
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-white/60 px-4 py-3 text-[13px] text-ds-ink-2">
                <span>
                  {page * PAGE + 1}–{Math.min(list.length, page * PAGE + PAGE)} of {list.length}
                </span>
                <div className="flex gap-2">
                  <button type="button" className={softButton} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </button>
                  <button type="button" className={softButton} disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </Glass>
        </>
      )}
    </div>
  );
}
