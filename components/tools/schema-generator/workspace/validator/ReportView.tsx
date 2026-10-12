"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { JsonLdBlock } from "@/lib/tools/pageExtract/types";
import type { FeatureSummary, SyntaxProblem, ValidatedItem, ValidationReport } from "@/lib/tools/validation/structuredDataValidator";
import { RULES_SOURCE_VERSION } from "@/lib/tools/validation/googleRichResultRules";
import { SCHEMA_PROPS_VERSION } from "@/lib/tools/validation/schemaPropsData";
import { ItemCard } from "@/components/tools/schema-generator/workspace/validator/ItemCard";
import { Mark, OutGlyph, Pill, verdictLabel } from "@/components/tools/schema-generator/workspace/validator/bits";

const EASE = [0.22, 1, 0.36, 1] as const;

function verdictCopy(r: ValidationReport): { head: string; body: string } {
  const t = r.totals;
  if (t.items === 0 && t.syntaxErrors === 0) return { head: "No structured data found.", body: "There is no JSON-LD, microdata or RDFa here. Build markup in the generator and paste it into the page's HTML." };
  if (t.items === 0 && t.syntaxErrors > 0) return { head: "The markup is broken.", body: "Every JSON-LD block failed to parse, so search engines ignore all of it. Fix the syntax errors below first." };
  const active = r.features.filter((f) => f.availability !== "retired");
  const retired = r.features.filter((f) => f.availability === "retired");
  if (t.invalid > 0) return { head: `${t.invalid} rich result${t.invalid > 1 ? "s" : ""} blocked.`, body: "Required fields are missing or invalid, so Google won't show these enhancements until they're fixed. The fixes are listed per item below." };
  if (t.syntaxErrors > 0) return { head: "Partly broken markup.", body: "Some JSON-LD blocks can't be parsed and are ignored entirely. The rest is checked below." };
  if (active.length > 0) {
    const schemaErrors = r.items.reduce((n, i) => n + i.issues.filter((x) => x.severity === "error").length, 0);
    return {
      head: `${t.eligible} rich result${t.eligible > 1 ? "s" : ""} eligible.`,
      body: schemaErrors
        ? `Google can use this markup, but ${schemaErrors} schema.org error${schemaErrors > 1 ? "s" : ""} (unknown properties or bad values) should be cleaned up.`
        : "Google can show these enhancements. Eligibility isn't a guarantee: Google decides per search whether to show them.",
    };
  }
  if (retired.length > 0) return { head: "Valid, but retired.", body: `Google no longer shows ${retired.map((f) => f.name).join(", ")} rich results. The markup is harmless and still describes the page to other systems.` };
  return { head: "Valid, no rich results.", body: "The markup describes the page, but none of these types produce a Google rich result on their own." };
}

