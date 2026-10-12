"use client";

import type { ReactNode } from "react";
import { SOURCES, type ClusterInfo, type GroupType, type Intent, type KeywordRow, type SuggestSource } from "@/lib/keywords/types";

/* Small presentational pieces for the keyword workspace. Glyphs are hand-made inline SVG (no icon libraries). */

export const INTENT_STYLE: Record<Intent, string> = {
  informational: "bg-white/40 text-ds-ink-2",
  commercial: "bg-ds-accent-soft text-ds-accent",
  transactional: "bg-ds-success/10 text-ds-success",
  navigational: "bg-ds-warning/10 text-ds-warning",
};

/** Per-source tint, kept soft so a row of badges never shouts. */
const SOURCE_TINT: Record<SuggestSource, string> = {
  google: "bg-[#e8eefc] text-[#3b5bb5]",
  bing: "bg-[#e3f3f1] text-[#2f7f74]",
  youtube: "bg-[#fbe6e3] text-[#b5463b]",
  duckduckgo: "bg-[#fcebe0] text-[#b4602f]",
  amazon: "bg-[#fbf0d9] text-[#9a6a12]",
  ebay: "bg-[#eee8fa] text-[#6a4bb0]",
};

export const sourceMeta = (id: SuggestSource) => SOURCES.find((s) => s.id === id)!;

export function SourceMark({ id, className = "" }: { id: SuggestSource; className?: string }) {
  const m = sourceMeta(id);
  return (
    <span
      title={m.name}
      className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-[6px] font-mono text-[10px] font-semibold leading-none ${SOURCE_TINT[id]} ${className}`}
    >
      {m.short}
    </span>
  );
}

export function SourceBadges({ sources }: { sources: SuggestSource[] }) {
  if (sources.length === 0) return <span className="text-ds-ink-3">—</span>;
  const ordered = SOURCES.filter((s) => sources.includes(s.id));
  return (
    <span className="inline-flex gap-0.5" aria-label={ordered.map((s) => s.name).join(", ")}>
      {ordered.map((s) => (
        <SourceMark key={s.id} id={s.id} />
      ))}
    </span>
  );
}

/** Relative autocomplete signal: a short bar plus the number, never presented as volume. */
export function SignalBar({ value, rank }: { value: number; rank: number | null }) {
  return (
    <span className="inline-flex items-center gap-2" title={`Relative autocomplete signal ${value}/100${rank ? ` · best position #${rank}` : ""}`}>
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-white/60">
        <span className="absolute inset-y-0 left-0 rounded-full bg-ds-accent" style={{ width: `${Math.max(4, value)}%` }} />
      </span>
      <span className="w-7 text-right font-mono text-[12px] tabular-nums text-ds-ink-2">{value}</span>
    </span>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-ds-ink-3">—</span>;
  const max = Math.max(...values, 1);
  const w = 56;
  const h = 18;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`Monthly searches: ${values.join(", ")}`} className="text-ds-accent">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Tiny "AI" mark for AI-estimated values. */
export function AiMark() {
  return (
    <span title="AI-estimated" className="ml-1 inline-flex items-center gap-0.5 align-middle text-[10px] font-medium text-ds-ink-3">
      <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden>
        <path d="M6 1.2c.3 2.3 1.4 3.6 3.9 4.6-2.5 1-3.6 2.3-3.9 5-.4-2.7-1.4-4-4-5 2.6-1 3.6-2.3 4-4.6Z" fill="currentColor" />
      </svg>
      AI
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors ${
        active ? "bg-ds-accent text-ds-ink" : "bg-white/40 text-ds-ink-2 hover:text-ds-ink"
      }`}
    >
      {children}
    </button>
  );
}

const GROUP_HEAD: Record<Exclude<GroupType, "other">, string> = {
  question: "Questions people ask",
  preposition: "With prepositions",
  comparison: "Comparisons",
};

