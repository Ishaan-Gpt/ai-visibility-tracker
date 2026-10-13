"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IconClose, IconSpinner } from "@/components/icons/Icons";
import { hostMatches } from "@/lib/rank-tracker/parse";
import { featureLabel, type RtKeyword, type RtProject, type RtSnapshot } from "@/lib/rank-tracker/types";
import { DeltaFrom, FeatureTag, Position } from "./bits";
import { pathOf, shortDay } from "./format";

/** Full history for one keyword: position chart, the latest top 10, and every check. */
export function KeywordDetail({ project, keywordId, onClose }: { project: RtProject; keywordId: string; onClose: () => void }) {
  const [data, setData] = useState<{ keyword: RtKeyword; snapshots: RtSnapshot[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/rank-tracker/keywords/${keywordId}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!alive) return;
        if (r.ok) setData(d);
        else setError(d.error ?? "Couldn't load this keyword.");
      })
      .catch(() => alive && setError("Network error."));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [keywordId, onClose]);

  const chart = useMemo(() => {
    if (!data) return [];
    return [...data.snapshots].reverse().map((s) => ({
      label: shortDay(s.date),
      position: s.position,
      // Indexed keys: recharts reads "ahrefs.com" as a nested path.
      ...Object.fromEntries(project.competitors.map((c, i) => [`c${i}`, s.competitors.find((x) => x.domain === c)?.position ?? null])),
    }));
  }, [data, project.competitors]);
  const latest = data?.snapshots[0];
  const target = { domain: project.domain, includeSubdomains: project.includeSubdomains };
  const colors = ["#5c7c68", "#8a7f73", "#6b84a3"];

  // Portalled to <body>: the studio's animated <main> has a transform, which would trap a fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(43,41,39,0.28)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyword history">
      <div className="glass-strong max-h-[92vh] w-full max-w-[920px] overflow-y-auto rounded-t-[26px] p-5 sm:rounded-[26px] sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="break-words font-serif text-[32px] leading-[1.05]">{data?.keyword.keyword ?? "…"}</h2>
            <p className="mt-1 text-[13px] text-ds-ink-2">
              {project.domain} · {project.locationName} · {project.device}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/60">
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p className="mt-6 text-[14px] text-ds-danger">{error}</p>
        ) : !data ? (
          <p className="mt-8 flex items-center gap-2 text-[14px] text-ds-ink-2">
            <IconSpinner className="h-4 w-4 animate-spin" /> Loading history…
          </p>
        ) : !data.snapshots.length ? (
          <p className="mt-6 text-[14px] text-ds-ink-2">{data.keyword.pendingTaskId ? "The first check is in progress. Results usually arrive within a few minutes." : "Not checked yet. It is checked at the next scheduled run, or run Check now."}</p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-[12.5px] text-ds-ink-2">Position</p>
                <p className="mt-1">
                  <Position value={latest?.position ?? null} scanned={latest?.scanned} noResults={latest?.noResults} />
                  {latest && data.snapshots[1] && (
                    <span className="ml-2">
                      <DeltaFrom before={data.snapshots[1].position} after={latest.position} />
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-ds-ink-2">Best</p>
                <p className="mt-1 font-serif text-[22px] leading-none">{data.keyword.best ?? "–"}</p>
              </div>
              <div>
                <p className="text-[12.5px] text-ds-ink-2">Absolute rank</p>
                <p className="mt-1 font-serif text-[22px] leading-none" title="Counting every element on the page (AI Overview, People also ask, …)">
                  {latest?.rankAbsolute ?? "–"}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-ds-ink-2">Ranking URL</p>
                {latest?.url ? (
                  <a href={latest.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block truncate text-[14px] underline-offset-4 hover:underline">
                    {latest.url}
                  </a>
                ) : (
                  <p className="mt-1 text-[14px] text-ds-ink-3">Not in the top {latest?.scanned || 100}</p>
                )}
              </div>
            </div>
            {latest && (latest.features.length > 0 || latest.ourFeatures.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {latest.ourFeatures.map((f) => (
                  <FeatureTag key={`m${f}`} mine>
                    You in {featureLabel(f)}
                  </FeatureTag>
                ))}
                {latest.features
                  .filter((f) => !latest.ourFeatures.includes(f))
                  .map((f) => (
                    <FeatureTag key={f}>{featureLabel(f)}</FeatureTag>
                  ))}
              </div>
            )}

            <div className="mt-6 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(43,41,39,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#736e6a" }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis reversed domain={[1, (max: number) => Math.max(10, max)]} allowDecimals={false} tick={{ fontSize: 11, fill: "#736e6a" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(250,248,242,0.95)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: 12, fontSize: 12 }}
                    formatter={(value, name) => [value === null || value === undefined ? "not found" : `#${value}`, name === "position" ? project.domain : (project.competitors[Number(String(name).slice(1))] ?? String(name))]}
                  />
                  <Line type="monotone" dataKey="position" stroke="#d5855a" strokeWidth={2.2} dot={{ r: 3, fill: "#faf8f2", stroke: "#d5855a" }} connectNulls={false} />
                  {project.competitors.map((c, i) => (
                    <Line key={c} type="monotone" dataKey={`c${i}`} name={`c${i}`} stroke={colors[i % colors.length]} strokeWidth={1.3} strokeDasharray="4 4" dot={false} connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ds-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden>
                  <line x1="0" y1="2" x2="16" y2="2" stroke="#d5855a" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                {project.domain}
              </span>
              {project.competitors.map((c, i) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden>
                    <line x1="0" y1="2" x2="16" y2="2" stroke={colors[i % colors.length]} strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                  {c}
                </span>
              ))}
              <span className="text-ds-ink-3">#1 at the top; gaps mean not found in the results scanned.</span>
            </p>

            {latest && latest.top.length > 0 && (
              <div className="mt-6">
                <h3 className="font-serif text-[22px] leading-none">
                  Top 10 on <span className="italic">{shortDay(latest.date)}</span>
                </h3>
                <ol className="mt-3 divide-y divide-white/60 rounded-[16px] bg-white/35">
                  {latest.top.map((r) => {
                    const mine = hostMatches(r.url || r.domain, target);
                    const comp = project.competitors.find((c) => hostMatches(r.url || r.domain, { domain: c, includeSubdomains: true }));
                    return (
                      <li key={`${r.rank}-${r.url}`} className={`flex items-center gap-3 px-3 py-2 text-[13.5px] ${mine ? "bg-ds-accent-soft/80" : ""}`}>
                        <span className="w-6 shrink-0 text-right tabular-nums text-ds-ink-2">{r.rank}</span>
                        <span className="min-w-0 flex-1">
                          <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="block truncate font-medium hover:underline">
                            {r.title || r.domain}
                          </a>
                          <span className="block truncate text-[12px] text-ds-ink-2">
                            {r.domain}
                            {pathOf(r.url) !== "/" ? pathOf(r.url) : ""}
                          </span>
                        </span>
                        {mine && <span className="shrink-0 text-[11.5px] font-medium text-ds-accent-ink">You</span>}
                        {comp && !mine && <span className="shrink-0 text-[11.5px] text-ds-ink-2">Competitor</span>}
                      </li>
                    );
                  })}
                </ol>
                {latest.checkUrl && (
                  <a href={latest.checkUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block text-[12.5px] text-ds-ink-2 underline-offset-4 hover:underline">
                    Open this search on Google (results there are personalised and may differ)
                  </a>
                )}
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-serif text-[22px] leading-none">
                Every <span className="italic">check</span>
              </h3>
              <div className="mt-3 max-w-full overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[13px]">
                  <thead className="text-[12px] text-ds-ink-2">
                    <tr>
                      <th className="py-1.5 pr-3 font-normal">Date</th>
                      <th className="py-1.5 pr-3 font-normal">Position</th>
                      <th className="py-1.5 pr-3 font-normal">Change</th>
                      <th className="py-1.5 pr-3 font-normal">URL</th>
                      {project.competitors.map((c) => (
                        <th key={c} className="py-1.5 pr-3 font-normal">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.snapshots.map((s, i) => (
                      <tr key={s.id} className="border-t border-white/50">
                        <td className="py-1.5 pr-3 text-ds-ink-2">{shortDay(s.date)}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{s.position ?? <span className="text-ds-ink-3">{s.noResults ? "no results" : `>${s.scanned && s.scanned < 100 ? s.scanned : 100}`}</span>}</td>
                        <td className="py-1.5 pr-3">{data.snapshots[i + 1] ? <DeltaFrom before={data.snapshots[i + 1].position} after={s.position} small /> : <span className="text-ds-ink-3">–</span>}</td>
                        <td className="max-w-[240px] truncate py-1.5 pr-3 text-ds-ink-2" title={s.url ?? ""}>
                          {s.url ? pathOf(s.url) : "–"}
                        </td>
                        {project.competitors.map((c) => (
                          <td key={c} className="py-1.5 pr-3 tabular-nums text-ds-ink-2">
                            {s.competitors.find((x) => x.domain === c)?.position ?? "–"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
