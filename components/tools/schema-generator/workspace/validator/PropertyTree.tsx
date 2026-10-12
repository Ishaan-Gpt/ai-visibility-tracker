"use client";

import { useState } from "react";
import type { SdIssue } from "@/lib/tools/validation/structuredDataValidator";
import { Mark } from "@/components/tools/schema-generator/workspace/validator/bits";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

const prettyKey = (k: string) => k.replace(/^https?:\/\/(www\.)?schema\.org\//i, "").replace(/^schema:/i, "");
const join = (path: string, key: string) => (path ? `${path}.${key}` : key);

function flatten(v: unknown): unknown[] {
  if (Array.isArray(v)) return v.flatMap(flatten);
  if (isObj(v) && "@list" in v) return flatten(v["@list"]);
  return [v];
}

function worst(issues: SdIssue[] | undefined): SdIssue["severity"] | null {
  if (!issues?.length) return null;
  if (issues.some((i) => i.severity === "error")) return "error";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return "info";
}

function typeLabel(v: Obj): string {
  const t = v["@type"];
  const list = Array.isArray(t) ? t : t ? [t] : [];
  return list.map((x) => String(x).replace(/^https?:\/\/(www\.)?schema\.org\//i, "")).join(", ");
}

function Scalar({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false);
  if (value === null) return <span className="text-ds-ink-3">null</span>;
  if (typeof value === "boolean" || typeof value === "number") return <span className="font-mono text-[12.5px] text-[#4c6b57]">{String(value)}</span>;
  const s = String(value);
  if (s.trim() === "") return <span className="italic text-ds-ink-3">empty</span>;
  const isUrl = /^https?:\/\//.test(s);
  const long = s.length > 160;
  const shown = long && !open ? `${s.slice(0, 160)}…` : s;
  return (
    <span className="break-words [overflow-wrap:anywhere]">
      {isUrl ? (
        <a href={s} target="_blank" rel="noreferrer nofollow" className="text-ds-accent-ink underline decoration-ds-accent/40 underline-offset-2 hover:decoration-ds-accent-ink">
          {shown}
        </a>
      ) : (
        <span className="text-ds-ink">{shown}</span>
      )}
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="ml-1.5 text-[12px] text-ds-ink-2 underline underline-offset-2 hover:text-ds-ink">
          {open ? "less" : "more"}
        </button>
      )}
    </span>
  );
}

function Node({ value, path, issuesByPath, depth }: { value: Obj; path: string; issuesByPath: Map<string, SdIssue[]>; depth: number }) {
  const entries = Object.entries(value).filter(([k]) => k !== "@context" && k !== "@type");
  return (
    <ul className={depth > 0 ? "ml-2 border-l border-white/80 pl-3" : ""}>
      {typeof value["@id"] === "string" && entries.length === 1 && (
        <li className="py-0.5 text-[13px] text-ds-ink-2">
          → reference <span className="font-mono text-[12px] text-ds-ink">{String(value["@id"])}</span>
        </li>
      )}
      {entries.map(([k, v]) => {
        if (k === "@id" && entries.length === 1) return null;
        const key = prettyKey(k);
        const items = flatten(v);
        return items.map((item, i) => {
          const p = k.startsWith("@") ? join(path, k) : join(path, items.length > 1 ? `${key}[${i}]` : key);
          return <Row key={`${k}-${i}`} k={items.length > 1 ? `${key} [${i + 1}]` : key} value={item} path={p} issuesByPath={issuesByPath} depth={depth} />;
        });
      })}
    </ul>
  );
}

function Row({ k, value, path, issuesByPath, depth }: { k: string; value: unknown; path: string; issuesByPath: Map<string, SdIssue[]>; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const issues = issuesByPath.get(path);
  const sev = worst(issues);
  const nested = isObj(value) && !("@value" in value);
  const scalar = isObj(value) && "@value" in value ? value["@value"] : value;
  return (
    <li className="py-[3px]">
      <div className="flex min-w-0 items-start gap-2 text-[13px] leading-5">
        {nested ? (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="-ml-1 flex min-w-0 shrink-0 items-center gap-1 rounded-md px-1 text-left text-ds-ink-2 hover:bg-white/60 hover:text-ds-ink">
            <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} aria-hidden><path d="m4 6.2 4 3.9 4.1-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="font-mono text-[12.5px] text-ds-ink">{k}</span>
          </button>
        ) : (
          <span className="shrink-0 font-mono text-[12.5px] text-ds-ink-2">{k}</span>
        )}
        {sev && <Mark kind={sev} className="mt-0.5" />}
        {nested ? (
          <span className="min-w-0 truncate text-[12px] text-ds-ink-3">{typeLabel(value as Obj) || (typeof (value as Obj)["@id"] === "string" ? "reference" : "object")}</span>
        ) : (
          <span className="min-w-0 flex-1">
            <Scalar value={scalar} />
          </span>
        )}
      </div>
      {issues && (
        <ul className="mb-1 ml-1 mt-0.5 space-y-0.5">
          {issues.map((i, n) => (
            <li key={n} className={`text-[12px] leading-[18px] ${i.severity === "error" ? "text-[#a3392b]" : i.severity === "warning" ? "text-[#94600f]" : "text-ds-ink-2"}`}>
              {i.message}
            </li>
          ))}
        </ul>
      )}
      {nested && open && <Node value={value as Obj} path={path} issuesByPath={issuesByPath} depth={depth + 1} />}
    </li>
  );
}

/** Read-only tree of an item, like the right pane of validator.schema.org, with issues pinned to the property they concern. */
export function PropertyTree({ node, issues }: { node: Obj; issues: SdIssue[] }) {
  const issuesByPath = new Map<string, SdIssue[]>();
  for (const i of issues) {
    if (!i.path) continue;
    const list = issuesByPath.get(i.path) ?? [];
    list.push(i);
    issuesByPath.set(i.path, list);
  }
  return (
    <div className="min-w-0 overflow-x-auto">
      <Node value={node} path="" issuesByPath={issuesByPath} depth={0} />
    </div>
  );
}
