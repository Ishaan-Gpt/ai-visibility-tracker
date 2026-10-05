"use client";

import { useEffect, useState } from "react";

/* eslint-disable @next/next/no-img-element -- decorative, fixed-position art */

/**
 * The studio sits under an open sky that follows the visitor's own hour:
 * dawn apricot, clear day, rose dusk, or a hushed lavender night. Purely decorative.
 */
const MOODS = {
  dawn: "radial-gradient(120% 80% at 80% 0%, rgba(253,214,186,.55), transparent 60%), radial-gradient(90% 70% at 0% 100%, rgba(242,169,127,.25), transparent 60%)",
  day: "radial-gradient(120% 80% at 70% 0%, rgba(214,226,232,.55), transparent 60%), radial-gradient(90% 70% at 10% 100%, rgba(249,224,207,.3), transparent 60%)",
  dusk: "radial-gradient(120% 80% at 85% 10%, rgba(240,178,160,.5), transparent 60%), radial-gradient(100% 80% at 0% 100%, rgba(214,190,214,.35), transparent 60%)",
  night: "radial-gradient(120% 80% at 70% 0%, rgba(190,196,220,.55), transparent 60%), radial-gradient(90% 70% at 0% 100%, rgba(226,206,214,.35), transparent 60%)",
} as const;

export type Mood = keyof typeof MOODS;

export function moodForHour(h: number): Mood {
  if (h >= 5 && h < 10) return "dawn";
  if (h >= 10 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

export function Backdrop() {
  const [mood, setMood] = useState<Mood | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setMood(moodForHour(new Date().getHours())), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ds-canvas" data-print-hide>
      <img src="/art/sky-hero.webp" alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80 blur-[18px]" />
      <div className="absolute inset-0 transition-opacity duration-[1500ms]" style={{ background: mood ? MOODS[mood] : "none", opacity: mood ? 1 : 0 }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(242,239,229,.15),rgba(242,239,229,.55))]" />
      <img src="/art/foliage-c.webp" alt="" className="absolute -right-24 -top-24 w-[280px] rotate-[200deg] opacity-[0.22] blur-[2px] max-md:hidden" />
    </div>
  );
}
