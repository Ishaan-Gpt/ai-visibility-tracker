"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";
import { IcCompass, IcDossier, IcSeer, IcTicket, IcWindow } from "@/components/icons/Studio";
import { IconArrow } from "@/components/icons/Icons";
import { ArchWindow, InkWell } from "@/components/studio/Pieces";
import { ReportList } from "@/components/app/ReportList";
import ScoreCard from "@/components/dashboard/ScoreCard";
import CompetitorCompare from "@/components/dashboard/CompetitorCompare";
import TrendChart from "@/components/dashboard/TrendChart";
import { Ticket } from "@/components/studio/Billing";
import { SAMPLE_REPORTS } from "@/lib/samples";

/*
 * The real studio, running on sample data. Every pane below is the same component the signed-in app renders;
 * the dock is live (click to switch) and the preview cycles by itself until someone touches it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWS = [
  { id: "overview", label: "Overview", Icon: IcWindow },
  { id: "reports", label: "Saved reports", Icon: IcDossier },
  { id: "visibility", label: "AI Visibility", Icon: IcSeer },
  { id: "billing", label: "Plan & billing", Icon: IcTicket },
] as const;
type View = (typeof VIEWS)[number]["id"];

const BRAND = { id: "demo", ownerUid: "demo", name: "Northside Dental", domain: "northside-dental.example", competitors: [{ name: "Smile Co", domain: "smileco.example" }], createdAt: 0 };
const ROLLUPS = [38, 41, 47, 45, 53, 61].map((score, i) => ({ brandId: "demo", date: `2026-09-${String(8 + i * 4).padStart(2, "0")}`, totalPrompts: 3, mentionedCount: 2, score, competitorMentionCounts: {} }));

function Pane({ view }: { view: View }) {
  if (view === "overview")
    return (
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="glass rounded-[22px] p-5">
          <h3 className="font-serif text-[26px] leading-none">
            Today&apos;s <span className="italic">runs</span>, left in the well
          </h3>
          <div className="mt-6 flex justify-around gap-3">
            <InkWell label="Page audits" used={7} limit={25} delay={0.1} />
            <InkWell label="AI crawler checks" used={31} limit={40} delay={0.25} />
            <InkWell label="Keyword research" used={1} limit={6} delay={0.4} />
          </div>
        </div>
        <ArchWindow className="min-h-[300px]">
          <p className="font-serif text-[30px] leading-[1.02]">
            Watching <span className="italic">Northside</span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-white/80">northside-dental.example</p>
        </ArchWindow>
      </div>
    );
  if (view === "reports") return <ReportList items={SAMPLE_REPORTS} compact demo />;
  if (view === "visibility")
    return (
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.4fr]">
        <ScoreCard score={61} checkedPrompts={3} />
        <div className="glass rounded-[24px] p-5">
          <h3 className="mb-2 font-serif text-[26px] leading-none">
            Visibility <span className="italic">over time</span>
          </h3>
          <TrendChart rollups={ROLLUPS} />
        </div>
        <div className="md:col-span-2">
          <CompetitorCompare brand={BRAND} latestRollup={{ brandId: "demo", date: "2026-09-28", totalPrompts: 3, mentionedCount: 2, score: 61, competitorMentionCounts: { "smileco.example": 1 } }} />
        </div>
      </div>
    );
  return <Ticket isPaid={false} billingConfigured={false} />;
}

export function StudioPreview() {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("overview");
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15%" });

  useEffect(() => {
    if (touched || !inView || reduce) return;
    const t = setTimeout(() => setView((v) => VIEWS[(VIEWS.findIndex((x) => x.id === v) + 1) % VIEWS.length].id), 5200);
    return () => clearTimeout(t);
  }, [view, touched, inView, reduce]);

  const current = VIEWS.find((v) => v.id === view)!;

  return (
    <div ref={ref} className="glass-strong relative flex overflow-hidden rounded-[22px] text-left" onPointerDown={() => setTouched(true)}>
      <nav aria-label="Studio preview" className="flex shrink-0 flex-col items-center gap-1.5 border-r border-white/60 bg-white/25 p-2.5 max-sm:hidden">
        <span className="mb-2 flex h-11 w-11 items-center justify-center">
          <LogoMark className="h-5 w-5" />
        </span>
        {VIEWS.map((v) => {
          const active = v.id === view;
          return (
            <button
              key={v.id}
              type="button"
              aria-label={v.label}
              aria-pressed={active}
              onClick={() => setView(v.id)}
              className="group relative flex h-11 w-11 items-center justify-center rounded-[14px] text-ds-ink"
            >
              {active && <motion.span layoutId="preview-bead" transition={{ type: "spring", stiffness: 520, damping: 38 }} className="absolute inset-0 rounded-[14px] bg-white/85 shadow-[0_6px_16px_-8px_rgba(43,41,39,0.35)]" />}
              <span className="absolute inset-0 rounded-[14px] transition-colors group-hover:bg-white/45" />
              <v.Icon active={active} className="relative h-5 w-5 transition-transform duration-500 ease-[var(--ds-spring)] group-hover:scale-110" />
            </button>
          );
        })}
        <span className="my-1.5 h-px w-6 bg-ds-ink/10" />
        <span className="flex h-11 w-11 items-center justify-center text-ds-ink">
          <IcCompass className="h-5 w-5" />
        </span>
      </nav>

      <div className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-serif text-[30px] leading-none sm:text-[38px]">
            {current.label.split(" ").slice(0, -1).join(" ")} <span className="italic">{current.label.split(" ").slice(-1)}</span>
          </h2>
          {/* mobile view switcher */}
          <div className="flex gap-1 sm:hidden">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" aria-label={v.label} onClick={() => setView(v.id)} className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${v.id === view ? "bg-white/85" : ""}`}>
                <v.Icon active={v.id === view} className="h-[18px] w-[18px]" />
              </button>
            ))}
          </div>
        </div>
        <div className="relative min-h-[330px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={view} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: EASE }}>
              <Pane view={view} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-4 flex items-center justify-between text-[12.5px] text-ds-ink-2">
          <span>The real studio, on sample data. Click the dock.</span>
          <Link href="/signup" className="inline-flex items-center gap-1 font-medium text-ds-ink hover:underline">
            Open yours <IconArrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
