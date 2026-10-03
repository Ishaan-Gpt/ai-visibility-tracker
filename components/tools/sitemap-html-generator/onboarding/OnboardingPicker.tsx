"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { loadSitemapSession } from "@/lib/tools/sitemap/sitemapWorkspaceStorage";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { UploadIcon, ListIcon, LayersIcon } from "@/components/tools/shared/icons/SchemaIcons";

type OnboardingPickerProps = {
  onSelect: (entries: HtmlSitemapEntry[]) => void;
  onImportXml: () => void;
};

function parseBulkLines(raw: string): HtmlSitemapEntry[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url = "", label = "", section = ""] = line.split("|").map((part) => part.trim());
      return { url, label, section };
    })
    .filter((entry) => entry.url !== "");
}

export function OnboardingPicker({ onSelect, onImportXml }: OnboardingPickerProps) {
  const [pasteExpanded, setPasteExpanded] = useState(false);
  const [raw, setRaw] = useState("");
  const [detectedCount, setDetectedCount] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const session = loadSitemapSession();
    if (session && session.entries.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage on mount
      setDetectedCount(session.entries.length);
    }
  }, []);

  function handleImportDetected() {
    const session = loadSitemapSession();
    if (!session) return;
    const entries: HtmlSitemapEntry[] = session.entries.map((e) => ({ url: e.loc, label: "", section: "" }));
    onSelect(entries);
  }

  return (
    <SectionShell height="full" className="items-center">
      <div className="mb-10 max-w-xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Step 1 of 2
        </p>
        <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="How do you want to start?" />
        </h1>
      </div>

      {detectedCount && !bannerDismissed ? (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 w-full max-w-2xl">
          <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-4">
            <p className="font-body text-sm text-foreground/70">
              We found a sitemap you built earlier ({detectedCount} URLs) — use it here?
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleImportDetected} className="font-body text-xs text-primary hover:underline">
                Use it
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="font-body text-xs text-foreground/40 hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </GlassCard>
        </motion.div>
      ) : null}

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
              <p className="font-body text-xs text-foreground/50">One per line — optionally url | label | section to group them.</p>
            </motion.button>
          ) : (
            <motion.div key="expanded" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2">
              <GlassCard className="p-5">
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={
                    "https://yoursite.com/\nhttps://yoursite.com/blog/post-1 | My First Post | Blog\nhttps://yoursite.com/products/widget | Widget | Products"
                  }
                  rows={8}
                  className="w-full resize-none rounded-lg border border-foreground/15 bg-background p-3 font-mono text-xs text-foreground/80 outline-none focus:border-primary"
                />
                <div className="mt-4 flex items-center gap-4">
                  <MagneticButton
                    onClick={() => {
                      const entries = parseBulkLines(raw);
                      if (entries.length > 0) onSelect(entries);
                    }}
                  >
                    Continue with {parseBulkLines(raw).length || 0} URL{parseBulkLines(raw).length === 1 ? "" : "s"}
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
            <p className="font-body text-xs text-foreground/50">Start empty and add rows manually.</p>
          </button>
        ) : null}
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <button
          type="button"
          onClick={onImportXml}
          className="flex items-center gap-2 font-body text-sm text-foreground/50 hover:text-primary"
        >
          <LayersIcon className="h-4 w-4" />
          Already have a sitemap.xml? Import it instead →
        </button>
      </div>
    </SectionShell>
  );
}
