"use client";

import { useEffect, useMemo, useState } from "react";
import { useAfterMount } from "@/components/tools/sitemap-xml-generator/crawl/useAfterMount";
import { motion, AnimatePresence } from "framer-motion";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { generateStandalonePage, generateEmbedSnippet } from "@/lib/tools/htmlSitemap/htmlSitemapGenerator";
import { scoreHtmlSitemap } from "@/lib/tools/htmlSitemap/htmlSitemapValidation";
import { loadHtmlSitemapSession, saveHtmlSitemapSession } from "@/lib/tools/htmlSitemap/htmlSitemapWorkspaceStorage";
import { EntryTable } from "@/components/tools/sitemap-html-generator/workspace/EntryTable";
import { RenderedPreview } from "@/components/tools/sitemap-html-generator/workspace/RenderedPreview";
import { SitemapHealthScore } from "@/components/tools/sitemap-html-generator/workspace/SitemapHealthScore";
import { OutputPanel } from "@/components/tools/sitemap-html-generator/workspace/OutputPanel";
import { CrawlImport } from "@/components/tools/sitemap-html-generator/workspace/CrawlImport";
import { ModeSwitch, type ModeKey } from "@/components/tools/sitemap-xml-generator/workspace/ModeSwitch";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type HtmlSitemapWorkspaceProps = {
  initialEntries: HtmlSitemapEntry[];
  restoredEntries?: HtmlSitemapEntry[] | null;
  onBack: () => void;
};

const MODES: { key: ModeKey; label: string; short?: string; hint: string }[] = [
  { key: "crawl", label: "Crawl my site", short: "Crawl", hint: "Build the page from your real pages and titles" },
  { key: "manual", label: "Build by hand", short: "By hand", hint: "Type or edit links yourself; runs in your browser" },
];

export function HtmlSitemapWorkspace({ initialEntries = [], restoredEntries }: Partial<HtmlSitemapWorkspaceProps>) {
  const [mode, setMode] = useState<ModeKey>("crawl");
  const [entries, setEntries] = useState<HtmlSitemapEntry[]>(restoredEntries ?? initialEntries);
  const [siteName, setSiteName] = useState("");
  const [builtFrom, setBuiltFrom] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<"standalone" | "embed">("standalone");
  const [toast, setToast] = useState<string | null>(restoredEntries ? "Restored your last session" : null);

  useAfterMount(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "manual") setMode("manual");
    if (!restoredEntries) {
      const saved = loadHtmlSitemapSession();
      if (saved?.entries.length && JSON.stringify(saved.entries) !== JSON.stringify(initialEntries)) setEntries(saved.entries);
    }
  });

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const timeout = setTimeout(() => saveHtmlSitemapSession({ entries }), 300);
    return () => clearTimeout(timeout);
  }, [entries]);

  const score = useMemo(() => scoreHtmlSitemap(entries), [entries]);
  const standaloneHtml = useMemo(() => generateStandalonePage(entries, siteName.trim() || "Sitemap"), [entries, siteName]);
  const embedHtml = useMemo(() => generateEmbedSnippet(entries), [entries]);

  return (
    <motion.div className="w-full space-y-6">
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-lg"
          >
            <CheckRingIcon className="h-4 w-4 text-primary" />
            <span className="font-body text-xs">{toast}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ModeSwitch mode={mode} onChange={setMode} modes={MODES} />

      <div hidden={mode !== "crawl"}>
        <CrawlImport
          onBuild={(list, name, host) => {
            setEntries(list);
            setSiteName(name);
            setBuiltFrom(host);
            setMode("manual");
            setToast(`Built from ${list.length.toLocaleString()} pages`);
          }}
        />
      </div>

      {mode === "manual" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-[13.5px] text-ds-ink-2">
              Site name
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Your brand"
                className="h-9 w-48 rounded-[11px] border border-white/70 bg-white/55 px-3 text-[13.5px] text-ds-ink outline-none placeholder:text-ds-ink-3"
              />
            </label>
            <p className="text-[12.5px] text-ds-ink-3">
              {builtFrom ? `Built from your crawl of ${builtFrom}. Edit labels and sections freely; ` : ""}
              this editor runs in your browser.
            </p>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <EntryTable entries={entries} onChange={setEntries} />
            </div>
            <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
              <RenderedPreview mode={outputMode} standaloneHtml={standaloneHtml} embedHtml={embedHtml} />
              <SitemapHealthScore score={score} />
              <OutputPanel standaloneHtml={standaloneHtml} embedHtml={embedHtml} mode={outputMode} onModeChange={setOutputMode} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
