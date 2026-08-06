"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";
import { loadHtmlSitemapSession, clearHtmlSitemapSession } from "@/lib/tools/htmlSitemap/htmlSitemapWorkspaceStorage";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { OnboardingPicker } from "@/components/tools/sitemap-html-generator/onboarding/OnboardingPicker";
import { ImportFromXml } from "@/components/tools/sitemap-html-generator/onboarding/ImportFromXml";
import { HtmlSitemapWorkspace } from "@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace";

type Mode = "onboarding" | "import" | "workspace";

export default function SitemapHtmlGeneratorBuildPage() {
  const [mode, setMode] = useState<Mode>("onboarding");
  const [entries, setEntries] = useState<HtmlSitemapEntry[]>([]);
  const [restoredEntries, setRestoredEntries] = useState<HtmlSitemapEntry[] | null>(null);

  useEffect(() => {
    const session = loadHtmlSitemapSession();
    if (session && session.entries.length > 0) {
      setRestoredEntries(session.entries);
      setEntries(session.entries);
      setMode("workspace");
    }
  }, []);

  function handleStartFresh() {
    clearHtmlSitemapSession();
    setRestoredEntries(null);
    setEntries([]);
    setMode("onboarding");
  }

  return (
    <>
      <ToolsHeader toolName="Sitemap.html Generator" />
      <LayoutGroup>
        <div className="relative">
          <AnimatePresence>
            {mode === "onboarding" ? (
              <motion.div key="onboarding" exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                <OnboardingPicker
                  onSelect={(picked) => {
                    setEntries(picked);
                    setMode("workspace");
                  }}
                  onImportXml={() => setMode("import")}
                />
              </motion.div>
            ) : mode === "import" ? (
              <motion.div
                key="import"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <ImportFromXml
                  onBack={() => setMode("onboarding")}
                  onImport={(imported) => {
                    setEntries(imported);
                    setMode("workspace");
                  }}
                />
              </motion.div>
            ) : (
              <HtmlSitemapWorkspace key="workspace" initialEntries={entries} restoredEntries={restoredEntries} onBack={handleStartFresh} />
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </>
  );
}
