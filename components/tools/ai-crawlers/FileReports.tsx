"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevron as ChevronDown } from "@/components/icons/Icons";
import { SeverityIcon } from "@/components/ds/extras";
import type { AiCrawlerReport } from "@/lib/tools/aiCrawlers/check";
import { Facts, kb } from "./parts";

const SEV = { error: "error", warning: "warning", info: "info" } as const;

function Panel({ title, accent, meta, open, children }: { title: string; accent: string; meta: ReactNode; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} data-print-card className="group/d glass rounded-[20px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="font-serif text-[22px]">
          {title} <span className="italic">{accent}</span>
        </span>
        <span className="flex items-center gap-3 text-[13px] text-ds-ink-2">
          {meta}
          <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open/d:rotate-180" />
        </span>
      </summary>
      <div className="space-y-4 border-t border-white/60 px-5 py-4">{children}</div>
    </details>
  );
}

function Chip({ tone, children }: { tone: "good" | "warn" | "bad" | "plain"; children: ReactNode }) {
  const cls = { good: "text-ds-success", warn: "rounded-full bg-ds-accent-soft px-2 py-0.5 text-ds-accent-ink", bad: "rounded-full bg-[#f6d5cc]/80 px-2 py-0.5 text-[#b23a2a]", plain: "text-ds-ink-3" }[tone];
  return <span className={cls}>{children}</span>;
}

