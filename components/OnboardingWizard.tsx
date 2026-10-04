"use client";

import { useState } from "react";
import { createBrand } from "@/app/tools/ai-visibility-tracker/(app)/onboarding/actions";

export default function OnboardingWizard({ maxPrompts, defaultDomain = "" }: { maxPrompts: number; defaultDomain?: string }) {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <form action={createBrand} className="space-y-6">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ds-ink-2">
          <span>Step {step} of 2</span>
          <div className="ml-2 flex items-center gap-1">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${s === step ? "w-6 bg-black" : "w-2 bg-neutral-200"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={step === 1 ? "space-y-6" : "hidden"}>
        <div>
          <span className="rounded-full bg-ds-btn/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
            Onboarding 1/2
          </span>
          <h2
            className="mt-3 text-[26px] font-normal tracking-[-0.02em] text-ds-ink md:text-3xl"
          >
            What site are you working on?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ds-ink-2">
            We&apos;ll ask Gemini (with Google Search grounding) whether this brand shows up for the
            prompts you care about.
          </p>
        </div>

        <div className="space-y-4 rounded-ds-md border border-neutral-200 bg-white p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Brand name</label>
            <input
              name="name"
              required
              placeholder="Eegnite"
              className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Domain</label>
            <input
              name="domain"
              defaultValue={defaultDomain}
              required
              placeholder="eegnite.com"
              className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm font-mono text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div />
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-ds-md bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Continue →
          </button>
        </div>
      </div>

      <div className={step === 2 ? "space-y-6" : "hidden"}>
        <div>
          <span className="rounded-full bg-ds-btn/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
            Onboarding 2/2
          </span>
          <h2
            className="mt-3 text-[26px] font-normal tracking-[-0.02em] text-ds-ink md:text-3xl"
          >
            Track competitors &amp; prompts
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ds-ink-2">
            All 5 OMNI SEO tools unlock in your studio the moment you finish this step.
          </p>
        </div>

        <div className="rounded-ds-md border border-neutral-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-semibold text-neutral-900">Competitor (optional)</h3>
          <p className="mb-4 text-xs text-ds-ink-2">Track one competitor on your current plan.</p>
          <div className="flex flex-col gap-3">
            <input
              name="competitorName"
              placeholder="Competitor name"
              className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
            />
            <input
              name="competitorDomain"
              placeholder="competitor.com"
              className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm font-mono text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
            />
          </div>
        </div>

        <div className="rounded-ds-md border border-neutral-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-semibold text-neutral-900">Prompts to track</h3>
          <p className="mb-4 text-xs text-ds-ink-2">
            Up to {maxPrompts} on your plan. What would a customer actually type into ChatGPT/Gemini?
          </p>
          <div className="flex flex-col gap-3">
            {Array.from({ length: maxPrompts }).map((_, i) => (
              <input
                key={i}
                name="prompts"
                placeholder={`e.g. "best ${i === 0 ? "SEO agency" : "digital marketing agency"} in India"`}
                className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs font-semibold text-neutral-600 transition hover:text-black"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="rounded-ds-md bg-ds-btn px-8 py-3 text-sm font-semibold text-black transition hover:bg-black"
          >
            Launch OMNI SEO Studio 🚀
          </button>
        </div>
      </div>
    </form>
  );
}
