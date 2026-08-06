"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { loadSitemapSession, clearSitemapSession } from "@/lib/tools/sitemap/sitemapWorkspaceStorage";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { OnboardingPicker } from "@/components/tools/sitemap-xml-generator/onboarding/OnboardingPicker";
import { ValidateExisting } from "@/components/tools/sitemap-xml-generator/onboarding/ValidateExisting";
import { SitemapWorkspace } from "@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace";

type Mode = "onboarding" | "validate" | "workspace";

export default function SitemapXmlGeneratorBuildPage() {
  const [mode, setMode] = useState<Mode>("onboarding");
  const [entries, setEntries] = useState<SitemapUrlEntry[]>([]);
  const [restoredEntries, setRestoredEntries] = useState<SitemapUrlEntry[] | null>(null);

  useEffect(() => {
    const session = loadSitemapSession();
    if (session && session.entries.length > 0) {
      setRestoredEntries(session.entries);
      setEntries(session.entries);
      setMode("workspace");
    }
  }, []);

  function handleStartFresh() {
    clearSitemapSession();
    setRestoredEntries(null);
    setEntries([]);
    setMode("onboarding");
  }

  return (
    <>
      <ToolsHeader toolName="Sitemap.xml Generator" />
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
                  onValidateExisting={() => setMode("validate")}
                />
              </motion.div>
            ) : mode === "validate" ? (
              <motion.div
                key="validate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <ValidateExisting
                  onBack={() => setMode("onboarding")}
                  onImport={(imported) => {
                    setEntries(imported);
                    setMode("workspace");
                  }}
                />
              </motion.div>
            ) : (
              <SitemapWorkspace key="workspace" initialEntries={entries} restoredEntries={restoredEntries} onBack={handleStartFresh} />
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </>
  );
}
