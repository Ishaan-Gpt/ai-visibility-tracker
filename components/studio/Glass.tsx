import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Glass({ strong, className, ...props }: ComponentProps<"div"> & { strong?: boolean }) {
  return <div className={cn(strong ? "glass-strong" : "glass", "rounded-[24px]", className)} {...props} />;
}

/** Small mono label, used as a section eyebrow inside glass panes. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[11px] uppercase tracking-[0.16em] text-ds-ink-2", className)}>{children}</p>;
}

/** Page masthead: crumb, big serif title with an italic turn, optional actions. */
export function Masthead({ crumb, title, italic, lede, actions }: { crumb: string; title: ReactNode; italic?: ReactNode; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
      <div className="min-w-0">
        <Kicker>
          Studio <span className="mx-1.5 text-ds-ink-3">/</span> {crumb}
        </Kicker>
        <h1 className="mt-3 text-balance font-serif text-[42px] leading-[1] tracking-[-0.025em] text-ds-ink sm:text-[58px]">
          {title} {italic && <span className="italic">{italic}</span>}
        </h1>
        {lede && <p className="mt-3 max-w-[560px] text-[15.5px] leading-6 text-ds-ink-2">{lede}</p>}
      </div>
      {actions}
    </header>
  );
}
