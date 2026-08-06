"use client";

import { useState } from "react";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

type OnboardingPickerProps = {
  onSubmit: (content: string, targetKeywords: string[]) => void;
};

export function OnboardingPicker({ onSubmit }: OnboardingPickerProps) {
  const [content, setContent] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  function handleSubmit() {
    if (!content.trim()) return;
    const targetKeywords = keywordInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    onSubmit(content, targetKeywords);
  }

  const wordCountEstimate = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <SectionShell height="full" className="items-center">
      <div className="mb-10 max-w-xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Step 1 of 2
        </p>
        <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Paste what you're publishing." />
        </h1>
        <p className="mt-4 font-body text-sm text-foreground/60">
          Plain text, Markdown, or HTML — headings are detected automatically and analyzed separately.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <GlassCard className="p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your article, page copy, or draft here…"
            rows={12}
            className="w-full resize-none rounded-lg border border-foreground/15 bg-background p-3 font-body text-sm text-foreground/80 outline-none focus:border-primary"
          />
          <p className="mt-2 font-body text-xs text-foreground/40">{wordCountEstimate} words</p>
        </GlassCard>

        <div>
          <label className="mb-1.5 block font-body text-xs font-medium text-foreground/70">
            Target keyword(s) — optional, comma-separated
          </label>
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="e.g. ai visibility tracker, schema markup"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
        </div>

        <MagneticButton onClick={handleSubmit}>Analyze my content</MagneticButton>
      </div>
    </SectionShell>
  );
}
