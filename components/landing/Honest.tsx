"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { IconCheckCircle, IconClock, IconShield } from "@/components/icons/Icons";
import { PaintedLandscape } from "@/components/landing/Painted";
import { ScrollFill } from "@/components/landing/ScrollFill";
import { Lede } from "@/components/landing/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Engraved emblem: a reading loupe resting on a sprig, inside a ring of fine rays. Drawn by hand in SVG. */
function Emblem() {
  const rays = Array.from({ length: 48 }, (_, i) => i * 7.5);
  return (
    <svg viewBox="0 0 120 120" className="h-[128px] w-[128px]" aria-hidden>
      <circle cx="60" cy="60" r="52" fill="none" stroke="#cfc8ba" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="44" fill="#efe9dc" stroke="#d9d2c4" strokeWidth="0.6" />
      {rays.map((a) => (
        <line key={a} x1="60" y1="10" x2="60" y2={a % 15 === 0 ? 15 : 13} stroke="#c2b9a9" strokeWidth="0.6" transform={`rotate(${a} 60 60)`} />
      ))}
      {/* sprig */}
      <path d="M38 84c10-6 20-16 28-30" fill="none" stroke="#6d7a4e" strokeWidth="1.2" strokeLinecap="round" />
      {[
        [44, 76, -40],
        [50, 69, -55],
        [56, 61, -35],
        [61, 54, -60],
        [47, 80, 30],
        [54, 72, 20],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="6" ry="2.6" fill={i % 2 ? "#8a9461" : "#a9ad78"} stroke="#55603f" strokeWidth="0.5" transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {/* loupe */}
      <circle cx="68" cy="50" r="15" fill="#f9e0cf" fillOpacity="0.55" stroke="#2b2927" strokeWidth="1.6" />
      <path d="M60 44c1.6-3.2 4.6-5.2 8-5.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m79 61 12 12" stroke="#2b2927" strokeWidth="4" strokeLinecap="round" />
      <path d="m79 61 12 12" stroke="#a5552d" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={58 + i * 3} y1="57" x2={61 + i * 3} y2="42" stroke="#2b2927" strokeOpacity="0.12" strokeWidth="0.6" />
      ))}
    </svg>
  );
}

function Column({ title, body, point, icon: Icon }: { title: string; body: string; point: string; icon: typeof IconShield }) {
  return (
    <div className="mx-auto max-w-[330px] text-center">
      <Icon className="mx-auto mb-4 h-6 w-6 text-ds-ink-2" />
      <h3 className="font-serif text-[30px] leading-[1.08] tracking-[-0.02em] text-ds-ink/90 sm:text-[34px]">{title}</h3>
      <p className="mt-4 text-[14.5px] leading-6 text-ds-ink-2">{body}</p>
      <p className="mt-6 inline-flex items-center gap-2 text-[14.5px] font-medium text-ds-ink">
        <IconCheckCircle className="h-4 w-4 text-[#5c7c68]" /> {point}
      </p>
    </div>
  );
}

export function Honest() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [reduce ? -5 : 4, reduce ? -5 : -9]);

  return (
    <section className="py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-4 text-center">
        <motion.div initial={reduce ? false : { opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} className="flex justify-center">
          <Emblem />
        </motion.div>
        <h2 className="mt-6 font-serif text-[46px] leading-[1.02] tracking-[-0.025em] sm:text-[64px] lg:text-[76px]">
          <span className="block">Fast answers,</span>
          <ScrollFill text="honest data" className="block italic" />
        </h2>
        <Lede className="mt-6">You put your name on the report you send. So seowise never invents a number to fill a gap</Lede>
      </div>

      <div ref={ref} className="mx-auto mt-20 grid max-w-[1200px] items-center gap-14 px-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <Column
          icon={IconShield}
          title="Every number says where it came from"
          body="Live fetches are measured. Intent and scores are estimates and labelled as such. Search volume only appears when real provider data is connected."
          point="Measured vs estimated, always marked"
        />
        <motion.div style={{ rotate }} className="mx-auto">
          <div
            className="relative h-[300px] w-[250px] bg-[#faf8f2] p-[14px] shadow-[0_30px_60px_-30px_rgba(43,41,39,0.4)] sm:h-[340px] sm:w-[280px]"
            style={{
              WebkitMask: "radial-gradient(circle 6px at 50% 50%, transparent 97%, #000) -8px -8px / 16px 16px, linear-gradient(#000 0 0) content-box",
              mask: "radial-gradient(circle 6px at 50% 50%, transparent 97%, #000) -8px -8px / 16px 16px, linear-gradient(#000 0 0) content-box",
            }}
          >
            <div className="relative h-full w-full overflow-hidden">
              <PaintedLandscape />
              <span className="absolute left-3 top-3 font-serif text-[20px] italic text-ds-ink/80">seowise</span>
              <span className="absolute bottom-3 right-3 font-mono text-[10px] tracking-[0.1em] text-[#faf8f2]">FREE · 2026</span>
            </div>
          </div>
        </motion.div>
        <Column
          icon={IconClock}
          title="Give the afternoon back"
          body="A first-pass audit, an AI crawler check and a client-ready PDF take minutes, not a crawl, a spreadsheet and a slide deck."
          point="Browser-only tools are unlimited"
        />
      </div>
    </section>
  );
}
