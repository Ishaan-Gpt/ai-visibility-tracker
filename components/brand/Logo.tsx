import type { SVGProps } from "react";

/**
 * seowise mark: a reading loupe drawn as an engraver's line — lens, handle and three short "rays"
 * the way a lens catches light. Sits next to the serif-italic wordmark like a monogram.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="6.6" />
      <path d="M8.9 10.2c.5-1.3 1.6-2.2 3-2.5" strokeWidth="1.2" />
      <path d="m17 17 6.2 6.2" strokeWidth="2.2" />
      <path d="M12 2.2v1.8M3.8 6.1l1.3 1.2M20.2 6.1l-1.3 1.2" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({ className = "", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${inverted ? "text-[#faf8f2]" : "text-ds-ink"} ${className}`}>
      <LogoMark className="h-[22px] w-[22px]" />
      <span className="font-serif text-[27px] italic leading-none tracking-[-0.02em]">seowise</span>
    </span>
  );
}
