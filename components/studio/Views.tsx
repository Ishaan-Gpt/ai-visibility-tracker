"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { IconArrow } from "@/components/icons/Icons";
import { IcOpen } from "@/components/icons/Studio";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { ReportList } from "@/components/app/ReportList";
import { ArchWindow, InkWell, QuickAudit } from "@/components/studio/Pieces";
import { Glass, Masthead } from "@/components/studio/Glass";
import { HERO_TOOLS, toolHref } from "@/lib/tools/registry";
import type { HistoryItem } from "@/lib/history";

const EASE = [0.22, 1, 0.36, 1] as const;
const USAGE_LABEL: Record<string, string> = { "page-audit": "Page audits", "ai-crawlers": "AI crawler checks", keywords: "Keyword research" };

function Rise({ children, i = 0, className = "" }: { children: React.ReactNode; i?: number; className?: string }) {
  const reduce = useReducedMotion();
  // opacity + transform only: a filter here would stop the glass inside from blurring the sky.
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08 * i, ease: EASE }} className={className}>
      {children}
    </motion.div>
  );
}

function greeting(h: number | null) {
  if (h === null) return "Welcome back";
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export interface OverviewData {
  name: string;
  usage: { tool: string; used: number; limit: number }[];
  reports: HistoryItem[];
  reportLimit: number;
  brand: { name: string; domain: string } | null;
}

export function OverviewView({ name, usage, reports, reportLimit, brand }: OverviewData) {
  // Local hour is only known in the browser; start neutral to keep SSR and hydration identical.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setHour(new Date().getHours()), 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <>
      <Masthead crumb="Overview" title={`${greeting(hour)},`} italic={`${name}.`} lede="Run a tool, save the result, send the PDF. Everything you keep lives here." actions={<QuickAudit />} />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Rise i={1}>
          <Glass className="h-full p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="max-w-[320px] font-serif text-[30px] leading-[1.05]">
                  Today&apos;s <span className="italic">runs</span>, left in the well
                </h2>
                <p className="mt-1 text-[13px] text-ds-ink-2">Refills at midnight UTC</p>
              </div>
              <span className="glass-inset rounded-full px-3 py-1 text-[12px] text-ds-ink-2">Browser tools · unlimited</span>
            </div>
            <div className="mt-8 flex flex-wrap justify-around gap-6">
              {usage.map((u, i) => (
                <InkWell key={u.tool} label={USAGE_LABEL[u.tool] ?? u.tool} used={u.used} limit={u.limit} delay={0.2 + i * 0.15} />
              ))}
            </div>
          </Glass>
        </Rise>

        <Rise i={2}>
          <Link href={brand ? "/app/visibility" : "/app/onboarding"} className="group block h-full min-h-[360px]">
            <ArchWindow className="h-full min-h-[360px]">
              {brand ? (
                <>
                  <p className="mt-2 font-serif text-[34px] leading-[1.02]">
                    Watching <span className="italic">{brand.name}</span>
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-white/75">{brand.domain}</p>
                </>
              ) : (
                <p className="mt-2 font-serif text-[34px] leading-[1.02]">
                  Is your brand in the <span className="italic">answer?</span>
                </p>
              )}
              <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[13.5px] font-medium text-ds-ink backdrop-blur transition-transform duration-500 ease-[var(--ds-spring)] group-hover:translate-x-1">
                {brand ? "Open the tracker" : "Set up tracking"} <IconArrow className="h-4 w-4" />
              </span>
            </ArchWindow>
          </Link>
        </Rise>
      </div>

      <Rise i={3} className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-[32px] leading-none">
            Recent <span className="italic">reports</span>
          </h2>
          <Link href="/app/history" className="text-[13.5px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline">
            All {reports.length} of {reportLimit}
          </Link>
        </div>
        <ReportList items={reports.slice(0, 5)} compact />
      </Rise>

      <Rise i={4} className="mt-12">
        <h2 className="mb-4 font-serif text-[32px] leading-none">
          Start <span className="italic">something</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HERO_TOOLS.map((t) => (
            <Link key={t.slug} href={toolHref(t.slug)} className="glass group relative flex items-start gap-4 overflow-hidden rounded-[20px] p-5 transition-transform duration-500 ease-[var(--ds-ease)] hover:-translate-y-1">
              <span className="glass-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-ds-ink transition-transform duration-500 ease-[var(--ds-spring)] group-hover:rotate-[-8deg] group-hover:scale-110">
                <ToolGlyph slug={t.slug} className="h-[22px] w-[22px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-medium">{t.name}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-ds-ink-2">{t.tagline}</span>
              </span>
              <IcOpen className="h-4 w-4 shrink-0 text-ds-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ds-ink" />
            </Link>
          ))}
        </div>
      </Rise>
    </>
  );
}

export function HistoryView({ reports, limit, isPro }: { reports: HistoryItem[]; limit: number; isPro: boolean }) {
  return (
    <>
      <Masthead
        crumb="Saved reports"
        title="Saved"
        italic="reports"
        lede="Reopen any report to review it or export a fresh PDF. Re-running a tool fetches the page again."
        actions={
          <Glass className="flex items-center gap-4 rounded-[18px] px-5 py-3">
            <div>
              <p className="font-serif text-[28px] leading-none tabular-nums">
                {reports.length}
                <span className="text-[16px] text-ds-ink-3">/{limit}</span>
              </p>
              <p className="text-[12px] text-ds-ink-2">kept</p>
            </div>
            {!isPro && (
              <Link href="/app/billing" className="text-[13px] text-ds-accent-ink underline-offset-4 hover:underline">
                Full history with Pro
              </Link>
            )}
          </Glass>
        }
      />
      <Rise>
        <ReportList items={reports} />
      </Rise>
    </>
  );
}

export { Rise };
