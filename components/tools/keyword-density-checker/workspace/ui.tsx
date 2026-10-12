"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { IconChevron, IconCopy, IconTick } from "@/components/icons/Icons";
import { SeverityIcon } from "@/components/ds/extras";
import type { PlacementStatus } from "@/lib/tools/keywordDensity/target";

/** Collapsible glass section in the page-audit style: serif title, quiet meta on the right. */
export function Section({
  title,
  meta,
  defaultOpen = false,
  children,
  id,
}: {
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  id?: string;
}) {
  // Closed sections mount their content on first open, so a 10,000-word analysis renders fast.
  const [seen, setSeen] = useState(defaultOpen);
  const ref = useRef<HTMLDetailsElement>(null);
  // Printing / "Export PDF": open everything so the PDF has the full report.
  useEffect(() => {
    const onPrint = () => {
      flushSync(() => setSeen(true));
      if (ref.current) ref.current.open = true;
    };
    window.addEventListener("beforeprint", onPrint);
    return () => window.removeEventListener("beforeprint", onPrint);
  }, []);
  return (
    <details
      ref={ref}
      id={id}
      open={defaultOpen}
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open && !seen) setSeen(true);
      }}
      data-print-card
      className="group/d glass rounded-[22px] [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[22px] px-5 py-4 transition-colors hover:bg-white/25 sm:px-6">
        <span className="min-w-0 font-serif text-[24px] leading-tight text-ds-ink sm:text-[26px]">{title}</span>
        <span className="flex shrink-0 items-center gap-3 text-[13px] text-ds-ink-2">
          {meta}
          <IconChevron className="h-4 w-4 transition-transform duration-300 group-open/d:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-white/60 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">{seen ? children : null}</div>
    </details>
  );
}

/** Small pill switch (on/off). */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex h-9 items-center gap-2 rounded-[10px] px-2 text-[13.5px] text-ds-ink-2 transition-colors hover:text-ds-ink"
    >
      <span className={`relative block h-[18px] w-[30px] shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-ds-accent" : "bg-ds-ink/15"}`}>
        <span
          className={`absolute top-[2px] block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(43,41,39,.35)] transition-[left] duration-300 ease-[var(--ds-spring)] ${checked ? "left-[14px]" : "left-[2px]"}`}
        />
      </span>
      {label}
    </button>
  );
}

/** Compact segmented control for in-card tabs. */
export function Tabs<T extends string | number>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="glass-inset inline-flex max-w-full flex-wrap gap-0.5 rounded-[12px] p-1 text-[13px]">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-8 rounded-[9px] px-3 transition-colors ${o.value === value ? "bg-white/90 text-ds-ink shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" : "text-ds-ink-2 hover:text-ds-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string | (() => string); label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-ds-ink-2 transition hover:bg-white/60 hover:text-ds-ink ${className}`}
    >
      {done ? <IconTick className="h-4 w-4 text-ds-success" /> : <IconCopy className="h-4 w-4" />}
      {done ? "Copied" : label}
    </button>
  );
}

/** Placement status mark. "na" (needs a URL) is a dashed ring, so it never reads as a failure. */
export function StatusMark({ status, small = false }: { status: PlacementStatus; small?: boolean }) {
  if (status === "na") {
    return (
      <span title="Needs a URL" className={`inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-ds-ink-3 ${small ? "h-5 w-5" : "h-7 w-7"}`}>
        <span className="sr-only">Not checked</span>
      </span>
    );
  }
  const sev = status === "pass" ? "pass" : status === "fail" || status === "warn" ? "warning" : "info";
  return <SeverityIcon severity={sev} className={small ? "h-5! w-5! [&_svg]:h-3! [&_svg]:w-3!" : ""} />;
}

export const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "–");

export function downloadText(name: string, text: string, type = "text/csv") {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* ignore */
  }
}

/** Little "+ track" action that adds a term to the target keywords. */
export function TrackButton({ onClick, active }: { onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={active}
      title={active ? "Already a target keyword" : "Track as a target keyword"}
      className="inline-flex h-7 items-center rounded-[8px] px-2 text-[12px] text-ds-ink-3 transition hover:bg-white/70 hover:text-ds-accent-ink disabled:cursor-default disabled:text-ds-success disabled:hover:bg-transparent"
    >
      {active ? "tracked" : "+ track"}
    </button>
  );
}
