import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ds-ink-3">{eyebrow}</p>}
        <h1 className="text-balance text-[34px] font-medium leading-[1.02] tracking-[-0.045em] text-ds-ink sm:text-[44px]">{title}</h1>
        {description && <p className="mt-3 max-w-[620px] text-[16px] leading-6 text-ds-ink-2">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
