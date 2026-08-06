"use client";

import { useState } from "react";
import { minifyXml, type GeneratedSitemap } from "@/lib/tools/sitemap/sitemapGenerator";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

export function XmlPreviewPanel({ generated }: { generated: GeneratedSitemap }) {
  const allFiles = generated.index ? [generated.index, ...generated.files] : generated.files;
  const [activeFile, setActiveFile] = useState(0);
  const [minified, setMinified] = useState(false);
  const [copied, setCopied] = useState(false);

  const file = allFiles[activeFile] ?? allFiles[0];
  const output = minified ? minifyXml(file.xml) : file.xml;

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownload() {
    downloadFile(file.filename, output);
  }

  function handleDownloadAll() {
    allFiles.forEach((f, i) => setTimeout(() => downloadFile(f.filename, f.xml), i * 150));
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
        <div className="flex flex-wrap gap-1">
          {allFiles.map((f, i) => (
            <button
              key={f.filename}
              onClick={() => setActiveFile(i)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
                activeFile === i ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {f.filename}
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
          {allFiles.length > 1 ? (
            <button onClick={handleDownloadAll} className="font-body text-xs text-primary hover:underline">
              Download all ({allFiles.length})
            </button>
          ) : null}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            className="font-body text-xs text-primary hover:underline"
          >
            Submit in Search Console ↗
          </a>
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto bg-background p-4 font-mono text-[12.5px] leading-relaxed text-foreground/80">
        {output}
      </pre>
    </div>
  );
}
