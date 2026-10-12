"use client";

import { useMemo, useState } from "react";
import { IconBin as Trash2, IconCopy as Copy, IconDownload as Download, IconPlusSmall as Plus, IconSpinner, IconTick as Check } from "@/components/icons/Icons";
import { Card, buttonClass } from "@/components/ds/primitives";
import { SeverityIcon } from "@/components/ds/extras";
import { QuotaNote, type QuotaInfo } from "@/components/tools/shell/Bits";
import { PURPOSES, PURPOSE_LABEL, type BotInfo } from "@/lib/tools/aiCrawlers/bots";
import { evaluateAgent, parseRobots } from "@/lib/tools/aiCrawlers/robots";
import { validateLlmsTxt } from "@/lib/tools/aiFiles/llms";
import {
  GENERATOR_BOTS,
  generateLlmsTxt,
  generateRobots,
  mergeRobots,
  presetPolicies,
  type BotPolicy,
  type LlmsSection,
  type Preset,
} from "@/lib/tools/aiFiles/generate";

const PRESETS: { id: Exclude<Preset, "custom">; title: string; body: string }[] = [
  { id: "search-only", title: "Allow AI search, block training", body: "Stay citable in ChatGPT, Claude, Perplexity and other AI answers. Opt out of model training. Recommended for most sites." },
  { id: "open", title: "Allow all AI bots", body: "Maximum reach. Your content may also be used to train models." },
  { id: "block-all-ai", title: "Block all AI bots", body: "Opt out of everything. You will not be cited in AI answers. Google Search and Bing are not affected." },
];

const field =
  "h-10 w-full rounded-[12px] border border-white/70 bg-white/55 px-3 text-[15px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-accent/60";

interface Imported {
  origin: string;
  robots: { status: number | null; text: string; finalUrl: string | null };
  llms: { status: number | null; text: string; finalUrl: string | null };
}

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
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-5 text-ds-ink">{text}</pre>
    </Card>
  );
}

