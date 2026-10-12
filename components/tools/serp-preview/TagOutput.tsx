"use client";

import { useState } from "react";
import { IconCopy, IconTick } from "@/components/icons/Icons";
import { buttonClass } from "@/components/ds/primitives";
import { renderBlock, type TagLine } from "./tagBlock";
import { SectionTitle, Toggle } from "./ui";

/** Tiny highlighter: tag names, attribute names and values in three quiet tones. */
function Highlight({ line }: { line: string }) {
  if (line.startsWith("<!--")) return <span className="text-ds-ink-3">{line}</span>;
  const parts = line.split(/("[^"]*")/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('"') ? (
          <span key={i} className="text-[#7a4a22]">
            {p}
          </span>
        ) : (
          <span key={i} className="text-ds-ink">
            {p.split(/(<\/?[a-z]+|[a-z:-]+(?==))/g).map((q, k) =>
              /^<\/?[a-z]+$/.test(q) ? (
                <span key={k} className="text-[#a5552d]">
                  {q}
                </span>
              ) : /^[a-z:-]+$/.test(q) && k % 2 === 1 ? (
                <span key={k} className="text-[#5c7c68]">
                  {q}
                </span>
              ) : (
                q
              ),
            )}
          </span>
        ),
      )}
    </>
  );
}

export function TagOutput({ lines, live }: { lines: TagLine[]; live: boolean }) {
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const shown = live && onlyDiff ? lines.filter((l) => l.status !== "same") : lines;
  const text = renderBlock(shown);
  const changes = lines.filter((l) => l.status && l.status !== "same").length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the text is selectable */
    }
  };

  const textLines = text ? text.split("\n") : [];
  // Map rendered lines back to their status for the gutter marks.
  const statusFor = new Map(shown.map((l) => [l.html, l.status]));

  return (
    <section>
      <SectionTitle lead="Your <head>," accent="ready to paste">
        <div className="flex flex-wrap items-center gap-3">
          {live && <Toggle id="sp-onlydiff" checked={onlyDiff} onChange={setOnlyDiff} label={`Only missing or changed (${changes})`} />}
          <button type="button" onClick={copy} className={buttonClass("primary", "sm")} disabled={!text}>
            {copied ? <IconTick className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy tags"}
          </button>
        </div>
      </SectionTitle>
      <div className="glass overflow-hidden rounded-[22px]">
        {live && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-white/60 px-4 py-2.5 text-[12.5px] text-ds-ink-2 sm:px-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ds-success" /> Missing on the live page
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ds-accent" /> Different from the live page
            </span>
          </div>
        )}
        {textLines.length ? (
          <pre className="max-h-[440px] overflow-auto py-3 font-mono text-[12.5px] leading-[22px]">
            {textLines.map((l, i) => {
              const st = statusFor.get(l);
              return (
                <div key={i} className="flex min-w-0 gap-3 pl-3 pr-4 sm:pl-4">
                  <span aria-hidden className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full ${st === "missing" ? "bg-ds-success" : st === "changed" ? "bg-ds-accent" : "bg-transparent"}`} />
                  <code className="min-w-0 whitespace-pre-wrap break-all">
                    <Highlight line={l} />
                  </code>
                </div>
              );
            })}
          </pre>
        ) : (
          <p className="px-5 py-6 text-[14px] text-ds-ink-2">Nothing missing: the live page already has every tag with these values.</p>
        )}
      </div>
    </section>
  );
}
