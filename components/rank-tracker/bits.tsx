"use client";

import type { ReactNode } from "react";
import type { RtPoint } from "@/lib/rank-tracker/types";

export const field =
  "glass-inset h-10 w-full rounded-[11px] px-3 text-[14px] text-ds-ink outline-none transition-[box-shadow,background-color] placeholder:text-ds-ink-3 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(242,169,127,0.35)]";
export const smallField =
  "glass-inset h-9 rounded-[11px] px-3 text-[14px] text-ds-ink outline-none transition-[box-shadow,background-color] placeholder:text-ds-ink-3 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(242,169,127,0.35)]";
export const darkButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-ds-ink px-4 text-[14px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";
export const softButton =
  "glass-inset inline-flex h-9 items-center justify-center gap-2 rounded-[11px] px-3 text-[13.5px] text-ds-ink transition-colors hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-40";

/** Position change. Positive = moved up (better). Entering / leaving the scanned top is shown in words. */
export function Delta({ value, entered, lost, small }: { value: number | null | undefined; entered?: boolean; lost?: boolean; small?: boolean }) {
  const size = small ? "text-[11.5px]" : "text-[12.5px]";
  if (entered) return <span className={`${size} font-medium text-ds-success`}>new</span>;
  if (lost) return <span className={`${size} font-medium text-ds-danger`}>lost</span>;
  if (value === null || value === undefined) return <span className={`${size} text-ds-ink-3`}>–</span>;
  if (value === 0) return <span className={`${size} text-ds-ink-3`}>0</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 ${size} font-medium tabular-nums ${up ? "text-ds-success" : "text-ds-danger"}`}>
      <svg viewBox="0 0 10 10" className={`h-2 w-2 ${up ? "" : "rotate-180"}`} aria-hidden>
        <path d="M5 1.5 8.6 7.6H1.4z" fill="currentColor" />
      </svg>
      {Math.abs(value)}
    </span>
  );
}

/** Tells a delta computed from two checks apart from entering/leaving the top 100. */
export function DeltaFrom({ before, after, small }: { before: number | null | undefined; after: number | null | undefined; small?: boolean }) {
  if (before === undefined || after === undefined) return <Delta value={null} small={small} />;
  if (before === null && after !== null) return <Delta value={null} entered small={small} />;
  if (before !== null && after === null) return <Delta value={null} lost small={small} />;
  if (before === null || after === null) return <Delta value={null} small={small} />;
  return <Delta value={before - after} small={small} />;
}

/** Position history sparkline: lower is better, so #1 sits at the top. Gaps where not in top 100 drop to the floor. */
export function PositionSpark({ history, width = 84, height = 24 }: { history: RtPoint[]; width?: number; height?: number }) {
  const pts = history.slice(-30);
  if (pts.length < 2) return <span className="text-[12px] text-ds-ink-3">–</span>;
  const ranked = pts.map((p) => p.p).filter((p): p is number => p !== null);
  const worst = Math.max(10, ...ranked.map((p) => p + 2));
  const best = Math.max(1, Math.min(...(ranked.length ? ranked : [1])) - 1);
  const y = (p: number | null) => (p === null ? height - 1.5 : 2 + ((p - best) / Math.max(1, worst - best)) * (height - 5));
  const x = (i: number) => (i / (pts.length - 1)) * (width - 4) + 2;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.p).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const first = pts[0];
  const better = last.p !== null && (first.p === null || last.p < first.p);
  const worse = last.p === null ? first.p !== null : first.p !== null && last.p > first.p;
  const stroke = better ? "#5c7c68" : worse ? "#c2553a" : "#8a7f73";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={`Positions: ${pts.map((p) => p.p ?? ">100").join(", ")}`}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(pts.length - 1)} cy={y(last.p)} r="2.2" fill={stroke} />
    </svg>
  );
}

/** Big position number with a "not in top N" state that never pretends to be a number. */
export function Position({ value, scanned, noResults, pending }: { value: number | null | undefined; scanned?: number; noResults?: boolean; pending?: boolean }) {
  if (value === undefined) return <span className="text-[12.5px] italic text-ds-ink-3">{pending ? "checking…" : "pending"}</span>;
  if (value === null)
    return (
      <span className="text-[12.5px] text-ds-ink-3" title={noResults ? "Google returned no results for this search" : `Not found in the first ${scanned || 100} organic results`}>
        {noResults ? "no results" : `>${scanned && scanned < 100 ? scanned : 100}`}
      </span>
    );
  return <span className={`font-serif text-[22px] leading-none tabular-nums ${value <= 3 ? "text-ds-accent-ink" : "text-ds-ink"}`}>{value}</span>;
}

export function Chip({ children, active, onClick, title }: { children: ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors ${active ? "bg-ds-ink text-[#faf8f2]" : "glass-inset text-ds-ink-2 hover:text-ds-ink"}`}
    >
      {children}
    </button>
  );
}

export function FeatureTag({ children, mine }: { children: ReactNode; mine?: boolean }) {
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2 text-[11.5px] ${mine ? "bg-ds-accent-soft text-ds-accent-ink" : "bg-white/55 text-ds-ink-2"}`}>{children}</span>;
}

/** Small round mark used in empty states: a pennant on an empty rung. */
export function EmptyMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <path d="M10 70h100" stroke="#2b2927" strokeOpacity=".25" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="22" y="50" width="22" height="20" rx="3" fill="none" stroke="#2b2927" strokeOpacity=".3" strokeDasharray="3 4" />
      <rect x="49" y="34" width="22" height="36" rx="3" fill="#f9e0cf" stroke="#2b2927" strokeOpacity=".35" />
      <rect x="76" y="56" width="22" height="14" rx="3" fill="none" stroke="#2b2927" strokeOpacity=".3" strokeDasharray="3 4" />
      <path d="M60 34V12l12 5-12 5" fill="none" stroke="#d5855a" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
