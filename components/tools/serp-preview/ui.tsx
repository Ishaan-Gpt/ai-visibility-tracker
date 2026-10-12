"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { MeterState } from "./serpMetrics";

export const fieldCls =
  "glass-inset w-full rounded-[12px] px-3.5 py-2.5 text-[15px] leading-6 text-ds-ink outline-none transition-[box-shadow,background-color] duration-300 placeholder:text-ds-ink-3 focus:bg-white/75 focus:shadow-[0_0_0_4px_rgba(242,169,127,0.32)]";

export const monoFieldCls = `${fieldCls} font-mono text-[13px]`;

export function Field({ label, htmlFor, aside, children, hint }: { label: string; htmlFor: string; aside?: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[14px] font-medium text-ds-ink">
          {label}
        </label>
        {aside && <span className="shrink-0 text-[12.5px] tabular-nums text-ds-ink-2">{aside}</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] leading-5 text-ds-ink-2">{hint}</p>}
    </div>
  );
}

const TONE: Record<MeterState, { bar: string; text: string }> = {
  good: { bar: "bg-ds-success", text: "text-[#4c6b57]" },
  short: { bar: "bg-ds-warning", text: "text-[#a56312]" },
  over: { bar: "bg-ds-danger", text: "text-[#b23a2a]" },
  empty: { bar: "bg-ds-ink-3", text: "text-ds-ink-3" },
};

/** px used against a limit, with the remaining (or overflowing) pixels spelled out. */
export function Meter({ label, used, limit, remaining, state, note }: { label: string; used: number; limit: number; remaining: number; state: MeterState; note?: string }) {
  const pct = Math.min(100, (used / limit) * 100);
  const tone = TONE[state];
  const r = Math.round(remaining);
  return (
    <div className="grid grid-cols-[64px_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[64px_1fr_auto]">
      <span className="text-[12.5px] text-ds-ink-2">{label}</span>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-ds-ink/8" role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.round(used)} aria-label={`${label}: ${Math.round(used)} of ${limit} pixels`}>
        <div className={`h-full rounded-full transition-[width,background-color] duration-300 ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="col-span-2 text-[12.5px] tabular-nums text-ds-ink-2 sm:col-span-1 sm:text-right">
        {Math.round(used)} / {limit}px ·{" "}
        <span className={`font-medium ${tone.text}`}>{state === "empty" ? "empty" : r >= 0 ? `${r}px left` : `${-r}px over`}</span>
        {note ? <span className="text-ds-ink-3"> · {note}</span> : null}
      </span>
    </div>
  );
}

/** Renders a fixed-width preview and scales it down to fit narrow containers (no horizontal scroll). */
export function FitScale({ width, children, className = "" }: { width: number; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ scale: number; height: number | null }>({ scale: 1, height: null });

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const ro = new ResizeObserver(() => {
      const scale = Math.min(1, o.clientWidth / width);
      setBox({ scale, height: i.offsetHeight * scale });
    });
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className={`w-full overflow-hidden ${className}`} style={{ height: box.height ?? undefined }}>
      <div ref={inner} style={{ width, transform: box.scale < 1 ? `scale(${box.scale})` : undefined, transformOrigin: "top left", marginInline: box.scale < 1 ? 0 : "auto" }}>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ lead, accent, children }: { lead: string; accent: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h3 className="font-serif text-[30px] leading-[1.02] text-ds-ink sm:text-[34px]">
        {lead} <span className="italic">{accent}</span>
      </h3>
      {children}
    </div>
  );
}

/** A small on/off switch. */
export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2 text-[13.5px] text-ds-ink-2">
      <span className="relative inline-flex h-5 w-9 shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-ds-ink/12 transition-colors duration-200 peer-checked:bg-ds-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ds-accent peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(43,41,39,.3)] transition-transform duration-200 ease-[var(--ds-ease)] peer-checked:translate-x-4" />
      </span>
      {label}
    </label>
  );
}

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "good" | "warn" | "bad" }) {
  const cls =
    tone === "accent"
      ? "bg-ds-accent-soft text-ds-accent-ink"
      : tone === "good"
        ? "bg-[#dbe6dc]/80 text-[#4c6b57]"
        : tone === "warn"
          ? "bg-[#f7e2c4]/80 text-[#a56312]"
          : tone === "bad"
            ? "bg-[#f6d5cc]/80 text-[#b23a2a]"
            : "glass-inset text-ds-ink-2";
  return <span className={`inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[12.5px] tabular-nums ${cls}`}>{children}</span>;
}
