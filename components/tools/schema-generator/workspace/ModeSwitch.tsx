"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/**
 * Segmented mode switch shared by the browser tools (Schema, Meta & SERP preview, Keyword density).
 * A frosted track with a sliding white pill under the active option.
 */
export function ModeSwitch<T extends string>({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  label: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={`no-print glass-inset inline-flex max-w-full flex-wrap gap-0.5 rounded-[14px] p-1 ${className}`} data-print-hide>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={`relative h-9 rounded-[10px] px-2.5 text-[13px] sm:px-3.5 sm:text-[14px] transition-colors duration-200 ${active ? "text-ds-ink" : "text-ds-ink-2 hover:text-ds-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`mode-pill-${id}`}
                className="absolute inset-0 rounded-[10px] bg-white/85 shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_6px_16px_-10px_rgba(43,41,39,.45)]"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
