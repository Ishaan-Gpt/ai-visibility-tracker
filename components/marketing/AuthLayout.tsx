"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { IconArrow } from "@/components/icons/Icons";
import { Halftone } from "@/components/landing/Painted";

/* eslint-disable @next/next/no-img-element -- decorative art */

const EASE = [0.22, 1, 0.36, 1] as const;

/** A perforated stamp holding a small painting and its denomination. */
function Stamp({ src, value }: { src: string; value: string }) {
  return (
    <div
      className="relative h-[92px] w-[76px] rotate-[4deg] bg-[#faf8f2] p-[7px] shadow-[0_8px_18px_-10px_rgba(43,41,39,.5)]"
      style={{
        WebkitMask: "radial-gradient(circle 3.4px at 50% 50%, transparent 97%, #000) -5px -5px / 10px 10px, linear-gradient(#000 0 0) content-box",
        mask: "radial-gradient(circle 3.4px at 50% 50%, transparent 97%, #000) -5px -5px / 10px 10px, linear-gradient(#000 0 0) content-box",
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <img src={src} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-1 right-1 font-serif text-[13px] italic leading-none text-[#faf8f2] drop-shadow">{value}</span>
      </div>
    </div>
  );
}

/** Ink postmark: two rings, text running round the rim, and wavy cancellation lines trailing off. */
function Postmark() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 170 80" className="h-[72px] w-[160px] -rotate-[8deg] text-ds-ink/45" aria-hidden>
      <defs>
        <path id={`${id}-arc`} d="M40 40 m-27 0 a27 27 0 1 1 54 0 a27 27 0 1 1 -54 0" />
      </defs>
      <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="40" cy="40" r="21" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fontSize="7.4" letterSpacing="2.4" fill="currentColor" fontFamily="var(--font-geist-mono)">
        <textPath href={`#${id}-arc`}>SEOWISE · FREE TOOLS · 2026 ·</textPath>
      </text>
      <text x="40" y="43" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="var(--font-instrument)" fontStyle="italic">
        by hand
      </text>
      {[22, 32, 42, 52, 62].map((y) => (
        <path key={y} d={`M80 ${y} q 10 -5 20 0 t 20 0 t 20 0 t 20 0`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: { title: ReactNode; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [2.2, -2.2]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-2.8, 2.8]), { stiffness: 120, damping: 18 });

  return (
    <div className="relative min-h-screen overflow-hidden bg-ds-canvas font-sans text-ds-ink">
      <img src="/art/sky-closing.webp" alt="" aria-hidden className="pointer-events-none fixed inset-0 h-full w-full object-cover" />
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <Halftone />
      </div>
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(242,239,229,.35),rgba(242,239,229,0)_40%,rgba(242,239,229,.45))]" />
      <img src="/art/foliage-a.webp" alt="" aria-hidden className="pointer-events-none absolute -left-16 -top-24 w-[200px] opacity-90 sm:w-[300px] lg:w-[340px]" />
      <img src="/art/foliage-b.webp" alt="" aria-hidden className="pointer-events-none absolute -bottom-40 -right-16 hidden w-[300px] -scale-x-100 opacity-80 lg:block" />

      <header className="relative z-20 mx-auto flex max-w-[1200px] items-center justify-between px-5 pt-5 sm:px-8">
        <Link href="/" aria-label="seowise home">
          <Logo />
        </Link>
        <Link href="/tools" className="glass group inline-flex h-10 items-center gap-2 rounded-[12px] px-4 text-[14px] text-ds-ink">
          <span className="hidden sm:inline">Use the tools without an account</span>
          <span className="sm:hidden">Tools</span>
          <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 [perspective:1600px]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          onPointerMove={(e) => {
            if (reduce || e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width - 0.5);
            my.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onPointerLeave={() => {
            mx.set(0);
            my.set(0);
          }}
          style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
          className="glass-strong relative grid w-full max-w-[1020px] gap-0 rounded-[26px] p-3 md:grid-cols-[1fr_1fr]"
        >
          {/* picture side */}
          <div className="relative h-[200px] overflow-hidden rounded-[18px] md:h-auto md:min-h-[600px]">
            <img src="/art/landscape.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.1),transparent_40%,rgba(43,51,34,.55))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[#faf8f2] md:p-8">
              <p className="font-serif text-[40px] leading-[0.95] drop-shadow-[0_4px_20px_rgba(0,0,0,.25)] md:text-[64px]">
                Greetings from <span className="block text-[64px] italic md:text-[96px]">seowise</span>
              </p>
              <p className="mt-3 hidden max-w-[300px] text-[14px] leading-5 text-white/85 md:block">Higher limits, saved client reports and AI visibility tracking. Free, no card.</p>
            </div>
          </div>

          {/* message side */}
          <div className="relative flex flex-col px-4 pb-6 pt-8 sm:px-10 md:border-l md:border-dashed md:border-ds-ink/15 md:pl-12 md:pt-10">
            <div className="pointer-events-none absolute right-4 top-4 hidden items-start sm:flex md:right-6 md:top-6">
              <div className="-mr-10 mt-4">
                <Postmark />
              </div>
              <Stamp src="/art/sky-step-3.webp" value="free" />
            </div>

            <div className="sm:mt-24 md:mt-28">
              <h1 className="font-serif text-[44px] leading-[1] tracking-[-0.02em]">{title}</h1>
              <p className="mt-3 max-w-[360px] text-[15px] leading-6 text-ds-ink-2">{subtitle}</p>
            </div>
            <div className="mt-8 max-w-[400px]">{children}</div>
            <div className="mt-8 text-[14px] text-ds-ink-2">{footer}</div>

            {/* address rules, like the back of a postcard */}
            <div aria-hidden className="mt-auto hidden space-y-4 pt-10 md:block">
              <div className="h-px w-full bg-ds-ink/10" />
              <div className="h-px w-4/5 bg-ds-ink/10" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