function Issues({ items }: { items: { level: "error" | "warning" | "info"; line: number | null; message: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((l, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-5 text-ds-ink">
          <SeverityIcon severity={l.level} />
          <span className="pt-1">
            {l.line && <span className="mr-1.5 font-mono text-[12px] text-ds-ink-3">line {l.line}</span>}
            {l.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Groups bots by vendor inside a purpose for the override list. */
function byVendor(bots: BotInfo[]) {
  const m = new Map<string, BotInfo[]>();
  for (const b of bots) m.set(b.owner, [...(m.get(b.owner) ?? []), b]);
  return [...m.entries()];
}

function RobotsPanel({ domain, imported }: { domain: string; imported: Imported | null }) {
  const [preset, setPreset] = useState<Preset>("search-only");
  const [policies, setPolicies] = useState<Record<string, BotPolicy>>(presetPolicies("search-only"));
  const [paths, setPaths] = useState("/admin/\n/cart/");
  const [sitemap, setSitemap] = useState(domain ? `https://${domain}/sitemap.xml` : "");
  const [mode, setMode] = useState<"fresh" | "merge">(imported?.robots.text ? "merge" : "fresh");
  const [existing, setExisting] = useState(imported?.robots.text ?? "");
  const [lastImport, setLastImport] = useState(imported);

  // A new import replaces the pasted file and switches to merge mode (adjusting state during render, not in an effect).
  if (imported !== lastImport) {
    setLastImport(imported);
    if (imported?.robots.text) {
      setExisting(imported.robots.text);
      setMode("merge");
    }
    // Mirror the sitemaps the site already declares, so merging adds nothing the user did not ask for.
    if (imported?.robots.text) setSitemap(parseRobots(imported.robots.text).sitemaps.join("\n"));
  }

  const merged = useMemo(() => (mode === "merge" && existing.trim() ? mergeRobots(existing, policies, sitemap.split("\n")) : null), [mode, existing, policies, sitemap]);
  const text = useMemo(
    () => merged?.text ?? generateRobots({ policies, disallowPaths: paths.split("\n"), sitemaps: sitemap.split("\n") }),
    [merged, policies, paths, sitemap],
  );

  // Verify the output with the same parser the AI Crawler Check uses.
  const verify = useMemo(() => {
    const parsed = parseRobots(text);
    const mismatches: string[] = [];
    let allowed = 0;
    let blocked = 0;
    for (const b of GENERATOR_BOTS) {
      const access = evaluateAgent(parsed, b.agent).access;
      if (access === "blocked") blocked++;
      else allowed++;
      const want = policies[b.agent];
      if (want === "allow" && access === "blocked") mismatches.push(`${b.agent} is still blocked`);
      if (want === "block" && access !== "blocked") mismatches.push(`${b.agent} is not fully blocked`);
    }
    const search = ["Googlebot", "Bingbot"].map((a) => ({ a, access: evaluateAgent(parsed, a).access }));
    return { lint: (parsed.lint ?? []).filter((l) => l.level !== "info"), mismatches, allowed, blocked, search };
  }, [text, policies]);

  const set = (agent: string, v: BotPolicy) => {
    setPreset("custom");
    setPolicies((prev) => ({ ...prev, [agent]: v }));
  };

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
            <summary className="cursor-pointer text-[14px] text-ds-ink-2 hover:text-ds-ink">
              Fine-tune each bot ({GENERATOR_BOTS.length}){preset === "custom" && <span className="ml-2 text-ds-accent-ink">custom</span>}
            </summary>
            <div className="mt-3 space-y-4">
              {PURPOSES.filter((p) => p !== "search").map((purpose) => (
                <div key={purpose}>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-ds-ink-3">{PURPOSE_LABEL[purpose]}</p>
                    <div className="flex gap-1 text-[12px]">
                      {(["allow", "block"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="rounded-[8px] px-2 py-0.5 capitalize text-ds-ink-2 hover:bg-white/60 hover:text-ds-ink"
                          onClick={() => {
                            setPreset("custom");
                            setPolicies((prev) => ({ ...prev, ...Object.fromEntries(GENERATOR_BOTS.filter((b) => b.purpose === purpose).map((b) => [b.agent, v])) }));
                          }}
                        >
                          {v} all
                        </button>
                      ))}
                    </div>
                  </div>
                  <ul className="mt-1 divide-y divide-white/60">
                    {byVendor(GENERATOR_BOTS.filter((b) => b.purpose === purpose)).flatMap(([, bots]) =>
                      bots.map((b) => (
                        <li key={b.agent} className="flex items-center justify-between gap-3 py-2" title={b.note}>
                          <div className="min-w-0">
                            <span className="font-mono text-[13px] text-ds-ink">{b.agent}</span>
                            <span className="ml-2 text-[12px] text-ds-ink-3">{b.owner}</span>
                          </div>
                          <div className="inline-flex shrink-0 rounded-[12px] bg-white/40 p-0.5 text-[12.5px]" role="group" aria-label={`${b.agent} policy`}>
                            {(["allow", "inherit", "block"] as const).map((v) => (
                              <button
                                key={v}
                                type="button"
                                aria-pressed={(policies[b.agent] ?? "inherit") === v}
                                onClick={() => set(b.agent, v)}
                                className={`rounded-[9px] px-2.5 py-1 capitalize ${
                                  (policies[b.agent] ?? "inherit") === v ? (v === "block" ? "bg-white/70 text-ds-danger" : v === "allow" ? "bg-white/70 text-ds-success" : "bg-white/70 text-ds-ink") : "text-ds-ink-2"
                                }`}
                              >
                                {v === "inherit" ? "Default" : v}
                              </button>
                            ))}
                          </div>
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              ))}
              <p className="text-[12.5px] leading-5 text-ds-ink-3">&quot;Default&quot; writes no group for that bot, so it follows your User-agent: * rules.</p>
            </div>
          </details>
        </Card>

        <Card className="space-y-3">
          <div className="inline-flex rounded-[12px] bg-white/40 p-0.5 text-[13.5px]">
            {([
              ["fresh", "Start fresh"],
              ["merge", "Merge into my current file"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-[9px] px-3 py-1.5 ${mode === id ? "bg-white/70 text-ds-ink" : "text-ds-ink-2"}`}>
                {label}
              </button>
            ))}
          </div>
          {mode === "merge" ? (
            <label className="block">
              <span className="mb-1 block text-[14px] text-ds-ink-2">Your current robots.txt (imported or pasted). Its own rules are kept; only the AI groups are rewritten.</span>
              <textarea value={existing} onChange={(e) => setExisting(e.target.value)} rows={8} placeholder={"User-agent: *\nDisallow: /admin/"} className={`${field} h-auto py-2 font-mono text-[12.5px]`} spellCheck={false} />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-[14px] text-ds-ink-2">Paths to disallow for everyone (one per line)</span>
              <textarea value={paths} onChange={(e) => setPaths(e.target.value)} rows={3} className={`${field} h-auto py-2 font-mono text-[13px]`} spellCheck={false} />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-[14px] text-ds-ink-2">Sitemap URLs (one per line)</span>
            <textarea value={sitemap} onChange={(e) => setSitemap(e.target.value)} rows={2} className={`${field} h-auto py-2 font-mono text-[13px]`} spellCheck={false} />
          </label>
        </Card>
      </div>

      <div className="space-y-3">
        <Output text={text} filename="robots.txt" />
        {merged && (merged.replacedAgents.length > 0 || merged.addedSitemaps.length > 0) && (
          <p className="text-[13px] text-ds-ink-2">
            {merged.replacedAgents.length > 0 && `Moved existing rules for ${merged.replacedAgents.join(", ")} into the managed block. `}
            {merged.addedSitemaps.length > 0 && `Added ${merged.addedSitemaps.length} sitemap line${merged.addedSitemaps.length === 1 ? "" : "s"}.`}
          </p>
        )}
        <Card className="space-y-2">
          <p className="text-[14px] font-medium text-ds-ink">
            {verify.mismatches.length === 0 && verify.lint.length === 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-ds-success" /> Verified with our robots.txt parser
              </span>
            ) : (
              "Check before you upload"
            )}
          </p>
          <p className="text-[13px] leading-5 text-ds-ink-2">
            {verify.allowed} AI agents allowed, {verify.blocked} blocked. {verify.search.map((s) => `${s.a}: ${s.access}`).join(" · ")}.
          </p>
          {verify.mismatches.length > 0 && <Issues items={verify.mismatches.map((m) => ({ level: "warning" as const, line: null, message: m }))} />}
          {verify.lint.length > 0 && <Issues items={verify.lint} />}
        </Card>
        <p className="text-[13px] text-ds-ink-3">
          Upload to the root of your domain (/robots.txt). robots.txt is a voluntary standard: reputable crawlers obey it, but it is not access control, and firewall bot
          settings can still block crawlers it allows. Then verify with the AI Crawler Check.
        </p>
      </div>
    </div>
  );
}

function sectionsFromImport(text: string): { name: string; summary: string; details: string; sections: LlmsSection[] } | null {
  const v = validateLlmsTxt(text);
  if (!v.title) return null;
  return {
    name: v.title,
    summary: v.summary ?? "",
    details: v.details,
    sections: v.sections.map((s) => ({ title: s.title, links: s.links.map((l) => ({ title: l.title, url: l.url, description: l.notes })) })),
  };
}

function LlmsPanel({ brandName, domain, imported }: { brandName: string; domain: string; imported: Imported | null }) {
  const base = domain ? `https://${domain}` : "https://example.com";
  const [name, setName] = useState(brandName);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [sections, setSections] = useState<LlmsSection[]>([
    { title: "Docs", links: [{ title: "Getting started", url: `${base}/docs/start`, description: "How to get set up" }] },
    { title: "Optional", links: [] },
  ]);
  const [lastImport, setLastImport] = useState<Imported | null>(null);
  if (imported !== lastImport) {
    setLastImport(imported);
    const parsed = imported?.llms.text ? sectionsFromImport(imported.llms.text) : null;
    if (parsed) {
      setName(parsed.name);
      setSummary(parsed.summary);
      setDetails(parsed.details);
      setSections(parsed.sections.length ? parsed.sections : [{ title: "Docs", links: [] }]);
    }
  }

  const text = useMemo(() => generateLlmsTxt({ name, summary, details, sections }), [name, summary, details, sections]);
  const check = useMemo(() => validateLlmsTxt(text), [text]);

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
            {s.title.trim().toLowerCase() === "optional" && <p className="text-[12.5px] text-ds-ink-3">Links here may be skipped by AI tools when they need a shorter context.</p>}
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
        <Card className="space-y-2">
          <p className="text-[14px] font-medium text-ds-ink">
            {check.valid && check.issues.every((i) => i.level === "info") ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-ds-success" /> Valid llms.txt ({check.sections.length} section{check.sections.length === 1 ? "" : "s"}, {check.linkCount} link{check.linkCount === 1 ? "" : "s"})
              </span>
            ) : (
              "Format check (llmstxt.org)"
            )}
          </p>
          {check.issues.length > 0 && <Issues items={check.issues} />}
        </Card>
        <p className="text-[13px] text-ds-ink-3">
          llms.txt is a proposed convention (llmstxt.org) giving AI tools a curated map of your best content. Place it at /llms.txt. Support varies by AI vendor, so treat it as
          a low-cost addition, not a ranking guarantee.
        </p>
      </div>
    </div>
  );
}

function ImportBar({ initial, onImported }: { initial: string; onImported: (d: Imported) => void }) {
  const [site, setSite] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  async function go() {
    if (!site.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tools/ai-crawlers/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: site }) });
      const body = await res.json().catch(() => ({ error: "Unexpected response." }));
      if (body.quota) setQuota(body.quota as QuotaInfo);
      if (!res.ok) throw new Error(body.error ?? "Could not import.");
      const d = body as Imported;
      onImported(d);
      const r = d.robots.text ? `robots.txt imported (${d.robots.text.split("\n").length} lines)` : `no robots.txt (HTTP ${d.robots.status ?? "error"})`;
      const l = d.llms.text ? "llms.txt imported" : `no llms.txt (HTTP ${d.llms.status ?? "error"})`;
      setMsg({ text: `${d.origin.replace(/^https?:\/\//, "")}: ${r} · ${l}.` });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Could not import.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <form
        className="glass flex flex-col gap-2 rounded-[16px] p-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <label className="flex min-w-0 flex-1 items-center gap-2 pl-2">
          <span className="shrink-0 text-[13.5px] text-ds-ink-2">Your site</span>
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="yourdomain.com" inputMode="url" spellCheck={false} className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-ds-ink outline-none placeholder:text-ds-ink-3" />
        </label>
        <button type="submit" disabled={busy || !site.trim()} className={buttonClass("secondary", "sm")}>
          {busy && <IconSpinner className="h-4 w-4 animate-spin" />} Import my current files
        </button>
      </form>
      <p className={`pl-2 text-[12.5px] ${msg?.bad ? "text-ds-danger" : "text-ds-ink-2"}`}>
        {msg?.text ?? "Optional: pull in your live robots.txt and llms.txt so new AI rules are merged into them instead of replacing them. Uses one AI crawler check."}
      </p>
      <QuotaNote quota={quota} noun="checks" />
    </div>
  );
}

export function AiFilesWorkspace({ brandName, domain }: { brandName: string; domain: string }) {
  const [tab, setTab] = useState<"robots" | "llms">("robots");
  const [imported, setImported] = useState<Imported | null>(null);
  return (
    <div className="space-y-6">
      <ImportBar initial={domain} onImported={setImported} />
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
      {/* Both panels stay mounted so switching tabs keeps edits. */}
      <div hidden={tab !== "robots"}>
        <RobotsPanel domain={domain} imported={imported} />
      </div>
      <div hidden={tab !== "llms"}>
        <LlmsPanel brandName={brandName} domain={domain} imported={imported} />
      </div>
    </div>
  );
}
