import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* OMNI SEO design-system primitives — see DESIGN-SYSTEM.md. Server-safe (no hooks). */

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1120px] px-4 sm:px-6", className)} {...props} />;
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-16 md:py-24", className)} {...props} />;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ds-md text-[16px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ds-canvas disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ds-btn text-[#f7f7f7] hover:bg-black",
  secondary: "border border-ds-line bg-ds-surface text-ds-ink hover:bg-ds-muted",
  ghost: "text-ds-ink hover:bg-ds-muted",
  accent: "bg-ds-accent text-white hover:bg-[var(--ds-accent-hover)]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "lg" = "md") {
  return cn(buttonBase, buttonVariants[variant], size === "lg" ? "h-12 px-8" : "h-10 px-5");
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "md" | "lg" }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function Pill({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full bg-ds-muted px-4 text-[14px] text-ds-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-ds-lg border border-ds-line bg-ds-surface p-6", className)}
      {...props}
    />
  );
}

export function StatTile({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl bg-ds-muted px-4 py-5 text-center", className)}>
      <div className="text-[28px] font-medium leading-8 tracking-[-0.02em] text-ds-ink">{value}</div>
      <div className="mt-1 text-[14px] text-ds-ink-2">{label}</div>
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-[680px] text-center", className)}>
      <h2 className="text-[28px] font-normal leading-8 tracking-[-0.02em] text-ds-ink md:text-[36px] md:leading-10">
        {title}
      </h2>
      {description && <p className="mt-4 text-[18px] leading-7 text-ds-ink-2">{description}</p>}
    </div>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-ds-accent">{children}</span>;
}
