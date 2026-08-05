"use client";

import type { SchemaType } from "@/lib/tools/schemaTemplates";

const TYPE_LABELS: Record<SchemaType, string> = {
  organization: "Organization",
  website: "WebSite",
  breadcrumb: "BreadcrumbList",
  faq: "FAQPage",
  article: "Article",
  localBusiness: "LocalBusiness",
  product: "Product",
  softwareApp: "SoftwareApplication",
  person: "Person",
  event: "Event",
  review: "Review",
  howTo: "HowTo",
  videoObject: "VideoObject",
  recipe: "Recipe",
  jobPosting: "JobPosting",
  course: "Course",
  service: "Service",
  qaPage: "QAPage",
  dataset: "Dataset",
  movie: "Movie",
  book: "Book",
};

type GraphComposerProps = {
  types: SchemaType[];
  activeType: SchemaType;
  onSelectActive: (type: SchemaType) => void;
  onRemove: (type: SchemaType) => void;
  onAdd: (type: SchemaType) => void;
};

export function GraphComposer({ types, activeType, onSelectActive, onRemove, onAdd }: GraphComposerProps) {
  const available = (Object.keys(TYPE_LABELS) as SchemaType[]).filter((t) => !types.includes(t));

  return (
    <div>
      <p className="mb-3 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-foreground/40">
        This bundle {types.length > 1 ? "(@graph)" : ""}
      </p>
      <div className="space-y-1.5">
        {types.map((type) => (
          <div
            key={type}
            className={`flex items-center justify-between rounded-lg px-3 py-2 font-body text-sm transition-colors ${
              activeType === type ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-foreground/5"
            }`}
          >
            <button type="button" onClick={() => onSelectActive(type)} className="flex-1 text-left">
              {TYPE_LABELS[type]}
            </button>
            {types.length > 1 ? (
              <button type="button" onClick={() => onRemove(type)} className="text-foreground/30 hover:text-foreground/60">
                &times;
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {available.length > 0 ? (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onAdd(e.target.value as SchemaType);
          }}
          className="mt-3 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-xs text-foreground/60"
        >
          <option value="">+ Add entity to bundle…</option>
          {available.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
