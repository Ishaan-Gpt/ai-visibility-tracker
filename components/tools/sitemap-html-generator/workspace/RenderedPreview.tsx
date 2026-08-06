"use client";

type RenderedPreviewProps = {
  mode: "standalone" | "embed";
  standaloneHtml: string;
  embedHtml: string;
};

/**
 * Renders the actual generated page, not just a code view — the concrete
 * differentiator against every code-output-only competitor. Standalone mode
 * uses a fully sandboxed (no scripts, no same-origin) iframe since it's an
 * independent HTML document; embed mode renders inline since it's meant to
 * inherit host-page styling and its markup is generator-escaped, not raw
 * third-party HTML.
 */
export function RenderedPreview({ mode, standaloneHtml, embedHtml }: RenderedPreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      <p className="border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2 font-body text-[11px] uppercase tracking-[0.1em] text-foreground/40">
        Live preview
      </p>
      {mode === "standalone" ? (
        <iframe title="Sitemap preview" srcDoc={standaloneHtml} sandbox="" className="h-[420px] w-full" />
      ) : (
        <div
          className="max-h-[420px] overflow-auto p-6 font-body text-sm text-foreground/80 [&_a]:text-primary [&_a:hover]:underline [&_h2]:mb-2 [&_h2]:mt-6 [&_h2:first-child]:mt-0 [&_h2]:text-xs [&_h2]:uppercase [&_h2]:tracking-[0.08em] [&_h2]:text-foreground/40 [&_ul]:list-none [&_ul]:space-y-1.5 [&_ul]:p-0"
          dangerouslySetInnerHTML={{ __html: embedHtml }}
        />
      )}
    </div>
  );
}
