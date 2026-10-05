"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  initialFormData,
  generateJsonLd,
  type SchemaFormData,
  type SchemaType,
} from "@/lib/tools/schemaTemplates";
import { composeGraph } from "@/lib/tools/validation/graphComposer";
import { scoreSchema } from "@/lib/tools/validation/schemaValidation";
import { saveSession, type PersistedSession } from "@/lib/tools/workspaceStorage";
import { WorkspaceSidebar } from "@/components/tools/schema-generator/workspace/WorkspaceSidebar";
import { SchemaFieldForm } from "@/components/tools/schema-generator/workspace/SchemaFieldForm";
import { CodePreviewPanel } from "@/components/tools/schema-generator/workspace/CodePreviewPanel";
import { CompletenessScore } from "@/components/tools/schema-generator/workspace/CompletenessScore";
import { RichResultPreview } from "@/components/tools/schema-generator/workspace/RichResultPreview";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type SchemaWorkspaceProps = {
  initialTypes?: SchemaType[];
  withReviews?: boolean;
  restoredSession?: PersistedSession | null;
  onBack?: () => void;
  brand?: { name: string; domain: string };
};

function seedData(initialTypes: SchemaType[], withReviews?: boolean, brand?: { name: string; domain: string }): SchemaFormData {
  let base: SchemaFormData = initialFormData;
  if (brand) {
    const url = `https://${brand.domain}`;
    base = {
      ...base,
      organization: {
        ...base.organization,
        name: brand.name,
        url,
        logo: `${url}/logo.png`,
        description: "",
        sameAs: [],
        email: "",
        telephone: "",
      },
      website: { ...base.website, name: brand.name, url, description: "" },
      breadcrumb: { items: [{ name: "Home", url }] },
    };
  }
  if (!withReviews || !initialTypes.includes("product")) return base;
  return {
    ...base,
    product: {
      ...base.product,
      reviews: [{ authorName: "", reviewBody: "", ratingValue: "" }],
    },
  };
}

export function SchemaWorkspace({ initialTypes = ["organization"], withReviews, restoredSession, onBack = () => {}, brand }: SchemaWorkspaceProps) {
  const typesToUse = restoredSession?.types ?? initialTypes;
  const [types, setTypes] = useState<SchemaType[]>(typesToUse);
  const [activeType, setActiveType] = useState<SchemaType>(restoredSession?.activeType ?? (typesToUse[0] || "organization"));
  const [formData, setFormData] = useState<SchemaFormData>(
    () => restoredSession?.formData ?? seedData(initialTypes, withReviews, brand),
  );
  const [showRestoredToast, setShowRestoredToast] = useState(!!restoredSession);

  useEffect(() => {
    if (!showRestoredToast) return;
    const timeout = setTimeout(() => setShowRestoredToast(false), 3200);
    return () => clearTimeout(timeout);
  }, [showRestoredToast]);

  useEffect(() => {
    const timeout = setTimeout(() => saveSession({ types, activeType, formData }), 300);
    return () => clearTimeout(timeout);
  }, [types, activeType, formData]);

  const activeScore = useMemo(() => scoreSchema(activeType, formData[activeType]), [activeType, formData]);

  const output = useMemo(() => {
    if (types.length === 1) {
      return generateJsonLd(types[0], formData);
    }
    return composeGraph(types.map((type) => ({ type, json: generateJsonLd(type, formData) as Record<string, unknown> })));
  }, [types, formData]);

  function handleAdd(type: SchemaType) {
    setTypes((prev) => [...prev, type]);
    setActiveType(type);
  }

  function handleRemove(type: SchemaType) {
    setTypes((prev) => {
      const next = prev.filter((t) => t !== type);
      if (activeType === type) setActiveType(next[0]);
      return next;
    });
  }

  return (
    <motion.div
      layoutId={`type-card-${initialTypes.length > 1 ? "foundation" : initialTypes[0]}`}
      className="w-full"
    >
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

      <div className="grid gap-6 xl:grid-cols-[190px_1fr_340px]">
        <WorkspaceSidebar
          types={types}
          activeType={activeType}
          onSelectActive={setActiveType}
          onRemove={handleRemove}
          onAdd={handleAdd}
         
        />

        <div className="space-y-8">
          <SchemaFieldForm
            type={activeType}
            data={formData[activeType]}
            onChange={(next) => setFormData((prev) => ({ ...prev, [activeType]: next }))}
          />
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <RichResultPreview type={activeType} data={formData[activeType]} />
          <CompletenessScore score={activeScore} />
          <CodePreviewPanel json={output} />
        </div>
      </div>
    </motion.div>
  );
}