function IssueList({ issues }: { issues: { level: "error" | "warning" | "info"; line: number | null; message: string }[] }) {
  if (!issues.length) return <p className="text-[14px] text-ds-success">No problems found.</p>;
  return (
    <ul className="space-y-2">
      {issues.map((l, i) => (
        <li key={i} className="flex items-start gap-3 text-[14px] leading-5">
          <SeverityIcon severity={SEV[l.level]} />
          <span className="pt-0.5">
            {l.line && <span className="mr-2 font-mono text-[12px] text-ds-ink-3">line {l.line}</span>}
            {l.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function RobotsReport({ report }: { report: AiCrawlerReport }) {
  const r = report.robots;
  const lint = r.lint ?? [];
  const errors = lint.filter((l) => l.level === "error").length;
  const warns = lint.filter((l) => l.level === "warning").length;
  const lintLines = new Set(lint.filter((l) => l.level !== "info").map((l) => l.line));
  const lines = typeof r.text === "string" && r.text ? r.text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/) : [];
  const sitemaps = report.sitemaps ?? [];
  const tone = r.semantics === "disallow-all" ? "bad" : errors ? "bad" : warns ? "warn" : "good";

  return (
    <Panel
      title="robots.txt"
      accent="details"
      open={r.semantics === "disallow-all" || errors > 0}
      meta={
        <Chip tone={tone}>
          {r.status ?? "no response"}
          {r.found ? ` · ${kb(r.bytes)}` : ""}
          {lint.length ? ` · ${errors} error${errors === 1 ? "" : "s"}, ${warns} warning${warns === 1 ? "" : "s"}` : r.found ? " · clean" : ""}
        </Chip>
      }
    >
      <Facts
        rows={[
          ["URL", r.finalUrl && r.finalUrl !== r.url ? `${r.url} → ${r.finalUrl}` : r.url],
          ["What crawlers do", r.semanticsNote ?? (r.found ? "Rules apply." : "No robots.txt: everything allowed.")],
          ...(r.redirects?.length ? ([["Redirects", r.redirects.join(" → ")]] as [string, ReactNode][]) : []),
          ...(r.browserStatus !== undefined ? ([["With a browser UA", r.browserStatus === null ? "no response" : `HTTP ${r.browserStatus}`]] as [string, ReactNode][]) : []),
          ...(r.contentType ? ([["Content-Type", r.contentType]] as [string, ReactNode][]) : []),
          ...(r.groups !== undefined && r.found ? ([["Groups", `${r.groups} user-agent group${r.groups === 1 ? "" : "s"}${r.truncated ? " (file over 500 KiB, rest ignored)" : ""}`]] as [string, ReactNode][]) : []),
          ["Sitemaps declared", r.sitemaps.length ? r.sitemaps.join("  ") : "None"],
          ...(r.licenses?.length ? ([["RSL License", r.licenses.join("  ")]] as [string, ReactNode][]) : []),
          ...(r.contentSignals?.length
            ? ([["Content-Signal", r.contentSignals.map((c) => `${c.agents.join(", ")}: ${Object.entries(c.signals).map(([k, v]) => `${k}=${v ? "yes" : "no"}`).join(", ")}`).join("; ")]] as [string, ReactNode][])
            : []),
        ]}
      />

      {r.found && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ds-ink">Lint (RFC 9309 and Google&apos;s parser)</p>
          <IssueList issues={lint} />
        </div>
      )}

      {sitemaps.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ds-ink">Sitemaps</p>
          <ul className="space-y-1.5">
            {sitemaps.map((s) => (
              <li key={s.url} className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
                <span className="min-w-0 break-all font-mono text-[12.5px] text-ds-ink">
                  {s.url}
                  {!s.declared && <span className="ml-2 font-sans text-ds-ink-3">(not declared, checked by default)</span>}
                </span>
                <span className={s.isXml ? "text-ds-success" : "text-[#b23a2a]"}>
                  {s.status ?? "no response"}
                  {s.isXml ? ` · ${s.kind === "index" ? "sitemap index" : "urlset"} · ${s.locs}${s.truncated ? "+" : ""} URLs` : s.note ? ` · ${s.note}` : " · not a sitemap"}
                </span>
              </li>
            ))}
          </ul>
          {report.samples?.paths.length ? (
            <p className="mt-2 text-[12.5px] leading-5 text-ds-ink-3">
              {report.samples.paths.length} URLs sampled from {report.samples.source} were tested against every crawler&apos;s rules (shown in each crawler&apos;s details).
            </p>
          ) : null}
        </div>
      )}

      {lines.length > 0 && (
        <details className="[&_summary::-webkit-details-marker]:hidden">
          <summary className="cursor-pointer list-none text-[13px] text-ds-ink-2 underline decoration-dotted underline-offset-4 hover:text-ds-ink">
            View the file ({lines.length} lines{r.textCapped ? ", first 120 KB" : ""})
          </summary>
          <pre className="glass-inset mt-2 max-h-[420px] overflow-auto rounded-[12px] py-2 font-mono text-[12.5px] leading-5">
            {lines.slice(0, 1500).map((l, i) => (
              <div key={i} className={`flex ${lintLines.has(i + 1) ? "bg-[#f7e2c4]/70" : ""}`}>
                <span className="w-12 shrink-0 select-none pr-3 text-right text-ds-ink-3">{i + 1}</span>
                <span className="whitespace-pre-wrap break-all pr-3 text-ds-ink">{l || " "}</span>
              </div>
            ))}
          </pre>
        </details>
      )}
    </Panel>
  );
}

export function LlmsReport({ report }: { report: AiCrawlerReport }) {
  const l = report.llmsTxt;
  const v = l.validation;
  const errors = v?.counts?.error ?? v?.issues.filter((i) => i.level === "error").length ?? 0;
  const warns = v?.counts?.warning ?? v?.issues.filter((i) => i.level === "warning").length ?? 0;
  const ctype = l.contentType ?? "";
  return (
    <Panel
      title="llms.txt"
      accent="check"
      meta={
        <Chip tone={!l.found ? "plain" : errors ? "bad" : warns ? "warn" : "good"}>
          {!l.found ? "Not found" : v ? `${v.sections.length} sections · ${v.linkCount} links${errors + warns ? ` · ${errors + warns} issue${errors + warns === 1 ? "" : "s"}` : ""}` : "Found"}
        </Chip>
      }
    >
      {!l.found ? (
        <p className="text-[14px] leading-6 text-ds-ink">
          No llms.txt at {l.url}
          {l.status ? ` (HTTP ${l.status})` : ""}. It is a proposed convention (llmstxt.org) with uneven adoption by AI vendors, so it is optional.{" "}
          <Link href="/tools/llms-txt-generator" className="font-medium text-ds-accent-ink underline underline-offset-2">
            Build one
          </Link>
          .
        </p>
      ) : (
        <>
          <Facts
            rows={[
              ["URL", l.url],
              ["Size", kb(l.bytes)],
              ...(ctype ? ([["Content-Type", `${ctype}${/html/i.test(ctype) ? " (should be text/plain or text/markdown)" : ""}`]] as [string, ReactNode][]) : []),
              ...(v ? ([["Title (H1)", v.title ?? "Missing"], ["Summary", v.summary ?? "None"]] as [string, ReactNode][]) : []),
              ["llms-full.txt", l.full ? (l.full.found ? `Found${l.full.bytes ? `, ${kb(l.full.bytes)}` : ""}` : `Not found${l.full.status ? ` (HTTP ${l.full.status})` : ""}`) : "Not checked"],
            ]}
          />
          {v && v.sections.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ds-ink">Sections</p>
              <ul className="flex flex-wrap gap-2">
                {v.sections.map((s) => (
                  <li key={`${s.line}-${s.title}`} className="glass-inset rounded-[10px] px-2.5 py-1 text-[12.5px] text-ds-ink">
                    {s.title || "(untitled)"} <span className="text-ds-ink-3">· {s.links.length}</span>
                    {s.optional && <span className="ml-1 text-ds-accent-ink">optional</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {v && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ds-ink">Format check (llmstxt.org)</p>
              <IssueList issues={v.issues} />
            </div>
          )}
          {l.linkChecks && l.linkChecks.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ds-ink">Sampled links</p>
              <ul className="space-y-1">
                {l.linkChecks.map((c) => (
                  <li key={c.url} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span className="min-w-0 break-all font-mono text-ds-ink">{c.url}</span>
                    <span className={c.ok ? "text-ds-success" : "text-[#b23a2a]"}>{c.status ?? "no response"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export function SignalsReport({ report }: { report: AiCrawlerReport }) {
  const s = report.signals;
  if (!s) return null;
  const snippet = s.noindex
    ? "noindex: removed from search and AI Overviews"
    : s.nosnippet
      ? "nosnippet: no text in snippets or AI Overviews"
      : s.maxSnippet === 0
        ? "max-snippet:0: no text in snippets or AI Overviews"
        : s.maxSnippet !== null && s.maxSnippet >= 0
          ? `max-snippet:${s.maxSnippet}`
          : "No restrictions";
  const restricted = s.noindex || s.nosnippet || s.maxSnippet === 0;
  return (
    <Panel title="Other AI" accent="signals" meta={<Chip tone={restricted ? "bad" : "good"}>{restricted ? "Snippets restricted" : "Snippets allowed"}</Chip>}>
      <Facts
        rows={[
          ["Homepage directives", s.directives.length ? s.directives.map((d) => `${d.source.replace("meta:", "meta ").replace("header:", "")}: ${d.value}`).join("  ·  ") : "None (defaults apply)"],
          ["Snippets / AI Overviews", snippet],
          ["noai / noimageai", s.noai || s.noimageai ? `${[s.noai && "noai", s.noimageai && "noimageai"].filter(Boolean).join(", ")} (non-standard, not documented by major AI vendors)` : "Not set"],
          ["data-nosnippet", s.dataNosnippet ? `${s.dataNosnippet} element${s.dataNosnippet === 1 ? "" : "s"}` : "None"],
          ["TDM reservation", s.tdmReservation ? `tdm-reservation: ${s.tdmReservation}${s.tdmPolicy ? ` · policy ${s.tdmPolicy}` : ""}` : s.tdmrep.found ? `tdmrep.json found` : "Not declared"],
          ["ai.txt", s.aiTxt.found ? `Found (${kb(s.aiTxt.bytes)})` : "Not found"],
        ]}
      />
      <p className="text-[12.5px] leading-5 text-ds-ink-3">
        Read from the homepage&apos;s meta robots tags and X-Robots-Tag header. Google applies nosnippet and max-snippet to AI Overviews and AI Mode; other AI vendors rely on
        robots.txt.
      </p>
    </Panel>
  );
}
