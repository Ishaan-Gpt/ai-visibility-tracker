"use client";

import { useState } from "react";
import { IcCheck as Check } from "@/components/icons/Studio";
import { IconSpinner as Loader2 } from "@/components/icons/Icons";

const PRO_PERKS = ["Up to 12× higher daily limits on every fetch tool", "Full saved history of every report", "AI Visibility: 10 prompts, 2 competitors, checked daily"];

export function UpgradeCard({ isPaid, billingConfigured }: { isPaid: boolean; billingConfigured: boolean }) {
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

  if (isPaid) {
    return (
      <div className="flex items-center gap-4 rounded-ds-xl border border-ds-line bg-ds-surface p-6 shadow-ds-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ds-success/10">
          <Check className="h-5 w-5 text-ds-success" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-[17px] font-medium tracking-[-0.02em]">Pro is active</p>
          <p className="text-[14px] text-ds-ink-2">Thanks for supporting seowise. To change or cancel, reply to any billing email or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grain relative overflow-hidden rounded-ds-xl bg-ds-night p-6 text-[#fffcf6] sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-ds-accent/30 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[26px] font-medium leading-tight tracking-[-0.04em]">
            seowise <span className="accent-word text-ds-accent">Pro</span>
          </p>
          <ul className="mt-4 space-y-2">
            {PRO_PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-white/75">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-ds-accent" strokeWidth={3} /> {p}
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="mt-3 text-[14px] text-[#ffb08a]">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            onClick={upgrade}
            disabled={loading || !billingConfigured}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ds-accent px-7 text-[15px] font-medium text-ds-night transition hover:bg-[var(--ds-accent-hover)] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {billingConfigured ? "Upgrade to Pro" : "Coming soon"}
          </button>
          {!billingConfigured && <p className="text-[12px] text-white/45">Pricing is being finalised. Free limits apply until then.</p>}
        </div>
      </div>
    </div>
  );
}
