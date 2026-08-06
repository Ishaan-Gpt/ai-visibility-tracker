"use client";

import { useState } from "react";
import { minifyHtml } from "@/lib/tools/htmlSitemap/htmlSitemapGenerator";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type OutputPanelProps = {
  standaloneHtml: string;
  embedHtml: string;
  mode: "standalone" | "embed";
  onModeChange: (mode: "standalone" | "embed") => void;
};

export function OutputPanel({ standaloneHtml, embedHtml, mode, onModeChange }: OutputPanelProps) {
  const [minified, setMinified] = useState(false);
  const [copied, setCopied] = useState(false);

  const raw = mode === "standalone" ? standaloneHtml : embedHtml;
  const output = minified ? minifyHtml(raw) : raw;

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "standalone" ? "sitemap.html" : "sitemap-embed.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex gap-1">
          {(["standalone", "embed"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
                mode === m ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {m === "standalone" ? "Standalone page" : "Embed snippet"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMinified((m) => !m)} className="font-body text-xs text-foreground/60 hover:text-foreground">
            {minified ? "Pretty" : "Minify"}
          </button>
          <button onClick={handleCopy} className="font-body text-xs text-foreground/60 hover:text-foreground">
            {copied ? (
              <span className="flex items-center gap-1 text-primary">
                <CheckRingIcon className="h-3.5 w-3.5" /> Copied
              </span>
            ) : (
              "Copy"
            )}
          </button>
          <button onClick={handleDownload} className="font-body text-xs text-foreground/60 hover:text-foreground">
            Download
          </button>
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto bg-background p-4 font-mono text-[12.5px] leading-relaxed text-foreground/80">
        {output}
      </pre>
    </div>
  );
}
