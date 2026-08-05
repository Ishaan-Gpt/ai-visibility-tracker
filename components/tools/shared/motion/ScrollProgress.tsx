"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin top progress bar reflecting document scroll position. Framer Motion's
 * useScroll already tracks the smoothed (Lenis-driven) scroll position since
 * Lenis dispatches native scroll events under the hood.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 40, mass: 0.2 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-primary"
    />
  );
}
