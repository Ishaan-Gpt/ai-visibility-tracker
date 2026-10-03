"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, buttonClass } from "@/components/ds/primitives";

const TITLE_PX = 600; // Google desktop title container is ~600px
const DESC_CHARS = 160;

function usePixelWidth() {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  useEffect(() => {
    ctx.current = document.createElement("canvas").getContext("2d");
  }, []);
  return (text: string, font: string) => {
    if (!ctx.current) return text.length * 9.5;
    ctx.current.font = font;
    return ctx.current.measureText(text).width;
  };
}

function Bar({ value, max, warnAt }: { value: number; max: number; warnAt?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  const low = warnAt !== undefined && value < warnAt;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ds-muted">
      <div className={`h-full rounded-full transition-all ${over ? "bg-ds-danger" : low ? "bg-ds-warning" : "bg-ds-success"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const field =
  "w-full rounded-ds-md border border-ds-line bg-ds-surface px-3 py-2 text-[15px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-ink";

export function SerpPreviewWorkspace({ brandName, domain }: { brandName: string; domain: string }) {
  const [title, setTitle] = useState(`${brandName} | Your main value proposition`);
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const measure = usePixelWidth();

  const titlePx = Math.round(measure(title, "20px Arial, sans-serif"));
  const titleOver = titlePx > TITLE_PX;
  const shownTitle = useMemo(() => {
    if (!titleOver) return title;
    let t = title;
    while (t.length > 1 && measure(`${t}…`, "20px Arial, sans-serif") > TITLE_PX) t = t.slice(0, -1);
    return `${t.trimEnd()}…`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, titleOver]);
  const shownDesc = description.length > DESC_CHARS ? `${description.slice(0, DESC_CHARS - 1).trimEnd()}…` : description;

  const url = `https://${domain}${path ? (path.startsWith("/") ? path : `/${path}`) : ""}`;
  const crumb = `${domain}${path ? ` › ${path.replace(/^\//, "").split("/").filter(Boolean).join(" › ")}` : ""}`;

  const tags = useMemo(() => {
    const e = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const lines = [`<title>${e(title)}</title>`, `<meta name="description" content="${e(description)}">`, `<link rel="canonical" href="${e(url)}">`];
    lines.push(`<meta property="og:type" content="website">`, `<meta property="og:title" content="${e(title)}">`, `<meta property="og:description" content="${e(description)}">`, `<meta property="og:url" content="${e(url)}">`);
    if (ogImage) lines.push(`<meta property="og:image" content="${e(ogImage)}">`);
    lines.push(`<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">`, `<meta name="twitter:title" content="${e(title)}">`, `<meta name="twitter:description" content="${e(description)}">`);
    if (ogImage) lines.push(`<meta name="twitter:image" content="${e(ogImage)}">`);
    return lines.join("\n");
  }, [title, description, url, ogImage]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="space-y-4">
        <label className="block">
          <div className="mb-1 flex justify-between text-[14px] text-ds-ink-2">
            <span>Title tag</span>
            <span className={titleOver ? "text-ds-danger" : ""}>{title.length} chars · {titlePx}px / {TITLE_PX}px</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          <div className="mt-2"><Bar value={titlePx} max={TITLE_PX} warnAt={300} /></div>
        </label>
        <label className="block">
          <div className="mb-1 flex justify-between text-[14px] text-ds-ink-2">
            <span>Meta description</span>
            <span className={description.length > DESC_CHARS ? "text-ds-danger" : ""}>{description.length} / {DESC_CHARS}</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the page in 70–160 characters and invite the click." className={field} />
          <div className="mt-2"><Bar value={description.length} max={DESC_CHARS} warnAt={70} /></div>
        </label>
        <label className="block">
          <span className="mb-1 block text-[14px] text-ds-ink-2">Page path</span>
          <div className="flex items-center rounded-ds-md border border-ds-line bg-ds-surface focus-within:ring-2 focus-within:ring-ds-ink">
            <span className="pl-3 font-mono text-[13px] text-ds-ink-3">{domain}</span>
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/pricing" className="h-10 flex-1 bg-transparent px-1 font-mono text-[13px] outline-none" />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-[14px] text-ds-ink-2">Social image URL (1200×630)</span>
          <input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://…/og.png" className={`${field} font-mono text-[13px]`} />
        </label>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] text-ds-ink-2">Google preview (approximate)</h3>
            <div className="inline-flex rounded-ds-md bg-ds-muted p-0.5 text-[13px]">
              {(["desktop", "mobile"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDevice(d)} className={`rounded-[8px] px-3 py-1 capitalize ${device === d ? "bg-ds-surface text-ds-ink" : "text-ds-ink-2"}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className={`mx-auto rounded-ds-md border border-ds-line bg-white p-4 font-[Arial,sans-serif] ${device === "mobile" ? "max-w-[360px]" : ""}`}>
            <div className="flex items-center gap-2 text-[12px] text-[#202124]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f4] text-[12px] font-medium uppercase">{domain[0]}</span>
              <div className="min-w-0">
                <div className="truncate text-[14px] leading-4">{brandName}</div>
                <div className="truncate text-[12px] leading-4 text-[#4d5156]">{crumb}</div>
              </div>
            </div>
            <div className="mt-2 text-[20px] leading-6 text-[#1a0dab]" style={{ wordBreak: "break-word" }}>{shownTitle || "Your title appears here"}</div>
            <div className="mt-1 text-[14px] leading-[22px] text-[#4d5156]">{shownDesc || "Your meta description appears here."}</div>
          </div>
          <p className="mt-3 text-[12px] text-ds-ink-3">
            Pixel widths use Arial 20px in your browser. Google can rewrite titles and descriptions, so this is guidance, not a guarantee.
          </p>
        </Card>

        <Card>
          <h3 className="mb-3 text-[14px] text-ds-ink-2">Social share card</h3>
          <div className="overflow-hidden rounded-ds-md border border-ds-line bg-white">
            <div className="flex aspect-[1.91/1] items-center justify-center bg-ds-muted text-[13px] text-ds-ink-3">
              {ogImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogImage} alt="" className="h-full w-full object-cover" />
              ) : (
                "No social image set"
              )}
            </div>
            <div className="border-t border-ds-line p-3">
              <div className="text-[12px] uppercase text-ds-ink-3">{domain}</div>
              <div className="truncate text-[15px] font-medium text-ds-ink">{title}</div>
              <div className="line-clamp-2 text-[13px] text-ds-ink-2">{description}</div>
            </div>
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-ds-line px-4 py-2.5">
            <span className="font-mono text-[13px] text-ds-ink-2">&lt;head&gt; tags</span>
            <button
              type="button"
              className={buttonClass("secondary")}
              onClick={async () => {
                await navigator.clipboard.writeText(tags);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-4 w-4 text-ds-success" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-5 text-ds-ink">{tags}</pre>
        </Card>
      </div>
    </div>
  );
}
