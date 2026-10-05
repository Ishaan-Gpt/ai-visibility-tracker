import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* seowise design-system primitives. Server-safe (no hooks). */

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-20 md:py-28", className)} {...props} />;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "signal" | "outline-dark" | "cream";

const buttonBase =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-[var(--ds-ease)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-canvas disabled:pointer-events-none disabled:opacity-45";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ds-accent text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-14px_rgba(165,85,45,0.8)] hover:bg-[var(--ds-accent-hover)]",
  secondary: "glass-inset text-ds-ink hover:bg-white/75",
  ghost: "text-ds-ink hover:bg-white/50",
  accent: "bg-ds-accent text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-[var(--ds-accent-hover)]",
  signal: "bg-ds-accent text-ds-night hover:bg-[var(--ds-accent-hover)]",
  "outline-dark": "border border-white/20 text-[#fffcf6] hover:bg-white/10",
  cream: "bg-[#fffcf6] text-ds-night hover:bg-white",
};

const sizes = { sm: "h-9 px-4 text-[14px]", md: "h-11 px-5 text-[15px]", lg: "h-13 px-7 text-[16px]" } as const;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof sizes = "md") {
  return cn(buttonBase, buttonVariants[variant], sizes[size]);
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function Pill({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex h-7 items-center gap-2 rounded-full border border-ds-line bg-ds-surface px-3 text-[13px] text-ds-ink-2", className)}
      {...props}
    />
  );
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ds-ink-2", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-ds-accent" />
      {children}
    </span>
  );
}

/** Frosted glass pane. The whole tool UI is built from these over the painted sky. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass rounded-[22px] p-6", className)} {...props} />;
}

export function StatTile({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("glass-inset flex flex-col justify-center rounded-[16px] px-4 py-4", className)}>
      <div className="font-serif text-[32px] leading-8 text-ds-ink tabular-nums">{value}</div>
      <div className="mt-0.5 text-[13px] text-ds-ink-2">{label}</div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-[760px] text-center" : "max-w-[640px]", className)}>
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <h2 className="text-balance text-[36px] font-medium leading-[1.02] tracking-[-0.045em] text-ds-ink sm:text-[48px] md:text-[56px]">{title}</h2>
      {description && <p className="mt-5 text-pretty text-[17px] leading-7 text-ds-ink-2 md:text-[18px]">{description}</p>}
    </div>
  );
}

export function Accent({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("accent-word", className)}>{children}</span>;
}

export const inputClass =
  "glass-inset h-12 w-full rounded-[12px] px-4 text-[16px] text-ds-ink outline-none transition-[box-shadow,background-color] duration-300 placeholder:text-ds-ink-3 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(242,169,127,0.35)]";
