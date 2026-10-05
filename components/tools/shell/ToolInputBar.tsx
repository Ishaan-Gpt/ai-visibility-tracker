"use client";

import type { ReactNode } from "react";
import { IconArrow, IconSpinner } from "@/components/icons/Icons";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";

/** The tool's front door: a frosted field with the tool's own glyph, and quiet example chips under it. */
export function ToolInputBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
  label,
  cta,
  slug,
  examples,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder: string;
  label: string;
  cta: string;
  slug: string;
  examples?: string[];
  children?: ReactNode;
}) {
  return (
    <div className="no-print" data-print-hide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) onSubmit();
        }}
        className="glass-strong group flex flex-col gap-2 rounded-[22px] p-2 transition-shadow duration-300 focus-within:shadow-[0_0_0_5px_rgba(242,169,127,0.3),0_30px_70px_-40px_rgba(43,41,39,0.45)] sm:flex-row sm:items-center"
      >
        <label className="flex min-w-0 flex-1 items-center gap-3 pl-3">
          <span className="glass-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-500 ease-[var(--ds-spring)] group-focus-within:rotate-[-8deg]">
            <ToolGlyph slug={slug} className="h-5 w-5" />
          </span>
          <span className="sr-only">{label}</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 bg-transparent text-[17px] text-ds-ink outline-none placeholder:text-ds-ink-3"
          />
        </label>
        {children}
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="group/b inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-ds-accent px-6 text-[15px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_10px_24px_-14px_rgba(165,85,45,.7)] transition hover:bg-[var(--ds-accent-hover)] active:translate-y-px disabled:opacity-45"
        >
          {loading ? <IconSpinner className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Working…" : cta}
          {!loading && <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover/b:translate-x-0.5" />}
        </button>
      </form>
      {examples && examples.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-3 text-[13px] text-ds-ink-2">
          <span className="font-serif text-[16px] italic">try</span>
          {examples.map((ex) => (
            <button key={ex} type="button" onClick={() => onChange(ex)} className="glass-inset rounded-[10px] px-2.5 py-1 font-mono text-[12px] text-ds-ink-2 transition hover:bg-white/80 hover:text-ds-ink">
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
