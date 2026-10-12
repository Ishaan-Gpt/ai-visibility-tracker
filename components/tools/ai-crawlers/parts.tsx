"use client";

import { useState, type ReactNode } from "react";
import { IconClose as X, IconCopy, IconMinus as Minus, IconTick as Check } from "@/components/icons/Icons";
import type { Access } from "@/lib/tools/aiCrawlers/robots";
import type { LiveVerdict, ProbeResult } from "@/lib/tools/aiCrawlers/probe";

export const ACCESS_STYLE = {
  allowed: { cls: "bg-[#dbe6dc]/80 text-[#4c6b57]", icon: Check, label: "Allowed" },
  partial: { cls: "bg-[#f7e2c4]/80 text-[#a56312]", icon: Minus, label: "Partial" },
  blocked: { cls: "bg-[#f6d5cc]/80 text-[#b23a2a]", icon: X, label: "Blocked" },
} as const;

/** Hand-drawn glyphs for live states (custom SVG, matching the icon set's 1.4px stroke). */
const LiveGlyph = ({ kind, className = "h-3 w-3" }: { kind: "ok" | "stop" | "wall" | "clock" | "wave" | "dash" | "half"; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {kind === "ok" && <path d="m5 12.6 4.3 4L19.2 6.8" />}
    {kind === "stop" && <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />}
    {kind === "wall" && (
      <>
        <path d="M4 7.5h16M4 12h16M4 16.5h16" />
        <path d="M9 7.5V12M15 12v4.5M12 3.5v4" />
      </>
    )}
    {kind === "clock" && (
      <>
        <path d="M19.6 12A7.6 7.6 0 1 1 15.8 5.4" />
        <path d="M12 8v4.3l2.6 1.6" />
      </>
    )}
    {kind === "wave" && <path d="M3.5 12c2-3.6 3.8-3.6 5.7 0s3.8 3.6 5.7 0 3.6-3.6 5.6 0" />}
    {kind === "dash" && <path d="M7 12h10" />}
    {kind === "half" && (
      <>
        <path d="M18.4 8.2A7.4 7.4 0 1 0 19.4 12" />
        <path d="M12 7v5" />
      </>
    )}
  </svg>
);

export const LIVE_STYLE: Record<LiveVerdict, { cls: string; label: string; glyph: Parameters<typeof LiveGlyph>[0]["kind"] }> = {
  ok: { cls: "bg-[#dbe6dc]/80 text-[#4c6b57]", label: "Reachable", glyph: "ok" },
  blocked: { cls: "bg-[#f6d5cc]/80 text-[#b23a2a]", label: "Refused", glyph: "stop" },
  challenge: { cls: "bg-[#f6d5cc]/80 text-[#b23a2a]", label: "Challenged", glyph: "wall" },
  "rate-limited": { cls: "bg-[#f7e2c4]/80 text-[#a56312]", label: "Rate-limited", glyph: "clock" },
  error: { cls: "bg-[#f7e2c4]/80 text-[#a56312]", label: "No response", glyph: "wave" },
  different: { cls: "bg-[#f7e2c4]/80 text-[#a56312]", label: "Different page", glyph: "half" },
  skipped: { cls: "bg-white/55 text-ds-ink-3", label: "Not tested", glyph: "dash" },
};

export function AccessPill({ access, small = false }: { access: Access; small?: boolean }) {
  const A = ACCESS_STYLE[access];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-[9px] font-medium ${small ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12px]"} ${A.cls}`}>
      <A.icon className="h-3 w-3" /> {A.label}
    </span>
  );
}

export function LivePill({ live, small = false }: { live: ProbeResult; small?: boolean }) {
  const unreliable = live.unreliable;
  const L = LIVE_STYLE[live.verdict];
  return (
    <span
      title={live.reason}
      className={`inline-flex shrink-0 items-center gap-1 rounded-[9px] font-medium ${small ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12px]"} ${unreliable ? "bg-white/55 text-ds-ink-2" : L.cls}`}
    >
      <LiveGlyph kind={L.glyph} /> {live.markdown ? "Markdown" : L.label}
      {unreliable && <span aria-label="unreliable">?</span>}
    </span>
  );
}

/** Copyable code (robots.txt lines etc). */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="glass-inset mt-2 overflow-hidden rounded-[12px]">
      <div className="flex items-center justify-between border-b border-white/60 px-3 py-1.5">
        <span className="font-mono text-[11.5px] text-ds-ink-3">{label ?? "robots.txt"}</span>
        <button
          type="button"
          className="no-print inline-flex items-center gap-1 rounded-[8px] px-2 py-0.5 text-[12px] text-ds-ink-2 transition hover:bg-white/70 hover:text-ds-ink"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              /* clipboard unavailable */
            }
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-ds-success" /> : <IconCopy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-[12.5px] leading-5 text-ds-ink">{code}</pre>
    </div>
  );
}

/** Label/value rows used inside expandable panels. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-[150px_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ds-ink-3">{k}</dt>
          <dd className="min-w-0 break-words text-ds-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function kb(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
}
