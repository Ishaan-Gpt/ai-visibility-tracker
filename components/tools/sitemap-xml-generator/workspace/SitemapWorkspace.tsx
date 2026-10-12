"use client";

import { useEffect, useMemo, useState } from "react";
import { useAfterMount } from "@/components/tools/sitemap-xml-generator/crawl/useAfterMount";
import { motion, AnimatePresence } from "framer-motion";
import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { generateSitemap } from "@/lib/tools/sitemap/sitemapGenerator";
import { parseSitemapXml } from "@/lib/tools/sitemap/sitemapParser";
import { scoreSitemap } from "@/lib/tools/sitemap/sitemapValidation";
import { loadSitemapSession, saveSitemapSession } from "@/lib/tools/sitemap/sitemapWorkspaceStorage";
import { UrlTable } from "@/components/tools/sitemap-xml-generator/workspace/UrlTable";
import { SitemapHealthScore } from "@/components/tools/sitemap-xml-generator/workspace/SitemapHealthScore";
import { XmlPreviewPanel } from "@/components/tools/sitemap-xml-generator/workspace/XmlPreviewPanel";
import { ModeSwitch, type ModeKey } from "@/components/tools/sitemap-xml-generator/workspace/ModeSwitch";
import { CrawlMode } from "@/components/tools/sitemap-xml-generator/workspace/CrawlMode";
import { ValidateMode } from "@/components/tools/sitemap-xml-generator/workspace/ValidateMode";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type SitemapWorkspaceProps = {
  initialEntries: SitemapUrlEntry[];
  restoredEntries?: SitemapUrlEntry[] | null;
  onBack: () => void;
  initialMode?: ModeKey;
};

const MODES: { key: ModeKey; label: string; short?: string; hint: string }[] = [
  { key: "crawl", label: "Crawl my site", short: "Crawl", hint: "Crawl your live site and build the sitemap from real, indexable pages" },
  { key: "validate", label: "Validate a sitemap", short: "Validate", hint: "Check an existing sitemap against the protocol and test the URLs it lists" },
  { key: "manual", label: "Build by hand", short: "By hand", hint: "Type or paste URLs; runs entirely in your browser" },
];

/** Turns pasted text (a URL list or sitemap XML) into entries. */
function parsePaste(raw: string): { entries: SitemapUrlEntry[]; error?: string } {
  const text = raw.trim();
  if (!text) return { entries: [] };
  if (text.startsWith("<")) {
    const parsed = parseSitemapXml(text);
    if (parsed.kind === "urlset") return { entries: parsed.entries };
    if (parsed.kind === "sitemapindex") return { entries: [], error: "That's a sitemap index. Paste one of the sitemaps it lists, or use Validate mode to read the whole set." };
    return { entries: [], error: parsed.message };
  }
  const urls = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\/\S+\.\S+/i.test(s));
  if (!urls.length) return { entries: [], error: "No absolute URLs found. Each line should start with https://" };
  return { entries: urls.map((loc) => ({ loc, lastmod: "", changefreq: "", priority: "" })) };
}

export function SitemapWorkspace({ initialEntries = [], restoredEntries, initialMode = "crawl" }: Partial<SitemapWorkspaceProps>) {
  const [mode, setMode] = useState<ModeKey>(initialMode);
  const [entries, setEntries] = useState<SitemapUrlEntry[]>(restoredEntries ?? initialEntries);
  const [toast, setToast] = useState<string | null>(restoredEntries ? "Restored your last session" : null);
  const [crawlUrl, setCrawlUrl] = useState<string | undefined>(undefined);
  const [paste, setPaste] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [gzip, setGzip] = useState(false);

  // Browser-only state: saved manual session and ?url= / ?mode= deep links.
  useAfterMount(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    if (m === "validate" || m === "manual" || m === "crawl") setMode(m);
    const u = params.get("url");
    if (u) setCrawlUrl(u);
    if (!restoredEntries) {
      const saved = loadSitemapSession();
      if (saved?.entries.length && JSON.stringify(saved.entries) !== JSON.stringify(initialEntries)) setEntries(saved.entries);
    }
  });

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const timeout = setTimeout(() => saveSitemapSession({ entries }), 300);
    return () => clearTimeout(timeout);
  }, [entries]);

  const score = useMemo(() => scoreSitemap(entries), [entries]);
  const generated = useMemo(() => generateSitemap(entries, undefined, { gzip }), [entries, gzip]);

  function applyPaste(replace: boolean) {
    const { entries: parsed, error } = parsePaste(paste);
    setPasteError(error ?? null);
    if (!parsed.length) return;
    const base = replace ? [] : entries.filter((e) => e.loc.trim());
    const seen = new Set(base.map((e) => e.loc));
    setEntries([...base, ...parsed.filter((e) => !seen.has(e.loc))]);
    setPaste("");
    setPasteOpen(false);
    setToast(`Added ${parsed.length.toLocaleString()} URL${parsed.length === 1 ? "" : "s"}`);
  }

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

      {/* Crawl stays mounted so a finished crawl survives switching modes. */}
      <div hidden={mode !== "crawl"}>
        <CrawlMode
          initialUrl={crawlUrl}
          onSendToManual={(list) => {
            setEntries(list);
            setMode("manual");
            setToast(`Loaded ${list.length.toLocaleString()} URLs from your crawl`);
          }}
        />
      </div>

      <div hidden={mode !== "validate"}>
        <ValidateMode
          onFixWithCrawl={(host) => {
            setCrawlUrl(host);
            setMode("crawl");
          }}
        />
      </div>

      {mode === "manual" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPasteOpen((v) => !v)} className="glass-inset inline-flex h-9 items-center rounded-[11px] px-3.5 text-[13.5px] text-ds-ink transition hover:bg-white/80">
              {pasteOpen ? "Close" : "Paste a URL list or sitemap XML"}
            </button>
            <p className="text-[12.5px] text-ds-ink-3">Manual mode runs entirely in your browser and is unlimited.</p>
          </div>
          {pasteOpen && (
            <div className="glass space-y-3 rounded-[20px] p-4">
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={6}
                placeholder={"https://yoursite.com/\nhttps://yoursite.com/about\n\nor paste a <urlset> sitemap"}
                className="w-full resize-y rounded-[12px] border border-white/70 bg-white/55 px-3 py-2 font-mono text-[12.5px] text-ds-ink outline-none placeholder:text-ds-ink-3"
              />
              {pasteError && <p className="text-[13px] text-ds-danger">{pasteError}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => applyPaste(false)} disabled={!paste.trim()} className="inline-flex h-9 items-center rounded-[11px] bg-ds-accent px-4 text-[13.5px] font-medium text-ds-ink transition hover:bg-[var(--ds-accent-hover)] disabled:opacity-40">
                  Add to list
                </button>
                <button type="button" onClick={() => applyPaste(true)} disabled={!paste.trim()} className="glass-inset inline-flex h-9 items-center rounded-[11px] px-4 text-[13.5px] text-ds-ink transition hover:bg-white/80 disabled:opacity-40">
                  Replace list
                </button>
              </div>
            </div>
          )}
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-6">
              <UrlTable entries={entries} onChange={setEntries} />
              <XmlPreviewPanel generated={generated} gzip={gzip} onGzipChange={setGzip} />
            </div>
            <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
              <SitemapHealthScore score={score} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
