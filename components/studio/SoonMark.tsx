/** A small hand-drawn hourglass, used wherever something is marked as coming soon. */
export function SoonMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`text-ds-ink ${className}`}>
      <path d="M13.5 9.5c0 6 13 6.5 13 11s-13 5-13 11" className="fill-[var(--duo,#f2a97f)]/60 stroke-none" />
      <path d="M11 7.5h18M11 32.5h18" />
      <path d="M13 7.5c0 7 6 8.5 6.9 12.5.9-4 6.9-5.5 6.9-12.5M13 32.5c0-7 6-8.5 6.9-12.5.9 4 6.9 5.5 6.9 12.5" />
      <path d="M17 30.5c1-1.6 2-2.3 2.9-2.3s1.9.7 2.9 2.3" />
    </svg>
  );
}
