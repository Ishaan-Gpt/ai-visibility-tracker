"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Check, FileDown, MousePointer2 } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { EASE } from "@/components/ds/motion";

const STEPS = [
  {
    title: "The messy site",
    body: "A client sends a URL. Somewhere in there are the handful of things costing them traffic, and AI citations.",
  },
  {
    title: "The audit",
    body: "We fetch the live page, its robots.txt and llms.txt, and run 20+ SEO checks plus an AI-readiness lens. In seconds.",
  },
  {
    title: "The fixes",
    body: "No forty-page dump. A verdict, then the fixes ranked by impact, each with the exact change to make.",
  },
  {
    title: "The client report",
    body: "One click exports a clean, branded PDF. Send it as is, or use it to scope the work.",
  },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** Progress of `p` inside [from, to], 0..1. */
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function Ring({ value, size = 64, dark = false }: { value: number; size?: number; dark?: boolean }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const tone = value >= 80 ? "var(--ds-success)" : value >= 50 ? "var(--ds-warning)" : "var(--ds-danger)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? "rgba(255,255,255,.12)" : "var(--ds-line)"} strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[18px] font-medium tabular-nums tracking-[-0.03em] ${dark ? "text-white" : "text-ds-ink"}`}>{Math.round(value)}</span>
    </div>
  );
}

const PINS = [
  { at: 0.03, x: "8%", y: "17%", label: "2 × H1" },
  { at: 0.07, x: "56%", y: "8%", label: "No meta description" },
  { at: 0.11, x: "60%", y: "44%", label: "GPTBot & PerplexityBot blocked" },
  { at: 0.15, x: "10%", y: "62%", label: "No schema" },
  { at: 0.19, x: "50%", y: "78%", label: "6 images without alt" },
];

const FIXES = [
  { t: "Unblock OAI-SearchBot and PerplexityBot", lens: "AI", at: 0.56 },
  { t: "Write a 150-character meta description", lens: "SEO", at: 0.62 },
  { t: "Add LocalBusiness + FAQPage schema", lens: "AI", at: 0.68 },
];

