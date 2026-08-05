"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import type { SchemaType } from "@/lib/tools/schemaTemplates";
import { loadSession, clearSession, type PersistedSession } from "@/lib/tools/workspaceStorage";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { OnboardingPicker } from "@/components/tools/schema-generator/onboarding/OnboardingPicker";
import { ValidateExisting } from "@/components/tools/schema-generator/onboarding/ValidateExisting";
import { SchemaWorkspace } from "@/components/tools/schema-generator/workspace/SchemaWorkspace";

type Mode = "onboarding" | "validate" | "workspace";

export default function SchemaGeneratorBuildPage() {
  const [mode, setMode] = useState<Mode>("onboarding");
  const [selection, setSelection] = useState<{ types: SchemaType[]; withReviews?: boolean } | null>(null);
  const [restoredSession, setRestoredSession] = useState<PersistedSession | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setRestoredSession(session);
      setSelection({ types: session.types });
      setMode("workspace");
    }
  }, []);

  function handleStartFresh() {
    clearSession();
    setRestoredSession(null);
    setSelection(null);
    setMode("onboarding");
  }

  return (
    <>
      <ToolsHeader toolName="Schema Markup Generator" />
      <LayoutGroup>
        <div className="relative">
          <AnimatePresence>
            {mode === "onboarding" ? (
              <motion.div key="onboarding" exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                <OnboardingPicker
                  onSelect={(types, opts) => {
                    setSelection({ types, withReviews: opts?.withReviews });
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
                <ValidateExisting onBack={() => setMode("onboarding")} />
              </motion.div>
            ) : selection ? (
              <SchemaWorkspace
                key="workspace"
                initialTypes={selection.types}
                withReviews={selection.withReviews}
                restoredSession={restoredSession}
                onBack={handleStartFresh}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </>
  );
}
