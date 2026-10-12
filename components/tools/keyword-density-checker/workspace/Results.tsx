"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ngramsFor, type DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import type { TargetAnalysis } from "@/lib/tools/keywordDensity/target";
import type { CompareResult } from "@/lib/tools/keywordDensity/compare";
import type { OverOptFlag } from "@/lib/tools/keywordDensity/overOptimization";
import { Verdict } from "@/components/tools/keyword-density-checker/workspace/Verdict";
import { NgramTable } from "@/components/tools/keyword-density-checker/workspace/NgramTable";
import { TargetKeywordPanel } from "@/components/tools/keyword-density-checker/workspace/TargetKeywordPanel";
import { ReadabilityPanel } from "@/components/tools/keyword-density-checker/workspace/ReadabilityPanel";
import { DistinctiveTerms } from "@/components/tools/keyword-density-checker/workspace/DistinctiveTerms";
import { ComparePanel } from "@/components/tools/keyword-density-checker/workspace/ComparePanel";
import { ExtractedContent } from "@/components/tools/keyword-density-checker/workspace/ExtractedContent";
import { Section, fmt } from "@/components/tools/keyword-density-checker/workspace/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Everything below the inputs. Memoised: typing in the editor doesn't re-render it; only a new analysis does.
 */
export const Results = memo(function Results({
  mode,
  primary,
  them,
  compareResult,
  targets,
  themTargets,
  extraFlags,
  tracked,
  track,
  untrack,
  locate,
}: {
  mode: string;
  primary: DocAnalysis;
  them: DocAnalysis | null;
  compareResult: CompareResult | null;
  targets: TargetAnalysis[];
  themTargets: TargetAnalysis[] | null;
  extraFlags: OverOptFlag[];
  tracked: Set<string>;
  track: (t: string) => void;
  untrack: (t: string) => void;
  locate?: (sentence: string) => void;
}) {
  const reduce = useReducedMotion();
  const suggestions = primary.distinctive.phrases
    .slice(0, 2)
    .concat(primary.distinctive.words.slice(0, 3))
    .map((t) => t.phrase)
    .filter((p) => !tracked.has(p))
    .slice(0, 4);
  return (
        <motion.div key={mode} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-4">
          <Verdict a={primary} extraFlags={extraFlags} compare={compareResult} />

          {compareResult && (
            <Section title={<>Term <span className="italic">gaps</span></>} meta={<span className="hidden sm:inline">{compareResult.missing.length} missing</span>} defaultOpen>
              <ComparePanel result={compareResult} tracked={tracked} onTrack={track} youLabel={primary.doc.url ?? "Your text"} themLabel={them?.doc.url ?? "Competitor"} />
            </Section>
          )}

          <Section
            title={<>Target <span className="italic">keyword{targets.length > 1 ? "s" : ""}</span></>}
            meta={targets.length ? <span className="hidden sm:inline">{targets.map((t) => t.keyword).join(", ")}</span> : <span className="hidden sm:inline">none yet</span>}
            defaultOpen
          >
            {targets.length ? (
              <TargetKeywordPanel results={targets} them={themTargets} onRemove={untrack} />
            ) : (
              <div className="space-y-3">
                <p className="text-[15px] leading-6 text-ds-ink-2">
                  Add a target keyword to see where it appears: title, H1, opening, meta description, URL, subheadings and image alt text, plus how it&apos;s spread through the text.
                </p>
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-ds-ink-2">
                    <span className="font-serif text-[17px] italic">from your text</span>
                    {suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => track(s)} className="glass-inset rounded-[10px] px-2.5 py-1 text-[13px] text-ds-ink-2 transition hover:bg-white/80 hover:text-ds-ink">
                        + {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title={<>Keywords &amp; <span className="italic">phrases</span></>} meta={<span className="hidden sm:inline">{ngramsFor(primary, 1).length.toLocaleString()} distinct words</span>} defaultOpen={mode !== "compare"}>
            <NgramTable analysis={primary} tracked={tracked} onTrack={track} />
          </Section>

          <Section title={<span className="italic">Readability</span>} meta={primary.readability.sentences ? <span>Grade {fmt(primary.readability.fleschKincaidGrade)}</span> : null}>
            <ReadabilityPanel key={primary.wordCount} r={primary.readability} onLocate={locate} />
          </Section>

          <Section title={<>Distinctive <span className="italic">terms</span></>} meta={<span className="hidden sm:inline">vs typical English</span>}>
            <DistinctiveTerms result={primary.distinctive} tracked={tracked} onTrack={track} />
          </Section>

          {primary.doc.source === "url" && (
            <Section title={<>What we <span className="italic">analysed</span></>} meta={<span className="hidden sm:inline">{primary.wordCount.toLocaleString()} words</span>}>
              <ExtractedContent analysis={primary} />
            </Section>
          )}
          {them && (
            <Section title={<>Competitor: what we <span className="italic">analysed</span></>} meta={<span className="hidden sm:inline">{them.wordCount.toLocaleString()} words</span>}>
              <ExtractedContent analysis={them} />
            </Section>
          )}
        </motion.div>
  );
});
