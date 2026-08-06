"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { UploadIcon, ListIcon } from "@/components/tools/shared/icons/SchemaIcons";

type OnboardingPickerProps = {
  onSelect: (entries: SitemapUrlEntry[]) => void;
  onValidateExisting: () => void;
};

function parseBulkUrls(raw: string): SitemapUrlEntry[] {
  const lines = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(lines));
  return unique.map((loc) => ({ loc, lastmod: "", changefreq: "", priority: "" }));
}

export function OnboardingPicker({ onSelect, onValidateExisting }: OnboardingPickerProps) {
  const [pasteExpanded, setPasteExpanded] = useState(false);
  const [raw, setRaw] = useState("");

  return (
    <SectionShell height="full" className="items-center">
      <div className="mb-14 max-w-xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Step 1 of 2
        </p>
        <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="How do you want to start?" />
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="wait">
          {!pasteExpanded ? (
            <motion.button
              key="collapsed"
              type="button"
              exit={{ opacity: 0 }}
              onClick={() => setPasteExpanded(true)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-foreground/10 bg-background/60 p-6 text-left backdrop-blur-md transition-colors hover:border-primary/30"
            >
              <UploadIcon className="h-6 w-6 text-primary" />
              <p className="font-display text-lg text-foreground">Paste your URLs</p>
              <p className="font-body text-xs text-foreground/50">One per line, or comma-separated — from a CMS export, spreadsheet, or anywhere else.</p>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2"
            >
              <GlassCard className="p-5">
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={"https://yoursite.com/\nhttps://yoursite.com/about\nhttps://yoursite.com/blog/post-1"}
                  rows={8}
                  className="w-full resize-none rounded-lg border border-foreground/15 bg-background p-3 font-mono text-xs text-foreground/80 outline-none focus:border-primary"
                />
                <div className="mt-4 flex items-center gap-4">
                  <MagneticButton
                    onClick={() => {
                      const entries = parseBulkUrls(raw);
                      if (entries.length > 0) onSelect(entries);
                    }}
                  >
                    Continue with {parseBulkUrls(raw).length || 0} URL{parseBulkUrls(raw).length === 1 ? "" : "s"}
                  </MagneticButton>
                  <button
                    type="button"
                    onClick={() => setPasteExpanded(false)}
                    className="font-body text-xs text-foreground/40 hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {!pasteExpanded ? (
          <button
            type="button"
            onClick={() => onSelect([])}
            className="flex flex-col items-start gap-3 rounded-2xl border border-foreground/10 bg-background/60 p-6 text-left backdrop-blur-md transition-colors hover:border-primary/30"
          >
            <ListIcon className="h-6 w-6 text-primary" />
            <p className="font-display text-lg text-foreground">Build one by one</p>
            <p className="font-body text-xs text-foreground/50">Start empty and add rows manually — good for a small or new site.</p>
          </button>
        ) : null}
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <button
          type="button"
          onClick={onValidateExisting}
          className="font-body text-sm text-foreground/50 hover:text-primary"
        >
          Already have a sitemap.xml? Validate it instead →
        </button>
      </div>
    </SectionShell>
  );
}
