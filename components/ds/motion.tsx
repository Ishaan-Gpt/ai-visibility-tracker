"use client";

import { Fragment, useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts content in once when it scrolls into view. No-ops under prefers-reduced-motion. */
export function Reveal({ children, delay = 0, y = 18, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** "Get the {fixes first}." → words flagged as accent while inside braces. */
function parseAccentWords(text: string): { w: string; accent: boolean }[] {
  return text.split(" ").reduce<{ out: { w: string; accent: boolean }[]; on: boolean }>(
    (acc, raw) => {
      const on = acc.on || raw.startsWith("{");
      acc.out.push({ w: raw.replace(/[{}]/g, ""), accent: on });
      return { out: acc.out, on: on && !raw.includes("}") };
    },
    { out: [], on: false },
  ).out;
}

/** Masked word-by-word rise for headlines. Words wrapped in {braces} render in the calligraphic accent. */
export function SplitReveal({ text, className, delay = 0, as = "h1" }: { text: string; className?: string; delay?: number; as?: "h1" | "h2" | "p" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = parseAccentWords(text);
  return (
    <Tag className={className} aria-label={text.replace(/[{}]/g, "")}>
      {words.map(({ w, accent }, i) => {
        return (
          <Fragment key={i}>
            <span aria-hidden className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span
                className={`inline-block ${accent ? "accent-word pr-[0.04em]" : ""}`}
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, delay: delay + i * 0.055, ease: EASE }}
              >
                {w}
              </motion.span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </Tag>
  );
}

/** Pulls its child toward the cursor with a spring. Pointer-fine devices only, by nature of mousemove. */
export function Magnetic({ children, strength = 0.3, className }: { children: ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  function move(e: MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  return (
    <motion.span
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className ?? ""}`}
    >
      {children}
    </motion.span>
  );
}
