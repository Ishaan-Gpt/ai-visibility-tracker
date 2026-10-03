"use client";

import { useState } from "react";
import { Check, Loader2, Zap } from "lucide-react";
import { Card, buttonClass } from "@/components/ds/primitives";

const PRO_PERKS = ["10 tracked prompts and 2 competitors", "Daily AI-visibility refresh", "Higher daily limits on every tool"];

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
      <Card className="flex items-center gap-3 p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ds-success/10">
          <Check className="h-5 w-5 text-ds-success" />
        </span>
        <div>
          <p className="text-[16px] font-medium text-ds-ink">You are on the Pro plan</p>
          <p className="text-[14px] text-ds-ink-2">Thanks for supporting OMNI SEO. To change or cancel, contact support.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[16px] font-medium text-ds-ink">
          <Zap className="h-4 w-4 text-ds-accent" /> Upgrade to Pro
        </div>
        <ul className="mt-2 space-y-1">
          {PRO_PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[14px] text-ds-ink-2">
              <Check className="h-3.5 w-3.5 text-ds-success" /> {p}
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="mt-2 text-[14px] text-ds-danger">{error}</p>}
      </div>
      <button
        type="button"
        onClick={upgrade}
        disabled={loading || !billingConfigured}
        className={buttonClass("accent", "lg")}
        title={billingConfigured ? undefined : "Billing is not configured yet"}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {billingConfigured ? "Upgrade" : "Coming soon"}
      </button>
    </Card>
  );
}
