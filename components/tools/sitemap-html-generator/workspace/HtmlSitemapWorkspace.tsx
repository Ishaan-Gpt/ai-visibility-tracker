"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { generateStandalonePage, generateEmbedSnippet } from "@/lib/tools/htmlSitemap/htmlSitemapGenerator";
import { scoreHtmlSitemap } from "@/lib/tools/htmlSitemap/htmlSitemapValidation";
import { saveHtmlSitemapSession } from "@/lib/tools/htmlSitemap/htmlSitemapWorkspaceStorage";
import { EntryTable } from "@/components/tools/sitemap-html-generator/workspace/EntryTable";
import { RenderedPreview } from "@/components/tools/sitemap-html-generator/workspace/RenderedPreview";
import { SitemapHealthScore } from "@/components/tools/sitemap-html-generator/workspace/SitemapHealthScore";
import { OutputPanel } from "@/components/tools/sitemap-html-generator/workspace/OutputPanel";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type HtmlSitemapWorkspaceProps = {
  initialEntries: HtmlSitemapEntry[];
  restoredEntries?: HtmlSitemapEntry[] | null;
  onBack: () => void;
};

export function HtmlSitemapWorkspace({ initialEntries = [], restoredEntries, onBack = () => {} }: Partial<HtmlSitemapWorkspaceProps>) {
  const [entries, setEntries] = useState<HtmlSitemapEntry[]>(restoredEntries ?? initialEntries);
  const [mode, setMode] = useState<"standalone" | "embed">("standalone");
  const [showRestoredToast, setShowRestoredToast] = useState(!!restoredEntries);

  useEffect(() => {
    if (!showRestoredToast) return;
    const timeout = setTimeout(() => setShowRestoredToast(false), 3200);
    return () => clearTimeout(timeout);
  }, [showRestoredToast]);

  useEffect(() => {
    const timeout = setTimeout(() => saveHtmlSitemapSession({ entries }), 300);
    return () => clearTimeout(timeout);
  }, [entries]);

  const score = useMemo(() => scoreHtmlSitemap(entries), [entries]);
  const standaloneHtml = useMemo(() => generateStandalonePage(entries), [entries]);
  const embedHtml = useMemo(() => generateEmbedSnippet(entries), [entries]);

  return (
    <motion.div className="w-full">
      <AnimatePresence>
        {showRestoredToast ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-lg"
          >
            <CheckRingIcon className="h-4 w-4 text-primary" />
            <span className="font-body text-xs">Restored your last session</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mb-6 flex justify-end">
        <button type="button" onClick={onBack} className="rounded-ds-md px-3 py-1.5 text-[14px] text-ds-ink-2 transition-colors hover:bg-ds-muted hover:text-ds-ink">
          Start fresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <EntryTable entries={entries} onChange={setEntries} />
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <RenderedPreview mode={mode} standaloneHtml={standaloneHtml} embedHtml={embedHtml} />
          <SitemapHealthScore score={score} />
          <OutputPanel standaloneHtml={standaloneHtml} embedHtml={embedHtml} mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </motion.div>
  );
}
