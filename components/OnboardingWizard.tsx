"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrow } from "@/components/icons/Icons";
import { useFormStatus } from "react-dom";
import { createBrand } from "@/app/app/onboarding/actions";
const inputClass =
  "glass-inset h-12 w-full rounded-[12px] px-4 text-[15.5px] text-ds-ink outline-none transition-[box-shadow,background-color] duration-300 placeholder:text-ds-ink-3 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(242,169,127,0.35)]";

const EASE = [0.22, 1, 0.36, 1] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-ds-accent px-7 text-[15px] font-medium text-ds-night transition hover:bg-[var(--ds-accent-hover)] active:scale-[0.97] disabled:opacity-60"
    >
      {pending ? "Setting up…" : "Start tracking"} <IconArrow className="h-4 w-4" />
    </button>
  );
}

export default function OnboardingWizard({ maxPrompts, defaultDomain = "" }: { maxPrompts: number; defaultDomain?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState(defaultDomain);
  const canContinue = name.trim().length > 0 && domain.trim().length > 3;

  return (
    <form action={createBrand} className="space-y-8">
      <div className="flex items-center gap-3 text-[13px] text-ds-ink-2">
        <span className="font-mono">Step {step} of 2</span>
        <div className="flex flex-1 gap-1.5">
          {[1, 2].map((s) => (
            <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-ds-muted">
              <motion.div className="h-full bg-ds-accent" initial={false} animate={{ width: s <= step ? "100%" : "0%" }} transition={{ duration: 0.5, ease: EASE }} />
            </div>
          ))}
        </div>
      </div>

      {/* Both steps stay mounted so every field is submitted with the form. */}
      <div className={step === 1 ? "space-y-6" : "hidden"}>
        <div>
          <h1 className="font-serif text-[40px] leading-[1.02] tracking-[-0.02em]">
            Which <span className="italic">brand</span> should we track?
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-ds-ink-2">We ask Gemini, with live Google Search grounding, whether this brand shows up for the prompts you care about.</p>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">Brand name</span>
            <input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Dental" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">Domain</span>
            <input name="domain" required value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acmedental.com" className={`${inputClass} font-mono text-[15px]`} />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep(2)}
            className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-ds-ink px-7 text-[15px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] active:scale-[0.97] disabled:opacity-40"
          >
            Continue <IconArrow className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={step === 2 ? "space-y-6" : "hidden"}>
        <AnimatePresence>
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}>
              <h1 className="font-serif text-[40px] leading-[1.02] tracking-[-0.02em]">
                What would a customer <span className="italic">ask</span>?
              </h1>
              <p className="mt-2 text-[15px] leading-6 text-ds-ink-2">Up to {maxPrompts} prompts on your plan, plus one competitor to compare against.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-3">
          {Array.from({ length: maxPrompts }).map((_, i) => (
            <input
              key={i}
              name="prompts"
              placeholder={["best dentist for kids near me", "how much does teeth whitening cost", "invisalign vs braces for adults"][i] ?? "Another prompt"}
              className={inputClass}
            />
          ))}
        </div>
        <div className="glass-inset rounded-[16px] p-4">
          <p className="text-[13px] font-medium text-ds-ink-2">Competitor (optional)</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input name="competitorName" placeholder="Competitor name" className={inputClass} />
            <input name="competitorDomain" placeholder="competitor.com" className={`${inputClass} font-mono text-[15px]`} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-[14px] text-ds-ink-2 hover:text-ds-ink">
            <IconArrow className="h-4 w-4 rotate-180" /> Back
          </button>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
