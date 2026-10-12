"use client";

import type { Ref } from "react";
import { inputClass } from "@/components/ds/primitives";

/** Paste box for text, Markdown or HTML. Live word count; "# " lines and <h1>-<h6> count as headings. */
export function ContentInput({
  content,
  onContentChange,
  wordCount,
  textareaRef,
  onSample,
  label = "Your text",
}: {
  content: string;
  onContentChange: (value: string) => void;
  wordCount: number;
  textareaRef?: Ref<HTMLTextAreaElement>;
  onSample?: () => void;
  label?: string;
}) {
  return (
    <div>
      <label htmlFor="kd-content" className="mb-1.5 block text-[13.5px] text-ds-ink-2">
        {label}
      </label>
      <textarea
        id="kd-content"
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows={12}
        spellCheck={false}
        placeholder={"Paste an article, a draft or a page's HTML.\n\n# Use a markdown heading for the H1\n## And ## for subheadings"}
        className="glass-inset block min-h-[220px] w-full resize-y rounded-[18px] p-4 text-[15px] leading-7 text-ds-ink outline-none transition-[box-shadow,background-color] duration-300 placeholder:text-ds-ink-3 selection:bg-ds-accent/50 focus:bg-white/70 sm:p-5"
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 text-[13px] text-ds-ink-2">
        <span className="tabular-nums">
          <span className="font-serif text-[17px] text-ds-ink">{wordCount.toLocaleString()}</span> words
        </span>
        <span className="text-ds-ink-3">Analysed as you type, in your browser.</span>
        <span className="ml-auto flex gap-1">
          {onSample && (
            <button type="button" onClick={onSample} className="rounded-[8px] px-2 py-1 transition hover:bg-white/60 hover:text-ds-ink">
              Try a sample
            </button>
          )}
          {content && (
            <button type="button" onClick={() => onContentChange("")} className="rounded-[8px] px-2 py-1 transition hover:bg-white/60 hover:text-ds-ink">
              Clear
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

/** Target keywords, comma-separated. */
export function KeywordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="kd-keywords" className="mb-1.5 block text-[13.5px] text-ds-ink-2">
        Target keywords <span className="text-ds-ink-3">(optional, comma-separated)</span>
      </label>
      <input id="kd-keywords" value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. green tea, weight loss" className={inputClass} />
    </div>
  );
}
