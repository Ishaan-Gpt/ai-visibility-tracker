"use client";

import { useState } from "react";
import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { parseSitemapXml } from "@/lib/tools/sitemap/sitemapParser";
import { scoreSitemap, type SitemapScore } from "@/lib/tools/sitemap/sitemapValidation";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { SitemapHealthScore } from "@/components/tools/sitemap-xml-generator/workspace/SitemapHealthScore";

type ValidateExistingProps = {
  onBack: () => void;
  onImport: (entries: SitemapUrlEntry[]) => void;
};

export function ValidateExisting({ onBack, onImport }: ValidateExistingProps) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<SitemapUrlEntry[] | null>(null);
  const [score, setScore] = useState<SitemapScore | null>(null);
  const [indexInfo, setIndexInfo] = useState<{ loc: string; lastmod: string }[] | null>(null);

  function handleCheck() {
    setError(null);
    setEntries(null);
    setScore(null);
    setIndexInfo(null);

    const result = parseSitemapXml(raw);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    if (result.kind === "sitemapindex") {
      setIndexInfo(result.sitemaps);
      return;
    }
    setEntries(result.entries);
    setScore(scoreSitemap(result.entries));
  }

  return (
    <SectionShell height="full" className="items-center">
      <div className="w-full max-w-3xl">
        <button type="button" onClick={onBack} className="mb-8 font-body text-xs text-foreground/40 hover:text-foreground">
          ← Back
        </button>
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Validate existing sitemap
        </p>
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">
          <RevealText text="Paste your sitemap.xml to score it." />
        </h1>
        <p className="mb-6 max-w-xl font-body text-sm text-foreground/60">
          Checked entirely in your browser — nothing is sent anywhere. Paste a &lt;urlset&gt; sitemap or a
          &lt;sitemapindex&gt; file.
        </p>

        <GlassCard className="p-4">
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder='<?xml version="1.0" encoding="UTF-8"?>&#10;<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">...'
            rows={10}
            className="w-full resize-none rounded-lg border border-foreground/15 bg-background p-3 font-mono text-xs text-foreground/80 outline-none focus:border-primary"
          />
        </GlassCard>

        {error ? <p className="mt-3 font-body text-sm text-red-600">{error}</p> : null}

        <div className="mt-6">
          <MagneticButton onClick={handleCheck}>Check my sitemap</MagneticButton>
        </div>

        {indexInfo ? (
          <div className="mt-8">
            <p className="mb-3 font-body text-sm text-foreground/70">
              This is a sitemap index referencing {indexInfo.length} sub-sitemap file{indexInfo.length === 1 ? "" : "s"}:
            </p>
            <ul className="space-y-1">
              {indexInfo.map((s, i) => (
                <li key={i} className="font-mono text-xs text-foreground/50">
                  {s.loc}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-body text-xs text-foreground/40">
              Paste one of the sub-sitemap files above instead to score its URLs.
            </p>
          </div>
        ) : null}

        {entries && score ? (
          <div className="mt-8 space-y-6">
            <SitemapHealthScore score={score} />
            <MagneticButton tone="ghost" onClick={() => onImport(entries)}>
              Import {entries.length} URL{entries.length === 1 ? "" : "s"} into the editor
            </MagneticButton>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
