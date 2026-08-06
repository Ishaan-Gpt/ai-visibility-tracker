"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { loadKeywordDensitySession, clearKeywordDensitySession } from "@/lib/tools/keywordDensity/keywordDensityWorkspaceStorage";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { OnboardingPicker } from "@/components/tools/keyword-density-checker/onboarding/OnboardingPicker";
import { KeywordDensityWorkspace } from "@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace";

type Mode = "onboarding" | "workspace";

export default function KeywordDensityCheckerBuildPage() {
  const [mode, setMode] = useState<Mode>("onboarding");
  const [content, setContent] = useState("");
  const [keywordsRaw, setKeywordsRaw] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const session = loadKeywordDensitySession();
    if (session && session.content.trim().length > 0) {
      setContent(session.content);
      setKeywordsRaw(session.targetKeywords.join(", "));
      setRestored(true);
      setMode("workspace");
    }
  }, []);

  function handleStartFresh() {
    clearKeywordDensitySession();
    setContent("");
    setKeywordsRaw("");
    setRestored(false);
    setMode("onboarding");
  }

  return (
    <>
      <ToolsHeader toolName="Keyword Density Checker" />
      <LayoutGroup>
        <div className="relative">
          <AnimatePresence>
            {mode === "onboarding" ? (
              <motion.div key="onboarding" exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                <OnboardingPicker
                  onSubmit={(submittedContent, targetKeywords) => {
                    setContent(submittedContent);
                    setKeywordsRaw(targetKeywords.join(", "));
                    setMode("workspace");
                  }}
                />
              </motion.div>
            ) : (
              <KeywordDensityWorkspace
                key="workspace"
                initialContent={content}
                initialKeywordsRaw={keywordsRaw}
                restored={restored}
                onBack={handleStartFresh}
              />
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </>
  );
}
