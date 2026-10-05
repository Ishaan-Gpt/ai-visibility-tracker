"use client";

import { useEffect, useRef, useState } from "react";
import { IconAlert as AlertCircle, IconCheckCircle as CheckCircle2, IconInfo as Info, IconWarn as AlertTriangle } from "@/components/icons/Icons";
import { useReducedMotion } from "framer-motion";

export function toneFor(score: number) {
  return score >= 80 ? "var(--ds-success)" : score >= 50 ? "var(--ds-warning)" : "var(--ds-danger)";
}

/** Counts up to `value` once mounted. Respects reduced motion. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(a + (value - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);
  return <>{reduce ? value : n}</>;
}

/** Circular score gauge with an animated sweep. `dark` for use on espresso surfaces. */
export function ScoreRing({
  score,
  size = 120,
  label,
  dark = false,
  stroke = 8,
}: {
  score: number;
  size?: number;
  label?: string;
  dark?: boolean;
  stroke?: number;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? score : 0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);
  const r = (size - stroke - 4) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, shown));
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? "rgba(255,244,230,0.12)" : "var(--ds-line)"} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneFor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          style={{ transition: "stroke-dashoffset 1100ms var(--ds-ease)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-medium tabular-nums tracking-[-0.04em] ${dark ? "text-[#fffcf6]" : "text-ds-ink"}`} style={{ fontSize: size * 0.3, lineHeight: 1 }}>
          <CountUp value={score} />
        </div>
        {label && <div className={`mt-1 text-[11px] font-medium uppercase tracking-[0.12em] ${dark ? "text-white/55" : "text-ds-ink-2"}`}>{label}</div>}
      </div>
    </div>
  );
}

const SEVERITY = {
  error: { icon: AlertCircle, cls: "text-[#b23a2a] bg-[#f6d5cc]/70 ring-1 ring-white/70", label: "Error" },
  warning: { icon: AlertTriangle, cls: "text-[#a56312] bg-[#f7e2c4]/70 ring-1 ring-white/70", label: "Warning" },
  info: { icon: Info, cls: "text-ds-ink-2 bg-white/55 ring-1 ring-white/70", label: "Info" },
  pass: { icon: CheckCircle2, cls: "text-[#4c6b57] bg-[#dbe6dc]/75 ring-1 ring-white/70", label: "Pass" },
} as const;

export type SeverityKey = keyof typeof SEVERITY;

export function SeverityIcon({ severity, className = "" }: { severity: SeverityKey; className?: string }) {
  const { icon: Icon, cls, label } = SEVERITY[severity];
  return (
    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cls} ${className}`} title={label}>
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function verdictFor(score: number, ai?: number) {
  const s = ai === undefined ? score : Math.round(score * 0.6 + ai * 0.4);
  if (s >= 85) return { head: "In great shape.", body: "Polish, don't rebuild. The remaining items are refinements." };
  if (s >= 70) return { head: "A solid foundation.", body: "A handful of fixes will move the needle. Start at the top." };
  if (s >= 50) return { head: "Needs work.", body: "Several issues are holding this back. The fixes below are ordered by impact." };
  return { head: "Serious problems.", body: "Fix the top items before anything else. They block search or AI visibility outright." };
}
