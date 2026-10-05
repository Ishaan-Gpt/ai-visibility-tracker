"use client";

import { useMemo, useState } from "react";
import { IconBin as Trash2, IconCopy as Copy, IconDownload as Download, IconPlusSmall as Plus, IconTick as Check } from "@/components/icons/Icons";
import { Card, buttonClass } from "@/components/ds/primitives";
import { AI_BOTS, PURPOSE_LABEL } from "@/lib/tools/aiCrawlers/bots";
import {
  generateLlmsTxt,
  generateRobots,
  presetPolicies,
  type BotPolicy,
  type LlmsSection,
  type Preset,
} from "@/lib/tools/aiFiles/generate";

const PRESETS: { id: Exclude<Preset, "custom">; title: string; body: string }[] = [
  { id: "search-only", title: "Visible in AI, opt out of training", body: "Allow AI search and assistant bots. Block training crawlers. Recommended for most sites." },
  { id: "open", title: "Allow all AI bots", body: "Maximum reach. Your content may be used to train models." },
  { id: "block-all-ai", title: "Block all AI bots", body: "Opt out of everything. You will not be cited in AI answers." },
];

const field =
  "h-10 w-full rounded-[12px] border border-white/70 bg-white/55 px-3 text-[15px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-accent/60";

function Output({ text, filename }: { text: string; filename: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-white/70 px-4 py-2.5">
        <span className="font-mono text-[13px] text-ds-ink-2">{filename}</span>
        <div className="flex gap-2">
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-4 w-4 text-ds-success" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            className={buttonClass("primary")}
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
              a.download = filename;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>
      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-5 text-ds-ink">{text}</pre>
    </Card>
  );
}

