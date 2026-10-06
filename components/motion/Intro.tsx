"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";

/* eslint-disable @next/next/no-img-element -- decorative art */

/*
 * "The lens opens": the loupe draws itself, fills with painted sky, then its glass widens until the
 * page is seen through it. Once per session; skipped entirely for reduced motion (see the inline script
 * in the root layout, which hides it before first paint).
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const LENS = { cx: 50, cy: 46 }; // % of viewport, where the lens centre sits

export function Intro() {
  const [done, setDone] = useState(false);
  const hole = useMotionValue(0); // radius of the reveal, in vmax
  const mask = useMotionTemplate`radial-gradient(circle at ${LENS.cx}% ${LENS.cy}%, transparent ${hole}vmax, #000 calc(${hole}vmax + 1px))`;

  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") {
      const id = setTimeout(() => setDone(true), 0);
      return () => clearTimeout(id);
    }
    document.documentElement.style.overflow = "hidden";
    const controls = animate(hole, 160, { delay: 1.75, duration: 1.1, ease: [0.65, 0, 0.35, 1] });
    const end = setTimeout(() => {
      try {
        sessionStorage.setItem("sw-intro", "1");
      } catch {}
      document.documentElement.dataset.intro = "done";
      document.documentElement.style.overflow = "";
      setDone(true);
    }, 2900);
    return () => {
      controls.stop();
      clearTimeout(end);
      document.documentElement.style.overflow = "";
    };
  }, [hole]);

  if (done) return null;

  return (
    <motion.div
      aria-hidden
      className="sw-intro fixed inset-0 z-[100] bg-ds-canvas"
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <div className="absolute" style={{ left: `${LENS.cx}%`, top: `${LENS.cy}%`, transform: "translate(-50%, -50%)" }}>
        <div className="relative h-[180px] w-[180px]">
          {/* sky inside the lens */}
          <motion.div
            className="absolute left-[30px] top-[30px] h-[120px] w-[120px] overflow-hidden rounded-full"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.95, duration: 0.8, ease: EASE }}
          >
            <img src="/art/sky-hero.webp" alt="" className="h-full w-full scale-150 object-cover" />
          </motion.div>
          <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full text-ds-ink" fill="none" stroke="currentColor" strokeLinecap="round">
            <motion.circle cx="90" cy="90" r="60" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE }} />
            <motion.path d="M134 134 L160 160" strokeWidth="7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.4, ease: EASE }} />
            <motion.path d="M66 76c4-11 13-18 24-20" strokeWidth="2.4" stroke="#faf8f2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 1.2, duration: 0.5, ease: EASE }} />
            {[
              "M90 14v10",
              "M36 36l7 7",
              "M144 36l-7 7",
            ].map((d, i) => (
              <motion.path key={d} d={d} strokeWidth="2.2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.75 + i * 0.08, duration: 0.3 }} />
            ))}
          </svg>
        </div>
        <motion.p
          className="mt-4 text-center font-serif text-[40px] italic leading-none text-ds-ink"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
        >
          seowise
        </motion.p>
      </div>
    </motion.div>
  );
}
