"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { IconLoupe } from "@/components/icons/Icons";
import { CountUp, toneFor } from "@/components/ds/extras";

/* eslint-disable @next/next/no-img-element -- decorative art */

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ink well: a glass test-tube that fills with apricot liquid as the day's runs are used.
 * The surface is a looping wave; hovering makes it slosh.
 */
export function InkWell({ label, used, limit, delay = 0 }: { label: string; used: number; limit: number; delay?: number }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, limit ? used / limit : 0));
  const left = Math.max(0, limit - used);
  const level = 6 + pct * 82; // % of tube height, always a little visible
  return (
    <div className="group flex flex-col items-center">
      <div className="relative h-[168px] w-[54px]">
        {/* tube */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[27px] rounded-t-[10px] border border-white/80 bg-white/35 shadow-[inset_0_2px_10px_rgba(43,41,39,0.06),inset_-6px_0_10px_rgba(255,255,255,0.6)]">
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={{ height: reduce ? `${level}%` : "0%" }}
            animate={{ height: `${level}%` }}
            transition={{ duration: 1.6, delay, ease: EASE }}
          >
            <div className="absolute inset-0 top-2 bg-[linear-gradient(180deg,#f6c3a2,#f2a97f_55%,#e8956a)]" />
            <svg className="absolute -top-1 left-0 h-4 w-[200%] animate-[wave_3.2s_linear_infinite] group-hover:[animation-duration:1.1s]" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden>
              <path d="M0 8 Q 12.5 2 25 8 T 50 8 T 75 8 T 100 8 T 125 8 T 150 8 T 175 8 T 200 8 V16 H0z" fill="#f6c3a2" />
            </svg>
            {/* bubbles */}
            <span className="absolute bottom-3 left-3 h-1.5 w-1.5 rounded-full bg-white/70 animate-[float_3s_ease-in-out_infinite]" />
            <span className="absolute bottom-8 right-3 h-1 w-1 rounded-full bg-white/60 animate-[float_4s_ease-in-out_infinite]" />
          </motion.div>
          {/* gloss + graduations */}
          <span className="absolute left-2 top-3 h-[70%] w-[5px] rounded-full bg-white/60" />
          {[25, 50, 75].map((g) => (
            <span key={g} className="absolute right-0 h-px w-2.5 bg-ds-ink/20" style={{ bottom: `${g}%` }} />
          ))}
        </div>
        {/* lip */}
        <span className="absolute -left-1 -right-1 -top-1 h-2.5 rounded-full border border-white/80 bg-white/50" />
      </div>
      <p className="mt-4 font-serif text-[30px] leading-none tabular-nums">
        {left}
        <span className="text-[16px] text-ds-ink-3">/{limit}</span>
      </p>
      <p className="mt-1 text-center text-[12.5px] leading-4 text-ds-ink-2">{label}</p>
    </div>
  );
}

/** Watch-bezel dial: 60 hairline ticks, an arc in the score's tone, a serif numeral. */
export function Dial({ value, size = 52, label }: { value: number | null; size?: number; label?: string }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const target = value ?? 0;
  // Sweep from empty once mounted (and on every value change), counting the numeral up with it.
  const [v, setV] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setV(target), 60);
    return () => clearTimeout(id);
  }, [target]);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={label ? `${label}: ${value ?? "n/a"}` : undefined}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const r1 = size / 2 - 1;
          const r2 = size / 2 - (i % 5 === 0 ? 3.2 : 2);
          const q = (n: number) => Math.round(n * 100) / 100; // identical strings on server and client
          return <line key={i} x1={q(size / 2 + Math.cos(a) * r1)} y1={q(size / 2 + Math.sin(a) * r1)} x2={q(size / 2 + Math.cos(a) * r2)} y2={q(size / 2 + Math.sin(a) * r2)} stroke="rgba(43,41,39,0.22)" strokeWidth="0.6" />;
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(255,255,255,0.45)" stroke="rgba(43,41,39,0.08)" strokeWidth="2.4" />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={toneFor(target)}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={Math.round(c * 100) / 100}
            strokeDashoffset={Math.round((c - (c * v) / 100) * 100) / 100}
            style={{ transition: "stroke-dashoffset 1.2s var(--ds-ease), stroke 0.6s" }}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif leading-none" style={{ fontSize: size * 0.36 }}>
          {value === null ? "–" : <CountUp value={target} duration={1200} />}
        </span>
        {label && size >= 52 && <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ds-ink-3">{label}</span>}
      </span>
    </div>
  );
}

/** A quiet glass field that sends a URL straight into Page Audit. */
export function QuickAudit() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) router.push(`/tools/page-audit?url=${encodeURIComponent(url.trim())}&run=1`);
      }}
      className="glass flex h-14 w-full max-w-[420px] items-center gap-2 rounded-[18px] pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-ds-accent/60"
    >
      <IconLoupe className="h-[18px] w-[18px] shrink-0 text-ds-ink-2" />
      <label htmlFor="quick-audit" className="sr-only">
        Page to audit
      </label>
      <input id="quick-audit" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Audit a page… client.com/services" inputMode="url" spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ds-ink-3" />
      <button type="submit" disabled={!url.trim()} className="h-11 shrink-0 rounded-[14px] bg-ds-accent px-4 text-[14px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)] active:translate-y-px disabled:opacity-50">
        Audit
      </button>
    </form>
  );
}

/** Arched window: a painting seen through a rounded-top glass frame with mullions. */
export function ArchWindow({ children, src = "/art/landscape.webp", className = "" }: { children?: React.ReactNode; src?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-b-[24px] rounded-t-[999px] border border-white/80 shadow-[inset_0_1px_0_#fff,0_30px_60px_-36px_rgba(43,41,39,0.5)] ${className}`}>
      <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-[2s] ease-[var(--ds-ease)] group-hover:scale-110" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_35%,rgba(43,51,34,0.55))]" />
      {/* mullions */}
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/55 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
      <span aria-hidden className="absolute inset-x-0 top-[44%] h-[3px] bg-white/55 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
      <span aria-hidden className="absolute -left-10 top-0 h-full w-24 rotate-12 bg-white/20 blur-md" />
      <div className="relative flex h-full flex-col justify-end p-6 text-white">{children}</div>
    </div>
  );
}
