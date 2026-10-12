"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ItemFeature, SdIssue, ValidatedItem } from "@/lib/tools/validation/structuredDataValidator";
import { Chevron, EditGlyph, Mark, OutGlyph, Pill, verdictLabel } from "@/components/tools/schema-generator/workspace/validator/bits";
import { PropertyTree } from "@/components/tools/schema-generator/workspace/validator/PropertyTree";

const EASE = [0.22, 1, 0.36, 1] as const;

const SOURCE_LABEL = { "json-ld": "JSON-LD", microdata: "Microdata", rdfa: "RDFa" } as const;

function sourceLine(item: ValidatedItem) {
  if (item.source === "json-ld") return `JSON-LD block ${(item.blockIndex ?? 0) + 1}${item.locator && item.locator !== "(root)" ? ` · ${item.locator}` : ""}`;
  return `${SOURCE_LABEL[item.source]} · ${item.locator}`;
}

function FeatureBlock({ f }: { f: ItemFeature }) {
  const v = verdictLabel(f.verdict, f.feature.availability);
  const required = f.rules.filter((r) => r.weight === "required");
  const recommended = f.rules.filter((r) => r.weight === "recommended");
  const missing = recommended.filter((r) => !r.passed);
  const retired = f.feature.availability === "retired";
  return (
    <div className="rounded-[16px] bg-white/45 p-4 ring-1 ring-white/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-ds-ink">
            {f.feature.id === "retired-misc" ? `${f.entityType} rich result` : f.feature.name}
            {f.path && <span className="ml-2 font-mono text-[11.5px] font-normal text-ds-ink-3">{f.path}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={v.tone}>{v.text}</Pill>
          <a href={f.feature.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-ds-ink-2 hover:text-ds-ink" title="Google's documentation">
            Docs <OutGlyph />
          </a>
        </div>
      </div>
      {f.feature.note && <p className={`mt-2 text-[13px] leading-5 ${retired ? "text-ds-ink" : "text-ds-ink-2"}`}>{f.feature.note}</p>}
      {f.rules.length > 0 && (
        <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {required.length > 0 && (
            <ul className="space-y-1">
              <li className="text-[12px] text-ds-ink-3">Required</li>
              {required.map((r) => (
                <li key={r.label} className="flex items-start gap-2 text-[13px] leading-5">
                  <Mark kind={r.passed ? "pass" : retired ? "info" : "fail-required"} className="mt-0.5" />
                  <span className={r.passed ? "text-ds-ink-2" : "text-ds-ink"}>
                    {r.label}
                    {!r.passed && r.hint && <span className="block text-[12px] text-ds-ink-2">{r.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {recommended.length > 0 && (
            <ul className="space-y-1">
              <li className="text-[12px] text-ds-ink-3">
                Recommended {missing.length > 0 ? `· ${missing.length} missing` : "· all set"}
              </li>
              {recommended.map((r) => (
                <li key={r.label} className="flex items-start gap-2 text-[13px] leading-5">
                  <Mark kind={r.passed ? "pass" : "fail-recommended"} className="mt-0.5" />
                  <span className={r.passed ? "text-ds-ink-2" : "text-ds-ink"}>
                    {r.label}
                    {!r.passed && r.hint && <span className="block text-[12px] text-ds-ink-2">{r.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function IssueList({ issues }: { issues: SdIssue[] }) {
  const order = { error: 0, warning: 1, info: 2 } as const;
  const sorted = [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <ul className="divide-y divide-white/70 overflow-hidden rounded-[16px] bg-white/45 ring-1 ring-white/70">
      {sorted.map((i, n) => (
        <li key={n} className="flex items-start gap-3 px-4 py-2.5">
          <Mark kind={i.severity} className="mt-[3px]" />
          <div className="min-w-0 text-[13.5px] leading-5">
            {i.path && <span className="mr-2 font-mono text-[12px] text-ds-ink-2">{i.path}</span>}
            <span className="text-ds-ink">{i.message}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ItemCard({
  item,
  open,
  onToggle,
  onEdit,
}: {
  item: ValidatedItem;
  open: boolean;
  onToggle: () => void;
  onEdit?: (item: ValidatedItem) => void;
}) {
  const schemaIssues = item.issues.filter((i) => i.severity !== "info");
  const infos = item.issues.filter((i) => i.severity === "info");
  const typeText = item.types.length ? item.types.join(" · ") : "Untyped item";
  return (
    <section id={`sd-item-${item.key}`} className="glass overflow-hidden rounded-[22px] scroll-mt-24">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 basis-full items-center gap-3 text-left sm:basis-0">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${item.errors ? "bg-[#f6d5cc]/70" : item.warnings ? "bg-[#f7e2c4]/70" : "bg-[#dbe6dc]/80"}`}>
            <Mark kind={item.errors ? "error" : item.warnings ? "warning" : "pass"} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-medium tracking-[-0.01em] text-ds-ink">{typeText}</span>
            <span className="block truncate text-[12.5px] text-ds-ink-2">
              {item.title ? `${item.title} · ` : ""}
              {sourceLine(item)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:pl-12">
          {item.errors > 0 && <Pill tone="error">{item.errors} error{item.errors > 1 ? "s" : ""}</Pill>}
          {item.warnings > 0 && <Pill tone="warning">{item.warnings} warning{item.warnings > 1 ? "s" : ""}</Pill>}
          {item.errors === 0 && item.warnings === 0 && <Pill tone="pass">Valid</Pill>}
          {item.template && onEdit && (
            <button type="button" onClick={() => onEdit(item)} className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-white/70 px-2.5 text-[12.5px] text-ds-ink ring-1 ring-white transition hover:bg-white" title="Load this item into the generator form">
              <EditGlyph /> Edit in generator
            </button>
          )}
          <button type="button" onClick={onToggle} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-ds-ink-2 hover:bg-white/60" aria-label={open ? "Collapse" : "Expand"}>
            <Chevron open={open} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <div className="grid gap-5 border-t border-white/70 px-4 py-5 sm:px-5 lg:grid-cols-[1.1fr_1fr]">
              <div className="min-w-0 space-y-4">
                {item.features.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-[14px] font-medium text-ds-ink">Google rich results</h4>
                    {item.features.map((f, i) => (
                      <FeatureBlock key={`${f.feature.id}-${i}`} f={f} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-[16px] bg-white/45 px-4 py-3 text-[13.5px] text-ds-ink-2 ring-1 ring-white/70">
                    No Google rich result uses this type on its own. It can still help search engines and AI systems understand the page.
                  </p>
                )}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-medium text-ds-ink">schema.org checks</h4>
                  {schemaIssues.length === 0 ? (
                    <p className="flex items-center gap-2 text-[13.5px] text-ds-ink-2">
                      <Mark kind="pass" /> Types, properties and values follow the schema.org vocabulary.
                    </p>
                  ) : (
                    <IssueList issues={schemaIssues} />
                  )}
                  {infos.length > 0 && (
                    <details className="group text-[13px] text-ds-ink-2">
                      <summary className="cursor-pointer list-none select-none hover:text-ds-ink">
                        {infos.length} note{infos.length > 1 ? "s" : ""} <span className="text-ds-ink-3 group-open:hidden">· show</span>
                      </summary>
                      <div className="mt-2">
                        <IssueList issues={infos} />
                      </div>
                    </details>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 text-[14px] font-medium text-ds-ink">Detected properties</h4>
                <div className="max-h-[560px] overflow-auto rounded-[16px] bg-white/45 p-3 ring-1 ring-white/70">
                  <PropertyTree node={item.node} issues={item.issues} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
