"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { IconArrowUp, IconCheckCircle, IconMail, IconSpinner } from "@/components/icons/Icons";
import { LogoMark } from "@/components/brand/Logo";
import { PaintedFoliage, PaintedSky } from "@/components/landing/Painted";
import { Lede } from "@/components/landing/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

function Working() {
  const rows = [
    { t: "Detect missing FAQ schema", s: "Confirmed", state: "done" },
    { t: "Check AI crawler access", s: "In process", state: "run" },
    { t: "Rank fixes by impact", s: "Up next", state: "todo" },
  ] as const;
  return (
    <div className="rounded-[12px] border border-ds-line bg-[#faf8f2] p-3 text-[12px]">
      <p className="mb-2 flex items-center gap-1.5 text-ds-ink-3">
        <LogoMark className="h-3.5 w-3.5" /> seowise working
      </p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.t} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${r.state === "done" ? "bg-[#ece7da]" : "bg-white/70"}`}>
            {r.state === "done" && <IconCheckCircle className="h-3.5 w-3.5 text-[#5c7c68]" />}
            {r.state === "run" && <IconSpinner className="h-3.5 w-3.5 animate-spin text-ds-ink-2" />}
            {r.state === "todo" && <span className="mx-[3px] h-2 w-2 rounded-full border border-ds-ink-3" />}
            <span className={`flex-1 ${r.state === "todo" ? "text-ds-ink-3" : "text-ds-ink"}`}>{r.t}</span>
            <span className="text-[10.5px] text-ds-ink-3">{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chat() {
  return (
    <div className="rounded-[12px] border border-ds-line bg-[#faf8f2] p-3 text-[12px]">
      <div className="ml-auto w-[78%] rounded-[10px] rounded-br-sm bg-[#e4ece4] px-3 py-2 text-ds-ink">Why don&apos;t we show up when people ask ChatGPT?</div>
      <div className="mt-2 flex gap-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ece7da]">
          <LogoMark className="h-3 w-3" />
        </span>
        <p className="leading-[1.45] text-ds-ink">Your robots.txt blocks OAI-SearchBot, so ChatGPT search can&apos;t read the site. Removing one line fixes it.</p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-ds-line bg-white/70 px-2.5 py-1.5 text-ds-ink-3">
        <IconMail className="h-3.5 w-3.5" />
        <span className="flex-1">Write a follow-up…</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#62644e] text-white">
          <IconArrowUp className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function Paper() {
  return (
    <div className="relative h-[170px] overflow-hidden">
      <div className="absolute left-1/2 top-2 w-[78%] -translate-x-1/2 rotate-[-3deg] rounded-[6px] bg-white p-4 shadow-[0_20px_40px_-20px_rgba(43,41,39,0.45)] transition-transform duration-700 ease-[var(--ds-ease)] group-hover:-translate-y-2 group-hover:rotate-0">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="font-serif text-[15px] italic">seowise</span>
          <span className="text-[9px] text-black/40">Page audit · PDF</span>
        </div>
        <p className="mt-2 font-serif text-[18px] leading-tight">acme-bakery.example</p>
        <p className="mt-1 text-[10px] text-black/55">A solid foundation. 3 fixes, all quick.</p>
        <div className="mt-3 space-y-1.5">
          {[100, 86, 92, 64].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full bg-black/[0.07]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  { title: "Audits while you're on the call", body: "Paste the prospect's URL mid-conversation. By the time they finish the sentence, you have the verdict.", ui: <Working /> },
  { title: "Clients finally get AI search", body: "Every result explains, in plain words, whether AI answers can reach and quote the page, and why not.", ui: <Chat /> },
  { title: "A report they'll actually read", body: "Verdict, ranked fixes, then the detail. Export a clean PDF and send it as it is.", ui: <Paper /> },
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
