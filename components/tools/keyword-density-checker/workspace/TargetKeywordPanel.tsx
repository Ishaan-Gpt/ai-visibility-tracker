"use client";

import type { TargetKeywordResult } from "@/lib/tools/keywordDensity/analyzer";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

export function TargetKeywordPanel({ results }: { results: TargetKeywordResult[] }) {
  if (results.length === 0) return null;

  return (
    <div className="rounded-2xl border border-foreground/10 p-5">
      <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">Target keywords</p>
      <div className="space-y-4">
        {results.map((r) => (
          <div key={r.keyword} className="space-y-1.5 border-b border-foreground/5 pb-4 last:border-0 last:pb-0">
            <p className="font-body text-sm font-medium text-foreground">{r.keyword}</p>
            <p className="font-body text-xs text-foreground/50">
              {r.count} occurrence{r.count === 1 ? "" : "s"} · {r.density.toFixed(1)}% density
            </p>
            <div className="flex flex-wrap gap-3">
              <span className={`flex items-center gap-1 font-body text-[11px] ${r.inFirst100Words ? "text-primary" : "text-foreground/30"}`}>
                <CheckRingIcon className="h-3 w-3" /> First 100 words
              </span>
              <span className={`flex items-center gap-1 font-body text-[11px] ${r.inHeading ? "text-primary" : "text-foreground/30"}`}>
                <CheckRingIcon className="h-3 w-3" /> In a heading
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
