"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SeverityIcon } from "@/components/ds/extras";
import { IconChevron } from "@/components/icons/Icons";
import { verdict, type Issue } from "./issues";
import { Chip } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

export function IssuesPanel({ issues, subject }: { issues: Issue[]; subject: string }) {
  const v = verdict(issues);
  const reduce = useReducedMotion();
  const notes = issues.length - v.errors - v.warnings;
  return (
    <section className="space-y-3">
      <div data-print-card className="glass-strong relative overflow-hidden rounded-[24px] p-5 sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.45),transparent)] print:hidden" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-serif text-[38px] leading-[0.98] text-ds-ink sm:text-[46px]">
              {v.lead} <span className="italic">{v.accent}.</span>
            </h3>
            <p className="mt-2 max-w-[560px] text-[15.5px] leading-6 text-ds-ink-2">{v.body}</p>
            <p className="mt-1 truncate text-[13px] text-ds-ink-3">{subject}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone={v.errors ? "bad" : "plain"}>{v.errors} errors</Chip>
            <Chip tone={v.warnings ? "warn" : "plain"}>{v.warnings} warnings</Chip>
            <Chip>{notes} notes</Chip>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <ul className="glass divide-y divide-white/60 overflow-hidden rounded-[22px]">
          {issues.map((i, n) => (
            <motion.li key={i.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(n, 8) * 0.03, ease: EASE }}>
              <details className="group/i [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/30 sm:px-5">
                  <SeverityIcon severity={i.severity} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[15px] font-medium leading-6 text-ds-ink">{i.title}</p>
                    <p className="text-[14px] leading-5 text-ds-ink-2">{i.why}</p>
                  </div>
                  <IconChevron className="mt-1.5 h-4 w-4 shrink-0 text-ds-ink-3 transition-transform duration-300 group-open/i:rotate-180" />
                </summary>
                <div className="space-y-2 pb-4 pl-[56px] pr-4 sm:pr-5">
                  <p className="text-[14px] leading-5 text-ds-ink">
                    <span className="font-medium text-ds-accent-ink">Fix · </span>
                    {i.fix}
                  </p>
                  {i.detail && <pre className="glass-inset max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-[10px] px-3 py-2 font-mono text-[12px] leading-5 text-ds-ink-2">{i.detail}</pre>}
                </div>
              </details>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
