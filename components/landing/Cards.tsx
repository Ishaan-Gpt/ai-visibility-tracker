"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SeverityIcon } from "@/components/ds/extras";
import { LiveStages } from "@/components/landing/Live";
import { ReportList } from "@/components/app/ReportList";
import { SAMPLE_AUDIT, SAMPLE_REPORTS } from "@/lib/samples";
import { PaintedFoliage, PaintedSky } from "@/components/landing/Painted";
import { Lede } from "@/components/landing/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Real AI-lens rows (same markup as Page Audit), with a gentle cycling highlight. */
function LensRows() {
  const rows = SAMPLE_AUDIT.ai.checks.slice(0, 4);
  return (
    <ul className="glass-inset divide-y divide-white/60 overflow-hidden rounded-[16px]">
      {rows.map((c, i) => (
        <motion.li
          key={c.id}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
          className="flex items-start gap-2.5 px-3 py-2.5"
        >
          <SeverityIcon severity={c.severity} className="!h-6 !w-6" />
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-medium text-ds-ink">{c.title}</span>
            <span className="block truncate text-[11.5px] text-ds-ink-2">{c.detail}</span>
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

const CARDS = [
  { title: "Audits while you're on the call", body: "Paste the prospect's URL mid-conversation. By the time they finish the sentence, you have the verdict.", ui: <div className="glass-inset rounded-[16px] p-3 text-left"><LiveStages bare /></div> },
  { title: "Clients finally get AI search", body: "Every result explains, in plain words, whether AI answers can reach and quote the page, and why not.", ui: <LensRows /> },
  { title: "Every report, kept and scored", body: "Save audits to your account and reopen them any time, each with its scores at a glance.", ui: <div className="text-left [&_ul]:!rounded-[16px]"><ReportList items={SAMPLE_REPORTS.slice(0, 2)} compact demo /></div> },
];

export function Cards() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const leafY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 120, reduce ? 0 : -120]);

  return (
    <section ref={ref} className="relative px-3 sm:px-5">
      <motion.div style={{ y: leafY }} className="pointer-events-none absolute -left-20 top-10 z-20 hidden w-[170px] sm:block sm:w-[240px]">
        <PaintedFoliage variant="c" side="left" />
      </motion.div>
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[22px] sm:rounded-[28px]">
        <PaintedSky name="cards" />
        <div className="relative z-30 px-4 pb-16 pt-20 text-center sm:pb-24 sm:pt-28">
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: EASE }}
            className="font-serif text-[46px] leading-[1.02] tracking-[-0.025em] sm:text-[64px] lg:text-[76px]"
          >
            <span className="block">Never send a vague</span>
            <span className="block italic">audit again</span>
          </motion.h2>
          <Lede className="mt-6">seowise doesn&apos;t replace your expertise. It does the checking, so every client conversation starts from the answer</Lede>

          <div className="-mx-4 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-auto sm:max-w-[1180px] lg:grid lg:grid-cols-3 lg:overflow-visible">
            {CARDS.map((c, i) => (
              <motion.article
                key={c.title}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
                className="group relative z-30 flex w-[300px] shrink-0 snap-center flex-col rounded-[18px] bg-[#faf8f2]/92 p-6 text-left shadow-[0_30px_60px_-36px_rgba(43,41,39,0.45)] backdrop-blur transition-transform duration-500 ease-[var(--ds-ease)] hover:-translate-y-1 sm:w-[360px] lg:w-auto"
              >
                <h3 className="text-[18px] font-medium tracking-[-0.015em]">{c.title}</h3>
                <p className="mt-2 text-[14.5px] leading-6 text-ds-ink-2">{c.body}</p>
                <div className="mt-auto pt-10">{c.ui}</div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
