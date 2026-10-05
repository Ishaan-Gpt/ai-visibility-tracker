/*
 * Painted artwork, pre-rendered to /public/art by scripts/render-art.mjs (procedural gouache).
 * Every file can be swapped for a real painting with the same name and aspect ratio; nothing else changes.
 */

/* eslint-disable @next/next/no-img-element -- decorative art, sized by CSS, fine as plain img */

type Sky = "hero" | "cards" | "closing" | "step-1" | "step-2" | "step-3" | "step-4";

export function PaintedSky({ name, className = "", priority = false }: { name: Sky; className?: string; priority?: boolean }) {
  return (
    <img
      src={`/art/sky-${name}.webp`}
      alt=""
      aria-hidden
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={`absolute inset-0 h-full w-full select-none object-cover ${className}`}
    />
  );
}

export function PaintedFoliage({ variant = "a", side = "left", className = "", priority = false }: { variant?: "a" | "b" | "c"; side?: "left" | "right"; className?: string; priority?: boolean }) {
  return (
    <img
      src={`/art/foliage-${variant}.webp`}
      alt=""
      aria-hidden
      width={720}
      height={2000}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      className={`pointer-events-none h-auto w-full select-none ${side === "right" ? "-scale-x-100" : ""} ${className}`}
    />
  );
}

export function PaintedLandscape({ className = "" }: { className?: string }) {
  return <img src="/art/landscape.webp" alt="" aria-hidden loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full select-none object-cover object-bottom ${className}`} />;
}

/** Halftone dot texture, as in printed matter. Use over skies. */
export function Halftone({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1.3px)",
        backgroundSize: "9px 9px",
        maskImage: "radial-gradient(ellipse 45% 60% at 12% 35%, #000 0%, transparent 70%), radial-gradient(ellipse 40% 55% at 92% 65%, #000 0%, transparent 70%)",
      }}
    />
  );
}
