"use client";

import type { FeatureVerdict } from "@/lib/tools/validation/googleRichResultRules";
import type { FeatureAvailability } from "@/lib/tools/validation/googleRichResultRules";
import type { IssueSeverity } from "@/lib/tools/validation/structuredDataValidator";

export const TONE = {
  error: "text-[#b23a2a] bg-[#f6d5cc]/75",
  warning: "text-[#a56312] bg-[#f7e2c4]/75",
  info: "text-ds-ink-2 bg-white/60",
  pass: "text-[#4c6b57] bg-[#dbe6dc]/80",
  muted: "text-ds-ink-2 bg-[#e9e3d5]/80",
} as const;

export function verdictLabel(v: FeatureVerdict, availability: FeatureAvailability): { text: string; tone: keyof typeof TONE } {
  if (v === "not-shown") return { text: "No longer shown", tone: "muted" };
  if (v === "invalid") return { text: "Not eligible", tone: "error" };
  const limited = availability === "limited";
  if (v === "warnings") return { text: limited ? "Valid, limited reach" : "Eligible, can improve", tone: limited ? "muted" : "warning" };
  return { text: limited ? "Valid, limited reach" : "Eligible", tone: limited ? "muted" : "pass" };
}

export function Pill({ tone, children, className = "" }: { tone: keyof typeof TONE; children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium ring-1 ring-white/70 ${TONE[tone]} ${className}`}>{children}</span>;
}

/** Hand-drawn marks: a filled dot for errors, a hollow diamond for warnings, a small ring for info, a tick for passes. */
export function Mark({ kind, className = "" }: { kind: IssueSeverity | "pass" | "fail-required" | "fail-recommended"; className?: string }) {
  const k = kind === "fail-required" ? "error" : kind === "fail-recommended" ? "warning" : kind;
  const color = k === "error" ? "#b23a2a" : k === "warning" ? "#b8741a" : k === "pass" ? "#4c6b57" : "#8f8983";
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 ${className}`} aria-hidden>
      {k === "error" && (
        <>
          <path d="M5.4 2.2h5.2l3.2 3.2v5.2l-3.2 3.2H5.4l-3.2-3.2V5.4z" fill={color} fillOpacity=".14" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M8 5v3.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="10.9" r=".85" fill={color} />
        </>
      )}
      {k === "warning" && (
        <>
          <path d="M8 2.4 13.6 8 8 13.6 2.4 8z" fill={color} fillOpacity=".12" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M8 5.6v2.8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="10.3" r=".75" fill={color} />
        </>
      )}
      {k === "info" && (
        <>
          <circle cx="8" cy="8" r="5.6" fill="none" stroke={color} strokeWidth="1.2" />
          <path d="M8 7.4v3.2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="5.3" r=".75" fill={color} />
        </>
      )}
      {k === "pass" && (
        <>
          <circle cx="8" cy="8" r="6" fill={color} fillOpacity=".13" />
          <path d="m5.1 8.3 2 1.9 3.9-4.3" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

export function Chevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""} ${className}`} aria-hidden>
      <path d="m4 6.2 4 3.9 4.1-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A small "open externally" glyph: an arrow leaving a soft corner. */
export function OutGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${className}`} aria-hidden>
      <path d="M6.5 3.5H4.6c-.6 0-1.1.5-1.1 1.1v6.8c0 .6.5 1.1 1.1 1.1h6.8c.6 0 1.1-.5 1.1-1.1V9.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 3.2h3.8V7M12.6 3.4 7.6 8.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Open in builder" glyph: a pen nib over a bracket. */
export function EditGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 ${className}`} aria-hidden>
      <path d="M3.4 5.2 1.8 8l1.6 2.8M12.6 5.2 14.2 8l-1.6 2.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.8 3.6 1.5 1.5-4.9 5-2 .5.5-2z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
