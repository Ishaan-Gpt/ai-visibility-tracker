import { type ReactNode } from "react";

type GlassCardProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Canonical glass primitive: bg-white/70 + backdrop-blur is the sanctioned
 * substitute for grey section backgrounds per the brand's no-grey-bg rule.
 */
export function GlassCard({ className = "", children }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-foreground/10 bg-background/70 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}