function RobotsPanel({ domain }: { domain: string }) {
  const [preset, setPreset] = useState<Preset>("search-only");
  const [policies, setPolicies] = useState<Record<string, BotPolicy>>(presetPolicies("search-only"));
  const [paths, setPaths] = useState("/admin/\n/cart/");
  const [sitemap, setSitemap] = useState(domain ? `https://${domain}/sitemap.xml` : "");

  const text = useMemo(
    () => generateRobots({ policies, disallowPaths: paths.split("\n"), sitemaps: sitemap.split("\n") }),
    [policies, paths, sitemap],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <Card>
          <h3 className="text-[16px] font-medium text-ds-ink">AI crawler policy</h3>
          <div className="mt-3 grid gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={preset === p.id}
                onClick={() => {
                  setPreset(p.id);
                  setPolicies(presetPolicies(p.id));
                }}
                className={`rounded-[12px] border p-3 text-left transition-colors ${preset === p.id ? "border-ds-ink bg-white/75" : "border-white/70 hover:bg-white/75"}`}
              >
                <span className="block text-[15px] font-medium text-ds-ink">{p.title}</span>
                <span className="block text-[13px] text-ds-ink-2">{p.body}</span>
              </button>
            ))}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-[14px] text-ds-ink-2 hover:text-ds-ink">Fine-tune each bot</summary>
            <ul className="mt-3 divide-y divide-white/60">
              {AI_BOTS.filter((b) => b.purpose !== "search").map((b) => (
                <li key={b.agent} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[13px] text-ds-ink">{b.agent}</span>
                    <span className="ml-2 text-[12px] text-ds-ink-3">{PURPOSE_LABEL[b.purpose]}</span>
                  </div>
                  <div className="inline-flex rounded-[12px] bg-white/40 p-0.5 text-[13px]">
                    {(["allow", "block"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setPreset("custom");
                          setPolicies((prev) => ({ ...prev, [b.agent]: v }));
                        }}
                        className={`rounded-[9px] px-3 py-1 capitalize ${policies[b.agent] === v ? (v === "block" ? "bg-white/55 text-ds-danger" : "bg-white/55 text-ds-success") : "text-ds-ink-2"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        </Card>
        <Card className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[14px] text-ds-ink-2">Paths to disallow for everyone (one per line)</span>
            <textarea value={paths} onChange={(e) => setPaths(e.target.value)} rows={3} className={`${field} h-auto py-2 font-mono text-[13px]`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[14px] text-ds-ink-2">Sitemap URLs (one per line)</span>
            <textarea value={sitemap} onChange={(e) => setSitemap(e.target.value)} rows={2} className={`${field} h-auto py-2 font-mono text-[13px]`} />
          </label>
        </Card>
      </div>
      <div className="space-y-3">
        <Output text={text} filename="robots.txt" />
        <p className="text-[13px] text-ds-ink-3">
          Upload to the root of your domain (/robots.txt). robots.txt is a voluntary standard: reputable crawlers obey it,
          but it is not access control. Then verify with the AI Crawler Check tool.
        </p>
      </div>
    </div>
  );
}

function LlmsPanel({ brandName, domain }: { brandName: string; domain: string }) {
  const base = domain ? `https://${domain}` : "https://example.com";
  const [name, setName] = useState(brandName);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [sections, setSections] = useState<LlmsSection[]>([
    { title: "Docs", links: [{ title: "Getting started", url: `${base}/docs/start`, description: "How to get set up" }] },
    { title: "Optional", links: [] },
  ]);

  const text = useMemo(() => generateLlmsTxt({ name, summary, details, sections }), [name, summary, details, sections]);

  const update = (si: number, fn: (s: LlmsSection) => LlmsSection) => setSections((prev) => prev.map((s, i) => (i === si ? fn(s) : s)));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <Card className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[14px] text-ds-ink-2">Site or project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[14px] text-ds-ink-2">One-paragraph summary</span>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="What your site is and who it is for." className={`${field} h-auto py-2`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[14px] text-ds-ink-2">Extra context for AI tools (optional)</span>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} className={`${field} h-auto py-2`} />
          </label>
        </Card>

        {sections.map((s, si) => (
          <Card key={si} className="space-y-3">
            <div className="flex items-center gap-2">
              <input value={s.title} onChange={(e) => update(si, (x) => ({ ...x, title: e.target.value }))} placeholder="Section title" className={`${field} font-medium`} aria-label="Section title" />
              <button type="button" onClick={() => setSections((p) => p.filter((_, i) => i !== si))} aria-label="Remove section" className="rounded-ds-sm p-2 text-ds-ink-3 hover:bg-white/40 hover:text-ds-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {s.links.map((l, li) => (
              <div key={li} className="grid gap-2 rounded-[12px] bg-white/75 p-3 sm:grid-cols-2">
                <input value={l.title} onChange={(e) => update(si, (x) => ({ ...x, links: x.links.map((y, i) => (i === li ? { ...y, title: e.target.value } : y)) }))} placeholder="Page title" className={field} aria-label="Link title" />
                <input value={l.url} onChange={(e) => update(si, (x) => ({ ...x, links: x.links.map((y, i) => (i === li ? { ...y, url: e.target.value } : y)) }))} placeholder="https://…" className={`${field} font-mono text-[13px]`} aria-label="Link URL" />
                <div className="flex gap-2 sm:col-span-2">
                  <input value={l.description} onChange={(e) => update(si, (x) => ({ ...x, links: x.links.map((y, i) => (i === li ? { ...y, description: e.target.value } : y)) }))} placeholder="Short description (optional)" className={field} aria-label="Link description" />
                  <button type="button" onClick={() => update(si, (x) => ({ ...x, links: x.links.filter((_, i) => i !== li) }))} aria-label="Remove link" className="rounded-ds-sm p-2 text-ds-ink-3 hover:bg-white/40 hover:text-ds-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => update(si, (x) => ({ ...x, links: [...x.links, { title: "", url: "", description: "" }] }))} className={buttonClass("ghost")}>
              <Plus className="h-4 w-4" /> Add link
            </button>
          </Card>
        ))}
        <button type="button" onClick={() => setSections((p) => [...p, { title: "", links: [] }])} className={buttonClass("secondary")}>
          <Plus className="h-4 w-4" /> Add section
        </button>
      </div>
      <div className="space-y-3">
        <Output text={text} filename="llms.txt" />
        <p className="text-[13px] text-ds-ink-3">
          llms.txt is a proposed convention (llmstxt.org) giving AI tools a curated map of your best content. Place it at /llms.txt. Support varies by AI vendor, so treat it as a low-cost
          addition, not a ranking guarantee.
        </p>
      </div>
    </div>
  );
}

export function AiFilesWorkspace({ brandName, domain }: { brandName: string; domain: string }) {
  const [tab, setTab] = useState<"robots" | "llms">("robots");
  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-[12px] bg-white/40 p-0.5 text-[14px]">
        {([
          ["robots", "robots.txt"],
          ["llms", "llms.txt"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-[9px] px-4 py-1.5 ${tab === id ? "bg-white/55 text-ds-ink" : "text-ds-ink-2"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "robots" ? <RobotsPanel domain={domain} /> : <LlmsPanel brandName={brandName} domain={domain} />}
    </div>
  );
}
