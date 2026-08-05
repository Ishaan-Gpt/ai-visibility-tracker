"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";

type MagneticButtonProps = {
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "ink" | "ghost";
  children: ReactNode;
  className?: string;
};

const toneClasses = {
  primary: "bg-primary text-white",
  ink: "bg-foreground text-background",
  ghost: "bg-transparent text-foreground border border-foreground/15",
};

/** Cursor-follow CTA — a component-level interaction, so this is Framer Motion's territory, not GSAP's. */
export function MagneticButton({ href, onClick, tone = "primary", children, className = "" }: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.3 });

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.35);
    y.set(relY * 0.45);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const content = (
    <motion.span
      ref={ref as React.RefObject<HTMLSpanElement>}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-primary-hover ${toneClasses[tone]} ${className}`}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-block">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} type="button" className="inline-block">
      {content}
    </button>
  );
}
