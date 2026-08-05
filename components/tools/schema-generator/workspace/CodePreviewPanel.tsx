"use client";

import { useState } from "react";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";
import { jsonLdToMicrodata } from "@/lib/tools/validation/microdataConverter";

type ViewMode = "script" | "raw" | "minified" | "microdata";

export function CodePreviewPanel({ json }: { json: object }) {
  const [mode, setMode] = useState<ViewMode>("script");
  const [copied, setCopied] = useState(false);

  const pretty = JSON.stringify(json, null, 2);
  const minified = JSON.stringify(json);
  const scriptTag = `<script type="application/ld+json">\n${pretty}\n</script>`;
  const microdata = jsonLdToMicrodata(json);

  const output = mode === "script" ? scriptTag : mode === "minified" ? minified : mode === "microdata" ? microdata : pretty;

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "script" || mode === "microdata" ? "schema.html" : "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10">
      <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex gap-1">
          {(["script", "raw", "minified", "microdata"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-2.5 py-1 font-body text-xs capitalize transition-colors ${
                mode === m ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
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
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noreferrer"
            className="font-body text-xs text-primary hover:underline"
          >
            Test on Google ↗
          </a>
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto bg-background p-4 font-mono text-[12.5px] leading-relaxed text-foreground/80">
        {output}
      </pre>
    </div>
  );
}
