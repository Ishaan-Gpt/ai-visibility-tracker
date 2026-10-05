"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconAlert, IconArrow, IconCheckCircle, IconSpinner } from "@/components/icons/Icons";
import { LogoMark } from "@/components/brand/Logo";
import { Logo } from "@/components/brand/Logo";

export interface QuotaInfo {
  tier: "anon" | "free" | "pro";
  limit: number;
  used: number;
  remaining: number;
}

/** Honest "x of y left today" line, with the next step when it runs low. */
export function QuotaNote({ quota, noun = "runs" }: { quota: QuotaInfo | null; noun?: string }) {
  const pathname = usePathname();
  if (!quota) return null;
  const low = quota.remaining <= 1;
  return (
    <p className="no-print flex flex-wrap items-center gap-x-1.5 pl-3 text-[13px] text-ds-ink-2" data-print-hide>
      <span className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: Math.min(quota.limit, 10) }, (_, i) => (
          <span key={i} className={`h-2.5 w-1.5 rounded-full ${i < Math.round((quota.remaining / quota.limit) * Math.min(quota.limit, 10)) ? "bg-ds-accent" : "bg-ds-ink/12"}`} />
        ))}
      </span>
      <span className="font-serif text-[16px] tabular-nums text-ds-ink">{quota.remaining}</span> of {quota.limit} {noun} left today
      {quota.tier === "anon" && (
        <>
          {" · "}
          <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className={`underline underline-offset-2 ${low ? "font-medium text-ds-accent-ink" : "hover:text-ds-ink"}`}>
            free account for more
          </Link>
        </>
      )}
      {quota.tier === "free" && low && (
        <>
          {" · "}
          <Link href="/app/billing" className="font-medium text-ds-accent-ink underline underline-offset-2">
            Pro raises limits
          </Link>
        </>
      )}
    </p>
  );
}

export function ErrorNote({ message, limited }: { message: string; limited?: boolean }) {
  const pathname = usePathname();
  return (
    <div role="alert" className="glass flex items-start gap-3 rounded-[18px] border-[#c92a2a]/20 p-4 text-[15px] text-ds-ink">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f6d5cc]/80 text-[#b23a2a]">
        <IconAlert className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="pt-1">{message}</p>
        {limited && /account/.test(message) && (
          <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className="mt-2 inline-flex items-center gap-1 font-medium text-ds-accent-ink hover:underline">
            Create a free account <IconArrow className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Branded header that only appears in the exported PDF. */
export function PrintHeader({ title, subject, when }: { title: string; subject: string; when?: number }) {
  return (
    <div className="print-only mb-6 border-b border-black/15 pb-4">
      <div className="flex items-center justify-between">
        <Logo />
        {when && <span className="text-[11px] text-black/60">{new Date(when).toLocaleString()}</span>}
      </div>
      <h1 className="mt-4 font-serif text-[30px] leading-none">{title}</h1>
      <p className="break-all text-[12px] text-black/70">{subject}</p>
    </div>
  );
}

export function PrintFooter() {
  return (
    <p className="print-only mt-8 border-t border-black/15 pt-3 text-[10px] text-black/55">
      Generated with seowise. Results reflect the page as fetched at the time shown; speed is measured from our server, not a lab test.
    </p>
  );
}

/** "seowise working" checklist shown while a fetch-based tool runs. Stages advance on a timer; cosmetic pacing only. */
export function RunningStages({ stages, step }: { stages: string[]; step: number }) {
  return (
    <div aria-live="polite">
      <p className="mb-3 flex items-center gap-1.5 text-[13px] text-ds-ink-2">
        <LogoMark className="h-4 w-4" /> seowise working
      </p>
      <ol className="space-y-2">
        {stages.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <li key={s} className={`flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14.5px] transition-all duration-500 ${state === "done" ? "bg-[#ece7da]/80" : state === "active" ? "glass-inset" : "bg-white/25"}`}>
              {state === "done" && <IconCheckCircle className="h-4 w-4 text-[#5c7c68]" />}
              {state === "active" && <IconSpinner className="h-4 w-4 animate-spin text-ds-ink-2" />}
              {state === "todo" && <span className="mx-[3px] h-2.5 w-2.5 rounded-full border border-dashed border-ds-ink-3" />}
              <span className={`flex-1 ${state === "todo" ? "text-ds-ink-3" : "text-ds-ink"}`}>{s}</span>
              <span className="text-[11.5px] text-ds-ink-3">{state === "done" ? "Done" : state === "active" ? "In process" : "Up next"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
