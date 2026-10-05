"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";
import { generateSitemap } from "@/lib/tools/sitemap/sitemapGenerator";
import { scoreSitemap } from "@/lib/tools/sitemap/sitemapValidation";
import { saveSitemapSession } from "@/lib/tools/sitemap/sitemapWorkspaceStorage";
import { UrlTable } from "@/components/tools/sitemap-xml-generator/workspace/UrlTable";
import { SitemapHealthScore } from "@/components/tools/sitemap-xml-generator/workspace/SitemapHealthScore";
import { XmlPreviewPanel } from "@/components/tools/sitemap-xml-generator/workspace/XmlPreviewPanel";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type SitemapWorkspaceProps = {
  initialEntries: SitemapUrlEntry[];
  restoredEntries?: SitemapUrlEntry[] | null;
  onBack: () => void;
};

export function SitemapWorkspace({ initialEntries = [], restoredEntries, onBack = () => {} }: Partial<SitemapWorkspaceProps>) {
  const [entries, setEntries] = useState<SitemapUrlEntry[]>(restoredEntries ?? initialEntries);
  const [showRestoredToast, setShowRestoredToast] = useState(!!restoredEntries);

  useEffect(() => {
    if (!showRestoredToast) return;
    const timeout = setTimeout(() => setShowRestoredToast(false), 3200);
    return () => clearTimeout(timeout);
  }, [showRestoredToast]);

  useEffect(() => {
    const timeout = setTimeout(() => saveSitemapSession({ entries }), 300);
    return () => clearTimeout(timeout);
  }, [entries]);

  const score = useMemo(() => scoreSitemap(entries), [entries]);
  const generated = useMemo(() => generateSitemap(entries), [entries]);

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

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div>
          <UrlTable entries={entries} onChange={setEntries} />
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <SitemapHealthScore score={score} />
          <XmlPreviewPanel generated={generated} />
        </div>
      </div>
    </motion.div>
  );
}