/** AnswerThePublic-style board: one card per question word / preposition / comparison word. */
export function GroupBoard({
  type,
  rows,
  onCopy,
}: {
  type: Exclude<GroupType, "other">;
  rows: KeywordRow[];
  onCopy: (keywords: string[], label: string) => void;
}) {
  const byWord = new Map<string, KeywordRow[]>();
  for (const r of rows) if (r.group === type) byWord.set(r.groupWord ?? "other", [...(byWord.get(r.groupWord ?? "other") ?? []), r]);
  const groups = [...byWord.entries()].sort((a, b) => b[1].length - a[1].length);
  if (groups.length === 0) {
    return <p className="px-4 py-10 text-center text-[14px] text-ds-ink-2">No {GROUP_HEAD[type].toLowerCase()} match your filters.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map(([word, list]) => {
        const sorted = [...list].sort((a, b) => b.signal - a.signal);
        return (
          <div key={word} className="min-w-0 rounded-[18px] border border-white/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] font-medium text-ds-ink">
                {word === "?" ? "ends with ?" : word}
                <span className="ml-2 rounded-full bg-white/40 px-2 py-0.5 text-[12px] font-normal text-ds-ink-2">{list.length}</span>
              </h3>
              <button
                type="button"
                onClick={() => onCopy(sorted.map((r) => r.keyword), `“${word}”`)}
                className="rounded-full px-2 py-1 text-[12px] text-ds-ink-2 transition-colors hover:bg-white/50 hover:text-ds-ink"
              >
                Copy
              </button>
            </div>
            <ul className="mt-3 space-y-1.5 text-[14px] text-ds-ink-2">
              {sorted.slice(0, 10).map((r) => (
                <li key={r.keyword} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate" title={r.keyword}>
                    {r.keyword}
                  </span>
                  <span className="h-1 w-10 shrink-0 overflow-hidden rounded-full bg-white/60" title={`Signal ${r.signal}`}>
                    <span className="block h-full rounded-full bg-ds-accent/80" style={{ width: `${Math.max(6, r.signal)}%` }} />
                  </span>
                </li>
              ))}
              {sorted.length > 10 && <li className="text-ds-ink-3">+{sorted.length - 10} more in the table</li>}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ClusterGrid({
  rows,
  info,
  onOpen,
}: {
  rows: KeywordRow[];
  info: Map<string, ClusterInfo>;
  onOpen: (cluster: string) => void;
}) {
  const map = new Map<string, KeywordRow[]>();
  for (const r of rows) map.set(r.cluster, [...(map.get(r.cluster) ?? []), r]);
  const clusters = [...map.entries()].sort((a, b) => {
    const ka = info.get(a[0])?.kind === "longtail" ? 1 : 0;
    const kb = info.get(b[0])?.kind === "longtail" ? 1 : 0;
    return ka - kb || b[1].length - a[1].length;
  });
  if (clusters.length === 0) return <p className="px-4 py-10 text-center text-[14px] text-ds-ink-2">No keywords match your filters.</p>;
  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {clusters.slice(0, 60).map(([name, list]) => {
        const meta = info.get(name);
        const sorted = [...list].sort((a, b) => b.signal - a.signal);
        const questions = list.filter((r) => r.group === "question").length;
        return (
          <div key={name} className="flex min-w-0 flex-col rounded-[18px] border border-white/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-[16px] font-medium leading-6 text-ds-ink">
                {name}
                {meta?.nameBy === "ai" && <AiMark />}
              </h3>
              <span className="shrink-0 rounded-full bg-white/40 px-2 py-0.5 text-[12px] text-ds-ink-2">{list.length}</span>
            </div>
            {meta && meta.subterms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {meta.subterms.slice(0, 4).map((s) => (
                  <span key={s.term} className="rounded-full bg-white/40 px-2 py-0.5 text-[11px] text-ds-ink-2">
                    {s.term} · {s.count}
                  </span>
                ))}
              </div>
            )}
            <ul className="mt-3 flex-1 space-y-1 text-[14px] text-ds-ink-2">
              {sorted.slice(0, 6).map((r) => (
                <li key={r.keyword} className="truncate" title={r.keyword}>
                  {r.keyword}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between text-[12px] text-ds-ink-3">
              <span>{questions > 0 ? `${questions} question${questions === 1 ? "" : "s"}` : meta?.kind === "core" ? "Core phrasing of the seed" : ""}</span>
              <button type="button" onClick={() => onOpen(name)} className="rounded-full px-2 py-1 text-ds-ink-2 transition-colors hover:bg-white/50 hover:text-ds-ink">
                Open in table
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
