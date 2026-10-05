"use client";

import { Backdrop } from "@/components/studio/Backdrop";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Backdrop />
      <div className="glass-strong relative z-10 max-w-md rounded-[26px] p-8 text-center">
        <svg viewBox="0 0 64 64" className="mx-auto h-14 w-14" aria-hidden>
          <path d="M14 40c-6 0-10-4-10-9 0-5 4-9 9-9 1-7 7-12 14-12 6 0 11 4 13 9 1 0 2-1 4-1 6 0 10 5 10 11 0 6-4 11-10 11z" fill="#faf8f2" stroke="#2b2927" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M24 48l-3 7M33 48l-3 7M42 48l-3 7" stroke="#f2a97f" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h2 className="mt-4 font-serif text-[34px] leading-none">
          A passing <span className="italic">cloud</span>
        </h2>
        <p className="mt-3 text-[14.5px] text-ds-ink-2">{error.message || "Something went wrong. Please try again."}</p>
        <button onClick={reset} className="mt-6 h-11 rounded-[12px] bg-ds-accent px-5 text-[14.5px] font-medium text-ds-ink transition hover:bg-[var(--ds-accent-hover)]">
          Try again
        </button>
      </div>
    </div>
  );
}
