"use client";

import { useState } from "react";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { parseSitemapXml } from "@/lib/tools/sitemap/sitemapParser";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

type ImportFromXmlProps = {
  onBack: () => void;
  onImport: (entries: HtmlSitemapEntry[]) => void;
};

export function ImportFromXml({ onBack, onImport }: ImportFromXmlProps) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    setError(null);
    const result = parseSitemapXml(raw);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    if (result.kind === "sitemapindex") {
      setError(
        `This is a sitemap index referencing ${result.sitemaps.length} file(s) — paste one of the sub-sitemap files instead.`,
      );
      return;
    }
    const entries: HtmlSitemapEntry[] = result.entries.map((e) => ({ url: e.loc, label: "", section: "" }));
    onImport(entries);
  }

  return (
    <SectionShell height="full" className="items-center">
      <div className="w-full max-w-3xl">
        <button type="button" onClick={onBack} className="mb-8 font-body text-xs text-foreground/40 hover:text-foreground">
          ← Back
        </button>
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Import from sitemap.xml
        </p>
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">
          <RevealText text="Paste your sitemap.xml to convert it." />
        </h1>
        <p className="mb-6 max-w-xl font-body text-sm text-foreground/60">
          Checked entirely in your browser — nothing is sent anywhere. Every &lt;loc&gt; becomes a row you can
          label and group afterward.
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
          <MagneticButton onClick={handleImport}>Import URLs</MagneticButton>
        </div>
      </div>
    </SectionShell>
  );
}
