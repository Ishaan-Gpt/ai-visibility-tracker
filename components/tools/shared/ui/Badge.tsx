import { type ReactNode } from "react";

type BadgeProps = {
  tone?: "primary" | "ink" | "outline";
  children: ReactNode;
  className?: string;
};

export function Badge({ tone = "outline", children, className = "" }: BadgeProps) {
  const toneClasses =
    tone === "primary"
      ? "bg-primary text-white"
      : tone === "ink"
        ? "bg-foreground text-background"
        : "bg-transparent text-foreground border border-foreground/15";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${toneClasses} ${className}`}
    >
      {children}
    </span>
  );
}
