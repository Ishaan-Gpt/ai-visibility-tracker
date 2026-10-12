"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrow, IconSpark, IconSpinner } from "@/components/icons/Icons";
import { useFormStatus } from "react-dom";
import { createBrand, suggestOnboardingPrompts } from "@/app/app/onboarding/actions";
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
  const [category, setCategory] = useState("");
  const [prompts, setPrompts] = useState<string[]>(() => Array.from({ length: maxPrompts }, () => ""));
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const canContinue = name.trim().length > 0 && domain.trim().length > 3;

  // Fills the empty prompt fields with drafted customer questions; anything typed is kept.
  const suggest = async () => {
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await suggestOnboardingPrompts({ name, domain, category });
      if (!res.ok) {
        setSuggestError(res.error);
        return;
      }
      if (!category && res.category) setCategory(res.category);
      const queue = res.prompts.map((p) => p.text).filter((t) => !prompts.includes(t));
      setPrompts((cur) => cur.map((v) => (v.trim() ? v : (queue.shift() ?? ""))));
    } catch {
      setSuggestError("Couldn't draft prompts right now. Write your own, or try again.");
    } finally {
      setSuggesting(false);
    }
  };

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
          <p className="mt-2 text-[15px] leading-6 text-ds-ink-2">We ask AI engines, with live web search, whether this brand shows up for the prompts you care about. The first check runs as soon as you finish.</p>
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
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">What you do (optional)</span>
            <input name="category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} placeholder="family dental clinic in Austin" className={inputClass} />
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
              <p className="mt-2 text-[15px] leading-6 text-ds-ink-2">Up to {maxPrompts} prompts on your plan, plus one competitor to compare against. Questions that don&apos;t name you show real visibility.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-3">
          {prompts.map((value, i) => (
            <input
              key={i}
              name="prompts"
              value={value}
              maxLength={300}
              onChange={(e) => setPrompts((cur) => cur.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={["best dentist for kids near me", "how much does teeth whitening cost", "invisalign vs braces for adults"][i] ?? "Another prompt"}
              className={inputClass}
            />
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={suggest}
              disabled={suggesting || !canContinue || prompts.every((p) => p.trim())}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] px-3 text-[14px] font-medium text-ds-ink-2 transition hover:bg-white/60 hover:text-ds-ink disabled:opacity-40"
            >
              {suggesting ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconSpark className="h-4 w-4" />}
              {suggesting ? "Drafting prompts…" : "Suggest prompts for me"}
            </button>
            {suggestError && <span className="text-[13px] text-ds-danger">{suggestError}</span>}
          </div>
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
