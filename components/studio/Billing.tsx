"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IcCheck } from "@/components/icons/Studio";
import { IconSpinner } from "@/components/icons/Icons";
import { Glass, Kicker, Masthead } from "@/components/studio/Glass";
import { Rise } from "@/components/studio/Views";

const PERKS = ["Up to 12× higher daily limits on every fetch tool", "Full saved history of every report", "AI Visibility: 10 prompts, 2 competitors, checked daily"];

function Ticket({ isPaid, billingConfigured }: { isPaid: boolean; billingConfigured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <motion.div whileHover="tear" initial="rest" className="relative">
      <div className="glass-strong ticket-mask relative grid overflow-hidden rounded-[26px] sm:grid-cols-[1fr_200px]">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.45),transparent)]" />
        <div className="relative p-7 sm:p-9">
          <Kicker>{isPaid ? "Your pass" : "Admit one"}</Kicker>
          <p className="mt-3 font-serif text-[46px] leading-none">
            seowise <span className="italic">Pro</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-ds-ink">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ds-accent/70">
                  <IcCheck className="h-3.5 w-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="mt-4 text-[14px] text-[#c92a2a]">
              {error}
            </p>
          )}
        </div>

        {/* stub */}
        <motion.div
          variants={{ rest: { rotate: 0, x: 0 }, tear: { rotate: isPaid ? 0 : 2.5, x: isPaid ? 0 : 6 } }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{ transformOrigin: "0% 100%" }}
          className="relative flex flex-col items-center justify-center gap-4 border-t border-dashed border-ds-ink/20 p-7 sm:border-l sm:border-t-0"
        >
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-ds-ink-3 [writing-mode:vertical-rl] sm:block">No. 0001</span>
          {isPaid ? (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5c7c68]/15 text-[#5c7c68]">
                <IcCheck className="h-7 w-7" />
              </span>
              <p className="font-serif text-[26px] italic">Active</p>
            </>
          ) : (
            <>
              <p className="font-serif text-[44px] italic leading-none">Soon</p>
              <button
                type="button"
                onClick={upgrade}
                disabled={loading || !billingConfigured}
                className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ds-accent px-5 text-[14.5px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <IconSpinner className="h-4 w-4 animate-spin" />}
                {billingConfigured ? "Upgrade" : "Coming soon"}
              </button>
              {!billingConfigured && <p className="text-center text-[11.5px] leading-4 text-ds-ink-3">Pricing is being finalised</p>}
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function BillingView({
  isPaid,
  billingConfigured,
  billingStatus,
  rows,
}: {
  isPaid: boolean;
  billingConfigured: boolean;
  billingStatus: string | null;
  rows: { label: string; free: string; pro: string }[];
}) {
  return (
    <>
      <Masthead
        crumb="Plan & billing"
        title="You're on"
        italic={isPaid ? "Pro." : "Free."}
        lede={isPaid ? `Subscription status: ${billingStatus ?? "active"}.` : "Pro raises every limit and keeps the full history of your reports."}
      />
      <Rise>
        <Ticket isPaid={isPaid} billingConfigured={billingConfigured} />
      </Rise>
      <Rise i={2} className="mt-8">
        <Glass className="overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] px-6 py-4 text-[13px] text-ds-ink-2">
            <span>Compare</span>
            <span className={isPaid ? "" : "font-medium text-ds-ink"}>Free{!isPaid && " · yours"}</span>
            <span className={isPaid ? "font-medium text-ds-ink" : ""}>Pro{isPaid && " · yours"}</span>
          </div>
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[1.5fr_1fr_1fr] items-center border-t border-white/60 px-6 py-3.5 text-[14px]">
              <span className="text-ds-ink-2">{r.label}</span>
              <span className="font-serif text-[19px] tabular-nums">{r.free}</span>
              <span className="font-serif text-[19px] tabular-nums">{r.pro}</span>
            </div>
          ))}
        </Glass>
        <p className="mt-4 text-[12.5px] text-ds-ink-3">Payments are handled by Razorpay. We never see or store card details.</p>
      </Rise>
    </>
  );
}