function SyntaxCard({ problem, raw }: { problem: SyntaxProblem; raw?: string }) {
  const { error } = problem;
  return (
    <section className="glass rounded-[22px] p-5" role="alert">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f6d5cc]/70">
          <Mark kind="error" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-medium text-ds-ink">JSON-LD block {problem.blockIndex + 1} can&apos;t be parsed</h3>
          <p className="mt-0.5 text-[14px] text-ds-ink-2">
            {error.message} <span className="whitespace-nowrap font-mono text-[12.5px] text-ds-ink">line {error.line}, column {error.column}</span>
          </p>
          <pre className="mt-3 overflow-x-auto rounded-[14px] bg-[#2b2927] p-3 font-mono text-[12.5px] leading-5 text-[#f2ede4]">
            {error.excerpt.map((l) => (
              <span key={l.line} className="block">
                <span className="mr-3 inline-block w-8 select-none text-right text-[#8f8983]">{l.line}</span>
                {l.text || " "}
                {l.line === error.line && (
                  <span className="block">
                    <span className="mr-3 inline-block w-8 select-none" />
                    <span className="text-[#f2a97f]">{l.text.slice(0, Math.max(0, error.column - 1)).replace(/[^\t]/g, " ")}^</span>
                  </span>
                )}
              </span>
            ))}
          </pre>
          <p className="mt-2 text-[12.5px] text-ds-ink-2">Search engines ignore the whole block until this is fixed. Errors often sit just before the marked spot (a missing comma or quote on the previous line).</p>
          {raw && (
            <details className="mt-2 text-[13px]">
              <summary className="cursor-pointer select-none text-ds-ink-2 hover:text-ds-ink">Show the full block</summary>
              <pre className="mt-2 max-h-72 overflow-auto rounded-[14px] bg-white/60 p-3 font-mono text-[12px] leading-5 text-ds-ink">{raw}</pre>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ f, onJump }: { f: FeatureSummary; onJump: () => void }) {
  const v = verdictLabel(f.verdict, f.availability);
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <button type="button" onClick={onJump} className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-medium text-ds-ink">{f.name}</span>
        <span className="block text-[12.5px] text-ds-ink-2">
          {f.count} item{f.count > 1 ? "s" : ""} detected
          {f.invalid ? ` · ${f.invalid} with missing required fields` : ""}
          {f.withWarnings ? ` · ${f.withWarnings} can improve` : ""}
          {f.availability !== "active" && f.note ? ` · ${f.note}` : ""}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-3">
        <Pill tone={v.tone}>{v.text}</Pill>
        <a href={f.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-ds-ink-2 hover:text-ds-ink">
          Docs <OutGlyph />
        </a>
      </div>
    </li>
  );
}

export function ReportView({
  report,
  blocks,
  subject,
  onEdit,
}: {
  report: ValidationReport;
  /** Source blocks, for "show raw" views. */
  blocks: JsonLdBlock[];
  /** Host or "Pasted code". */
  subject: string;
  onEdit?: (item: ValidatedItem) => void;
}) {
  const reduce = useReducedMotion();
  const sortedItems = useMemo(() => [...report.items].sort((a, b) => b.errors - a.errors || b.features.length - a.features.length), [report.items]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(sortedItems.slice(0, 1).map((i) => i.key)));
  const v = verdictCopy(report);
  const words = v.head.replace(/\.$/, "").split(" ");
  const counts = {
    jsonld: report.items.filter((i) => i.source === "json-ld").length,
    micro: report.items.filter((i) => i.source === "microdata").length,
    rdfa: report.items.filter((i) => i.source === "rdfa").length,
  };

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const jump = (key: string) => {
    setOpen((prev) => new Set(prev).add(key));
    requestAnimationFrame(() => document.getElementById(`sd-item-${key}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-5">
      <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.45),transparent)] print:hidden" />
        <div className="relative">
          <h2 className="font-serif text-[40px] leading-[0.98] text-ds-ink sm:text-[52px]">
            {words.slice(0, -1).join(" ")} <span className="italic">{words.slice(-1)}.</span>
          </h2>
          <p className="mt-3 max-w-[620px] text-[15.5px] leading-6 text-ds-ink-2">{v.body}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-[12.5px]">
            {[
              subject,
              `${report.totals.items} item${report.totals.items === 1 ? "" : "s"}`,
              counts.jsonld ? `${counts.jsonld} JSON-LD` : null,
              counts.micro ? `${counts.micro} microdata` : null,
              counts.rdfa ? `${counts.rdfa} RDFa` : null,
              `${report.totals.errors} error${report.totals.errors === 1 ? "" : "s"}`,
              `${report.totals.warnings} warning${report.totals.warnings === 1 ? "" : "s"}`,
            ]
              .filter(Boolean)
              .map((p) => (
                <span key={p} className="glass-inset rounded-[10px] px-2.5 py-1 text-ds-ink-2">
                  {p}
                </span>
              ))}
          </div>
        </div>
      </section>

      {report.features.length > 0 && (
        <section className="glass overflow-hidden rounded-[22px]">
          <h3 className="border-b border-white/70 px-4 py-3 text-[15px] font-medium text-ds-ink sm:px-5">Google rich results on this {subject === "Pasted code" ? "code" : "page"}</h3>
          <ul className="divide-y divide-white/70">
            {report.features.map((f) => (
              <FeatureRow key={f.id} f={f} onJump={() => jump(f.itemKeys[0])} />
            ))}
          </ul>
        </section>
      )}

      {report.syntaxErrors.map((s) => (
        <SyntaxCard key={s.blockIndex} problem={s} raw={blocks.find((b) => b.index === s.blockIndex)?.raw} />
      ))}

      <div className="space-y-3">
        {sortedItems.map((item) => (
          <ItemCard key={item.key} item={item} open={open.has(item.key)} onToggle={() => toggle(item.key)} onEdit={onEdit} />
        ))}
      </div>

      {(report.notes.length > 0 || blocks.length > 0) && (
        <details className="glass rounded-[22px] px-4 py-3 text-[13.5px] sm:px-5">
          <summary className="cursor-pointer select-none text-ds-ink-2 hover:text-ds-ink">
            Source and notes{blocks.length ? ` · ${blocks.length} JSON-LD block${blocks.length > 1 ? "s" : ""}` : ""}
            {report.notes.length ? ` · ${report.notes.length} note${report.notes.length > 1 ? "s" : ""}` : ""}
          </summary>
          <div className="mt-3 space-y-3">
            {report.notes.length > 0 && (
              <ul className="space-y-1">
                {report.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-ds-ink-2">
                    <Mark kind="info" className="mt-0.5" /> {n}
                  </li>
                ))}
              </ul>
            )}
            {blocks.map((b) => (
              <div key={b.index}>
                <p className="mb-1 text-[12.5px] text-ds-ink-2">
                  Block {b.index + 1} · {b.ok ? "parsed" : "syntax error"} · {b.raw.length.toLocaleString()} characters
                </p>
                <pre className="max-h-64 overflow-auto rounded-[14px] bg-white/60 p-3 font-mono text-[12px] leading-5 text-ds-ink">{b.ok ? JSON.stringify(b.data, null, 2) : b.raw}</pre>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="text-[12px] leading-5 text-ds-ink-3">
        Checked against {SCHEMA_PROPS_VERSION} and Google Search Central documentation as of {RULES_SOURCE_VERSION.googleDocsCheckedOn}. Eligibility means the markup qualifies; Google decides per query whether to show a rich result. Content
        guidelines (e.g. markup must match visible content) can&apos;t be verified automatically.
      </p>
    </motion.div>
  );
}
