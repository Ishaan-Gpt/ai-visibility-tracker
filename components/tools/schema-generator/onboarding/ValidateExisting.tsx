"use client";

import { useState } from "react";
import type { SchemaFormData, SchemaType } from "@/lib/tools/schemaTemplates";
import { scoreSchema, type SchemaScore } from "@/lib/tools/validation/schemaValidation";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { CompletenessScore } from "@/components/tools/schema-generator/workspace/CompletenessScore";

const TYPE_BY_SCHEMA_ORG_NAME: Record<string, SchemaType> = {
  Organization: "organization",
  WebSite: "website",
  BreadcrumbList: "breadcrumb",
  FAQPage: "faq",
  Article: "article",
  NewsArticle: "article",
  BlogPosting: "article",
  LocalBusiness: "localBusiness",
  Restaurant: "localBusiness",
  Store: "localBusiness",
  ProfessionalService: "localBusiness",
  Product: "product",
  SoftwareApplication: "softwareApp",
  Person: "person",
  Event: "event",
  Review: "review",
  HowTo: "howTo",
  VideoObject: "videoObject",
  Recipe: "recipe",
  JobPosting: "jobPosting",
  Course: "course",
  Service: "service",
  QAPage: "qaPage",
  Dataset: "dataset",
  Movie: "movie",
  Book: "book",
};

type ScoredEntity = { schemaOrgType: string; type: SchemaType; score: SchemaScore };

function stripScriptTag(input: string): string {
  const match = input.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  return match ? match[1] : input;
}

function extractEntities(json: unknown): { schemaOrgType: string; data: Record<string, unknown> }[] {
  if (!json || typeof json !== "object") return [];
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj["@graph"])) {
    return (obj["@graph"] as Record<string, unknown>[])
      .filter((node) => typeof node?.["@type"] === "string")
      .map((node) => ({ schemaOrgType: node["@type"] as string, data: node }));
  }
  if (typeof obj["@type"] === "string") {
    return [{ schemaOrgType: obj["@type"] as string, data: obj }];
  }
  return [];
}

export function ValidateExisting({ onBack }: { onBack: () => void }) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoredEntity[] | null>(null);

  function handleCheck() {
    setError(null);
    setResults(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripScriptTag(raw).trim());
    } catch {
      setError("That doesn't look like valid JSON — check for a stray comma or missing bracket.");
      return;
    }

    const entities = extractEntities(parsed);
    if (entities.length === 0) {
      setError("No @type found — paste a single JSON-LD object or an @graph array.");
      return;
    }

    const scored: ScoredEntity[] = [];
    const unrecognized: string[] = [];
    for (const entity of entities) {
      const type = TYPE_BY_SCHEMA_ORG_NAME[entity.schemaOrgType];
      if (!type) {
        unrecognized.push(entity.schemaOrgType);
        continue;
      }
      scored.push({
        schemaOrgType: entity.schemaOrgType,
        type,
        score: scoreSchema(type, entity.data as unknown as SchemaFormData[SchemaType]),
      });
    }

    if (scored.length === 0) {
      setError(`We don't score ${unrecognized.join(", ")} yet — try Organization, Product, Article, or another supported type.`);
      return;
    }
    setResults(scored);
  }

  return (
    <SectionShell height="full" className="items-center">
      <div className="w-full max-w-3xl">
        <button type="button" onClick={onBack} className="mb-8 font-body text-xs text-foreground/40 hover:text-foreground">
          ← Back
        </button>
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Validate existing markup
        </p>
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">
          <RevealText text="Paste your JSON-LD to score it." />
        </h1>
        <p className="mb-6 max-w-xl font-body text-sm text-foreground/60">
          Checked entirely in your browser — nothing is sent anywhere. Works best for flatter types like
          Organization, WebSite, LocalBusiness, and Person; deeply nested types (Product, Article) may score
          lower than they deserve since this checks top-level structure only.
        </p>

        <GlassCard className="p-4">
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder='{"@context": "https://schema.org", "@type": "Organization", "name": "..."}'
            rows={10}
            className="w-full resize-none rounded-lg border border-foreground/15 bg-background p-3 font-mono text-xs text-foreground/80 outline-none focus:border-primary"
          />
        </GlassCard>

        {error ? <p className="mt-3 font-body text-sm text-red-600">{error}</p> : null}

        <div className="mt-6">
          <MagneticButton onClick={handleCheck}>Check my markup</MagneticButton>
        </div>

        {results ? (
          <div className="mt-8 space-y-6">
            {results.map((r, i) => (
              <div key={i}>
                <p className="mb-2 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">{r.schemaOrgType}</p>
                <CompletenessScore score={r.score} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
