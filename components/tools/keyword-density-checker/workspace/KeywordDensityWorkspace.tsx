"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseContent } from "@/lib/tools/keywordDensity/contentParser";
import { analyzeContent, analyzeTargetKeyword } from "@/lib/tools/keywordDensity/analyzer";
import { scoreContent } from "@/lib/tools/keywordDensity/scoring";
import { saveKeywordDensitySession } from "@/lib/tools/keywordDensity/keywordDensityWorkspaceStorage";
import { ContentInput } from "@/components/tools/keyword-density-checker/workspace/ContentInput";
import { NgramTable } from "@/components/tools/keyword-density-checker/workspace/NgramTable";
import { TargetKeywordPanel } from "@/components/tools/keyword-density-checker/workspace/TargetKeywordPanel";
import { ContentHealthScore } from "@/components/tools/keyword-density-checker/workspace/ContentHealthScore";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type KeywordDensityWorkspaceProps = {
  initialContent: string;
  initialKeywordsRaw: string;
  restored?: boolean;
  onBack: () => void;
};

export function KeywordDensityWorkspace({ initialContent = "", initialKeywordsRaw = "", restored, onBack = () => {} }: Partial<KeywordDensityWorkspaceProps>) {
  const [content, setContent] = useState(initialContent);
  const [keywordsRaw, setKeywordsRaw] = useState(initialKeywordsRaw);
  const [debouncedContent, setDebouncedContent] = useState(initialContent);
  const [showRestoredToast, setShowRestoredToast] = useState(!!restored);

  useEffect(() => {
    if (!showRestoredToast) return;
    const timeout = setTimeout(() => setShowRestoredToast(false), 3200);
    return () => clearTimeout(timeout);
  }, [showRestoredToast]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedContent(content), 250);
    return () => clearTimeout(timeout);
  }, [content]);

  const targetKeywords = useMemo(
    () => keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean),
    [keywordsRaw],
  );

  useEffect(() => {
    const timeout = setTimeout(() => saveKeywordDensitySession({ content, targetKeywords }), 400);
    return () => clearTimeout(timeout);
  }, [content, targetKeywords]);

  const parsed = useMemo(() => parseContent(debouncedContent), [debouncedContent]);
  const analysis = useMemo(() => analyzeContent(parsed.body), [parsed.body]);
  const targetResults = useMemo(
    () => targetKeywords.map((k) => analyzeTargetKeyword(parsed.body, parsed.headings, k)),
    [parsed.body, parsed.headings, targetKeywords],
  );
  const score = useMemo(
    () => scoreContent(analysis, targetKeywords.length > 0 ? targetResults.some((r) => r.count > 0) : undefined),
    [analysis, targetKeywords, targetResults],
  );

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

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <ContentInput
            content={content}
            onContentChange={setContent}
            keywordsRaw={keywordsRaw}
            onKeywordsRawChange={setKeywordsRaw}
            wordCount={analysis.wordCount}
          />
          <NgramTable ngrams={analysis.ngrams} />
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <ContentHealthScore score={score} analysis={analysis} />
          {targetResults.length > 0 ? <TargetKeywordPanel results={targetResults} /> : null}
        </div>
      </div>
    </motion.div>
  );
}
