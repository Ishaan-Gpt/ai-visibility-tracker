"use client";

import { useState } from "react";
import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { subheadings } from "@/lib/tools/keywordDensity/document";

const SOURCE: Record<string, string> = {
  main: "the page's <main> element",
  article: "the page's <article> element",
  "role-main": 'the element marked role="main"',
  density: "the densest block of text (no <main> or <article> found)",
  body: "the whole page body (no main content area found, so menus may be included)",
};

/** What was actually analysed for a URL, so the numbers can be trusted (or questioned). */
export function ExtractedContent({ analysis }: { analysis: DocAnalysis }) {
  const [showText, setShowText] = useState(false);
  const d = analysis.doc;
  const subs = subheadings(d);
  const imgs = d.images ?? [];
  const rows: [string, string][] = [
    ["Page", d.url ?? "–"],
    ["Content taken from", d.contentSource ? SOURCE[d.contentSource] ?? d.contentSource : "–"],
    ["Words analysed", `${analysis.wordCount.toLocaleString()} (navigation, header, footer and sidebars removed)`],
    ["Title tag", d.title ?? "None"],
    ["Meta description", d.metaDescription ?? "None"],
    ["H1", d.h1.length ? d.h1.join(" | ") : "None"],
    ["Subheadings", subs.length ? `${subs.length} (H2–H3)` : "None"],
    ["Images in content", imgs.length ? `${imgs.length}, ${imgs.filter((i) => !i.alt || !i.alt.trim()).length} without alt text` : "None"],
    ["Language", d.lang ?? "Not declared"],
  ];
  return (
    <div className="space-y-4">
      <dl className="grid overflow-hidden rounded-[16px] bg-white/35 sm:grid-cols-[190px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="px-4 pt-3 text-[13px] text-ds-ink-3 sm:border-b sm:border-white/70 sm:py-2.5">{k}</dt>
            <dd className="break-words border-b border-white/70 px-4 pb-3 text-[14px] text-ds-ink sm:py-2.5">{v}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={() => setShowText(!showText)} aria-expanded={showText} className="text-[14px] font-medium text-ds-accent-ink underline-offset-4 hover:underline">
        {showText ? "Hide extracted text" : "View extracted text"}
      </button>
      {showText && (
        <div className="max-h-[420px] overflow-auto rounded-[16px] bg-white/50 p-4 text-[14px] leading-6 text-ds-ink">
          {d.blocks.map((b, i) =>
            /^h[1-6]$/.test(b.type) ? (
              <p key={i} className="mb-2 mt-4 font-medium first:mt-0">
                <span className="mr-2 font-mono text-[11px] uppercase text-ds-ink-3">{b.type}</span>
                {b.text}
              </p>
            ) : (
              <p key={i} className={`mb-2 ${b.type === "li" ? "pl-4 before:-ml-3 before:mr-1.5 before:text-ds-ink-3 before:content-['•']" : ""}`}>
                {b.text}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}
