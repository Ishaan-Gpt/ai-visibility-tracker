import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/* Vestris-style controls: soft-cornered rectangles, Geist medium, quiet hover lift. */

const btn =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 h-11 text-[15px] font-medium tracking-[-0.01em] transition-[background-color,transform,box-shadow] duration-300 ease-[var(--ds-ease)] active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-accent-ink disabled:opacity-50";

export const btnPrimary = cn(btn, "bg-ds-accent text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(43,41,39,0.12)] hover:bg-[var(--ds-accent-hover)] hover:-translate-y-[1px]");
export const btnSecondary = cn(btn, "bg-[#e9e3d5] text-ds-ink hover:bg-[#e2dbcb] hover:-translate-y-[1px]");
export const btnGlass = cn(btn, "bg-[#faf8f2]/80 text-ds-ink backdrop-blur hover:bg-[#faf8f2]");

export function BtnLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "glass" }) {
  const v = variant === "primary" ? btnPrimary : variant === "secondary" ? btnSecondary : btnGlass;
  return <Link className={cn(v, className)} {...props} />;
}

/** Instrument Serif display heading. Second line italic, as on the reference. */
export function Display({ top, bottom, className, as: Tag = "h2" }: { top: React.ReactNode; bottom?: React.ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <Tag className={cn("font-serif text-[46px] leading-[1.02] tracking-[-0.025em] text-ds-ink sm:text-[64px] lg:text-[76px]", className)}>
      <span className="block">{top}</span>
      {bottom && <span className="block italic">{bottom}</span>}
    </Tag>
  );
}

export function Lede({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mx-auto max-w-[520px] text-pretty text-[17px] leading-[1.55] text-ds-ink-2", className)} {...props} />;
}
