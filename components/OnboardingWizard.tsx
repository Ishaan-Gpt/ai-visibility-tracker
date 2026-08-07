"use client";

import { useState } from "react";
import { createBrand } from "@/app/tools/ai-visibility-tracker/(app)/onboarding/actions";

export default function OnboardingWizard({ maxPrompts }: { maxPrompts: number }) {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <form action={createBrand} className="space-y-6">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
          <span className="rounded-full bg-[#FFD209]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
            Onboarding 1/2
          </span>
          <h2
            className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            What site are you working on?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            We&apos;ll ask Gemini (with Google Search grounding) whether this brand shows up for the
            prompts you care about.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Brand name</label>
            <input
              name="name"
              required
              placeholder="Eegnite"
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Domain</label>
            <input
              name="domain"
              required
              placeholder="eegnite.com"
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-mono text-neutral-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div />
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800"
          >
            Continue →
          </button>
        </div>
      </div>

      <div className={step === 2 ? "space-y-6" : "hidden"}>
        <div>
          <span className="rounded-full bg-[#FFD209]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
            Onboarding 2/2
          </span>
          <h2
            className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Track competitors &amp; prompts
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            All 5 OMNI SEO tools unlock in your studio the moment you finish this step.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-semibold text-neutral-900">Competitor (optional)</h3>
          <p className="mb-4 text-xs text-muted-foreground">Track one competitor on your current plan.</p>
          <div className="flex flex-col gap-3">
            <input
              name="competitorName"
              placeholder="Competitor name"
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
            <input
              name="competitorDomain"
              placeholder="competitor.com"
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-mono text-neutral-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-semibold text-neutral-900">Prompts to track</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Up to {maxPrompts} on your plan. What would a customer actually type into ChatGPT/Gemini?
          </p>
          <div className="flex flex-col gap-3">
            {Array.from({ length: maxPrompts }).map((_, i) => (
              <input
                key={i}
                name="prompts"
                placeholder={`e.g. "best ${i === 0 ? "SEO agency" : "digital marketing agency"} in India"`}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
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
            className="rounded-xl bg-[#FFD209] px-8 py-3 text-sm font-semibold text-black shadow-md transition hover:bg-[#e0b800]"
          >
            Launch OMNI SEO Studio 🚀
          </button>
        </div>
      </div>
    </form>
  );
}
