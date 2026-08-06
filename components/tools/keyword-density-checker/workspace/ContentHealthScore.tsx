"use client";

import { motion } from "framer-motion";
import type { ContentScore } from "@/lib/tools/keywordDensity/scoring";
import type { ContentAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { CheckRingIcon, GaugeIcon } from "@/components/tools/shared/icons/SchemaIcons";

export function ContentHealthScore({ score, analysis }: { score: ContentScore; analysis: ContentAnalysis }) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground/50">
          <GaugeIcon className="h-4 w-4" />
          <span className="font-body text-xs uppercase tracking-[0.1em]">Content health</span>
        </div>
        <motion.span key={score.score} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-display text-2xl text-foreground">
          {score.score}
        </motion.span>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          animate={{ width: `${score.score}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
          className="h-full rounded-full bg-primary"
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-foreground/[0.03] p-3 text-center">
        <div>
          <p className="font-display text-base text-foreground">{analysis.wordCount}</p>
          <p className="font-body text-[10px] uppercase tracking-[0.06em] text-foreground/40">Words</p>
        </div>
        <div>
          <p className="font-display text-base text-foreground">{analysis.readabilityScore}</p>
          <p className="font-body text-[10px] uppercase tracking-[0.06em] text-foreground/40">{analysis.readabilityLabel}</p>
        </div>
        <div>
          <p className="font-display text-base text-foreground">{Math.round(analysis.vocabularyDiversity * 100)}%</p>
          <p className="font-body text-[10px] uppercase tracking-[0.06em] text-foreground/40">Unique words</p>
        </div>
      </div>

      {score.eligible ? (
        <p className="mb-3 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-body text-xs text-primary">
          <CheckRingIcon className="h-3.5 w-3.5" /> No stuffing detected
        </p>
      ) : null}

      <ul className="space-y-1.5">
        {score.rules.map((rule) => (
          <li key={rule.label} className="flex items-start gap-2 font-body text-xs">
            <span className={rule.passed ? "text-primary" : "text-foreground/25"}>{rule.passed ? "●" : "○"}</span>
            <div>
              <span className={rule.passed ? "text-foreground/70" : "text-foreground/50"}>
                {rule.label}
                {rule.weight === "required" ? <span className="ml-1 text-primary/70">*</span> : null}
              </span>
              {rule.hint ? <p className="text-foreground/35">{rule.hint}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