function BrowserFrame({ p, dim }: { p: number; dim: boolean }) {
  const scan = seg(p, 0.27, 0.47);
  const scanning = p > 0.25 && p < 0.5;
  return (
    <motion.div
      animate={{ scale: dim ? 0.9 : 1, opacity: dim ? 0.35 : 1, y: dim ? -20 : 0, filter: dim ? "blur(2px)" : "blur(0px)" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="absolute inset-0 overflow-hidden rounded-[20px] border border-ds-line bg-ds-surface shadow-ds-pop"
    >
      <div className="flex items-center gap-2 border-b border-ds-line bg-ds-surface-2 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6159]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c941]" />
        <span className="ml-3 flex-1 truncate rounded-full bg-ds-muted px-3 py-1 font-mono text-[11px] text-ds-ink-2">northside-dental.example/services</span>
      </div>
      <div className="relative h-full p-5 sm:p-7">
        {/* wireframe page */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded-full bg-ds-ink/80" />
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 w-10 rounded-full bg-ds-ink/15" />
            ))}
          </div>
        </div>
        <div className="mt-7 grid grid-cols-[1.2fr_1fr] gap-5">
          <div className="space-y-3">
            <div className="h-5 w-[90%] rounded-md bg-ds-ink/85" />
            <div className="h-5 w-[70%] rounded-md bg-ds-ink/85" />
            <div className="mt-4 space-y-2">
              {[100, 92, 96, 60].map((w, i) => (
                <div key={i} className="h-2 rounded-full bg-ds-ink/12" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="mt-4 h-8 w-28 rounded-full bg-ds-accent/80" />
          </div>
          <div className="aspect-[4/3] rounded-xl bg-[linear-gradient(135deg,#ffd9c2,#f6e7d6)]" />
        </div>
        <div className="mt-7 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 rounded-xl border border-ds-line p-3">
              <div className="h-12 rounded-lg bg-ds-ink/[0.06]" />
              <div className="h-2 w-3/4 rounded-full bg-ds-ink/15" />
              <div className="h-2 w-1/2 rounded-full bg-ds-ink/10" />
            </div>
          ))}
        </div>

        {/* issue pins */}
        {PINS.map((pin) => {
          const on = p >= pin.at && p < 0.5;
          return (
            <motion.div
              key={pin.label}
              initial={false}
              animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.6, y: on ? 0 : 6 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="absolute flex items-center gap-1.5"
              style={{ left: pin.x, top: pin.y }}
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ds-danger/50" />
                <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-ds-danger" />
              </span>
              <span className="whitespace-nowrap rounded-full bg-ds-ink px-2 py-0.5 text-[10px] font-medium text-[#fffcf6] shadow-lg sm:text-[11px]">{pin.label}</span>
            </motion.div>
          );
        })}

        {/* scan line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 transition-opacity duration-300"
          style={{ opacity: scanning ? 1 : 0, height: `${scan * 100}%`, background: "linear-gradient(to bottom, rgba(255,90,31,0.02), rgba(255,90,31,0.10))" }}
        >
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-ds-accent shadow-[0_0_24px_4px_rgba(255,90,31,0.6)]" />
        </div>
      </div>
    </motion.div>
  );
}

function AuditPanel({ p }: { p: number }) {
  const scan = seg(p, 0.27, 0.47);
  const fixing = p >= 0.5;
  const fixProgress = seg(p, 0.53, 0.7);
  const score = fixing ? mix(58, 91, fixProgress) : 58 * scan;
  const ai = fixing ? mix(41, 84, fixProgress) : 41 * scan;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="grain absolute bottom-3 right-3 w-[78%] overflow-hidden rounded-[18px] bg-ds-night p-4 text-[#fffcf6] shadow-ds-pop sm:bottom-5 sm:right-5 sm:w-[62%] sm:p-5"
    >
      <div className="relative flex items-center gap-4">
        <Ring value={score} dark />
        <Ring value={ai} dark />
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{fixing ? "After fixes" : "Auditing"}</p>
          <p className="text-[17px] font-medium leading-tight tracking-[-0.03em]">
            {fixing ? (fixProgress > 0.95 ? "A solid foundation." : "Fixing, in order…") : scan < 1 ? `${Math.round(scan * 22)} / 22 checks` : "Needs work."}
          </p>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {fixing && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative mt-4 space-y-2 overflow-hidden">
            {FIXES.map((f, i) => {
              const done = p >= f.at;
              return (
                <li key={f.t} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2">
                  <span className="font-mono text-[11px] text-white/40">0{i + 1}</span>
                  <span className={`min-w-0 flex-1 truncate text-[12px] transition-colors duration-300 sm:text-[13px] ${done ? "text-white/50 line-through decoration-white/50" : "text-white/90"}`}>{f.t}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${f.lens === "AI" ? "bg-ds-accent text-ds-night" : "bg-white/15 text-white/70"}`}>{f.lens}</span>
                  <motion.span
                    initial={false}
                    animate={{ scale: done ? 1 : 0, rotate: done ? 0 : -90 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ds-success"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.span>
                </li>
              );
            })}
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReportPaper({ p }: { p: number }) {
  const t = seg(p, 0.76, 0.88);
  const clicked = p > 0.9;
  return (
    <motion.div
      initial={{ opacity: 0, y: 120, rotate: 6 }}
      animate={{ opacity: 1, y: 0, rotate: -2.5 }}
      exit={{ opacity: 0, y: 120, rotate: 6 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="absolute left-1/2 top-[-2%] w-[62%] max-w-[330px] -translate-x-1/2"
    >
      <div className="aspect-[1/1.22] rounded-[6px] bg-white p-5 text-ds-ink shadow-[0_40px_80px_-30px_rgba(22,17,13,0.55)] sm:p-7">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.04em]">
            <LogoMark className="h-4 w-4 text-ds-ink" /> seo<span className="accent-word font-normal">wise</span>
          </span>
          <span className="font-mono text-[9px] text-black/45">Page audit · PDF</span>
        </div>
        <p className="mt-4 text-[17px] font-semibold leading-tight tracking-[-0.03em] sm:text-[20px]">northside-dental.example</p>
        <div className="mt-4 flex items-center gap-3">
          <Ring value={mix(0, 91, t)} size={56} />
          <Ring value={mix(0, 84, t)} size={56} />
          <p className="text-[12px] leading-4 text-black/60">
            <span className="block font-semibold text-black">A solid foundation.</span>3 fixes shipped
          </p>
        </div>
        <div className="mt-5 space-y-2">
          {FIXES.map((f) => (
            <div key={f.t} className="flex items-center gap-2 text-[10px] text-black/70 sm:text-[11px]">
              <Check className="h-3 w-3 text-ds-success" strokeWidth={3} /> <span className="truncate">{f.t}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-1.5">
          {[100, 94, 88, 70].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full bg-black/[0.07]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <motion.div
        animate={{ scale: clicked ? 0.94 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className="absolute -bottom-5 -right-4 flex items-center gap-2 rounded-full bg-ds-accent px-4 py-2.5 text-[13px] font-medium text-ds-night shadow-ds-pop sm:-right-10"
      >
        <FileDown className="h-4 w-4" /> {clicked ? "Saved as PDF" : "Export PDF"}
        <motion.span animate={{ x: clicked ? 0 : 18, y: clicked ? 0 : 18, opacity: t > 0.5 ? 1 : 0 }} transition={{ duration: 0.5, ease: EASE }} className="absolute -bottom-4 right-6">
          <MousePointer2 className="h-5 w-5 fill-ds-ink text-[#fffcf6]" />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

function Stage({ p }: { p: number }) {
  const step = Math.min(3, Math.floor(p * 4));
  return (
    <div className="relative mx-auto aspect-[4/3.4] w-full max-w-[640px] sm:aspect-[4/3]">
      <BrowserFrame p={p} dim={step === 3} />
      <AnimatePresence>{(step === 1 || step === 2) && <AuditPanel key="audit" p={p} />}</AnimatePresence>
      <AnimatePresence>{step === 3 && <ReportPaper key="report" p={p} />}</AnimatePresence>
      <p className="absolute -bottom-7 left-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ds-ink-3">Illustration · fictional site</p>
    </div>
  );
}

export function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [p, setP] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setP(v));
  const step = Math.min(3, Math.floor(p * 4));

  if (reduce) {
    return (
      <section id="story" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <StoryHeading />
          <div className="mt-14 grid gap-16">
            {STEPS.map((s, i) => (
              <div key={s.title} className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <StepText i={i} active />
                <Stage p={[0.22, 0.48, 0.74, 0.99][i]} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="story" ref={ref} className="relative scroll-mt-0" style={{ height: "420vh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-6 px-4 pt-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-8 lg:pt-0">
          <div>
            <StoryHeading />
            {/* desktop: all steps, active one expanded */}
            <ol className="mt-10 hidden space-y-1 lg:block">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <StepText i={i} active={i === step} />
                </li>
              ))}
            </ol>
            {/* mobile: only the active step */}
            <div className="mt-5 min-h-[112px] lg:hidden">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: EASE }}>
                  <StepText i={step} active />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 flex gap-1.5 lg:mt-8" aria-hidden>
              {STEPS.map((_, i) => (
                <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-ds-ink/10">
                  <div className="h-full rounded-full bg-ds-accent" style={{ width: `${seg(p, i / 4, (i + 1) / 4) * 100}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="pb-8 lg:pb-0">
            <Stage p={p} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryHeading() {
  return (
    <>
      <p className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ds-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-ds-accent" /> How it works
      </p>
      <h2 className="mt-4 text-[34px] font-medium leading-[1] tracking-[-0.05em] sm:text-[48px] lg:text-[56px]">
        From messy site to <span className="accent-word">client-ready</span> in one sitting.
      </h2>
    </>
  );
}

function StepText({ i, active }: { i: number; active: boolean }) {
  const s = STEPS[i];
  return (
    <div className={`border-l-2 py-2 pl-5 transition-[border-color,opacity] duration-500 ${active ? "border-ds-accent opacity-100" : "border-ds-line opacity-40"}`}>
      <p className="font-mono text-[12px] text-ds-ink-3">0{i + 1}</p>
      <p className="mt-1 text-[22px] font-medium tracking-[-0.035em] lg:text-[24px]">{s.title}</p>
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ds-ease)] ${active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <p className="overflow-hidden text-[16px] leading-7 text-ds-ink-2">{s.body}</p>
      </div>
    </div>
  );
}
