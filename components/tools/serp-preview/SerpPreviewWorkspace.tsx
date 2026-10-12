"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ModeSwitch } from "@/components/tools/schema-generator/workspace/ModeSwitch";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { ErrorNote, QuotaNote, RunningStages } from "@/components/tools/shell/Bits";
import { IconRerun } from "@/components/icons/Icons";
import { useFetchPage } from "@/lib/tools/pageExtract/useFetchPage";
import type { PageExtract } from "@/lib/tools/pageExtract/types";
import { GoogleSection } from "./GooglePreview";
import { SocialSection } from "./SocialPreviews";
import { IssuesPanel } from "./IssuesPanel";
import { TagOutput } from "./TagOutput";
import { measureText, useHydrated, useImageFacts } from "./hooks";
import { layoutSnippet, serpDate } from "./serpMetrics";
import { bareHost, canonicalUrl, defaultFields, derivedTags, fieldsFromPage, hostOf, isAbsoluteHttp, literalTags, loadDraft, saveDraft, type FieldKey, type MetaFields } from "./fields";
import { resolveCards } from "./socialRules";
import { computeIssues } from "./issues";
import { buildTagLines } from "./tagBlock";
import { Chip } from "./ui";

type Mode = "manual" | "url";

const STAGES = ["Fetching the live page", "Reading title, meta and social tags", "Checking the share image"];
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Meta & SERP preview. Two ways in: write tags by hand, or load a live page and edit from there.
 * Renders nothing measured until hydrated, because widths come from the browser's canvas.
 */
export function SerpPreviewWorkspace({ brandName, domain }: { brandName: string; domain: string }) {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="skeleton h-[560px] rounded-[22px]" aria-busy />;
  return <Workspace brandName={brandName} domain={domain} />;
}

function Workspace({ brandName, domain }: { brandName: string; domain: string }) {
  const [mode, setMode] = useState<Mode>("manual");
  const [draft, setDraft] = useState<MetaFields>(() => loadDraft(domain) ?? defaultFields(brandName, domain));
  const [urlFields, setUrlFields] = useState<MetaFields | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fetcher = useFetchPage();
  const page = mode === "url" ? fetcher.page : null;
  const reduce = useReducedMotion();

  // Persist the hand-written draft only (never fetched pages).
  useEffect(() => {
    const t = window.setTimeout(() => saveDraft(domain, draft), 250);
    return () => window.clearTimeout(t);
  }, [domain, draft]);

  const fields = mode === "manual" ? draft : urlFields;

  const set = <K extends FieldKey>(k: K, v: MetaFields[K]) => {
    if (mode === "manual") setDraft((f) => ({ ...f, [k]: v }));
    else setUrlFields((f) => (f ? { ...f, [k]: v } : f));
  };

  const load = async (raw: string) => {
    const p = await fetcher.load(raw.trim(), { probeImages: true });
    if (p) setUrlFields((prev) => fieldsFromPage(p, { keyword: prev?.keyword ?? draft.keyword }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModeSwitch<Mode>
          value={mode}
          onChange={setMode}
          label="How to start"
          options={[
            { value: "manual", label: "Write tags", hint: "Type a title, description and image" },
            { value: "url", label: "Load from URL", hint: "Read the tags from a live page" },
          ]}
        />
        {mode === "manual" && (
          <button
            type="button"
            onClick={() => setDraft(defaultFields(brandName, domain))}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] text-ds-ink-2 transition hover:bg-white/50 hover:text-ds-ink"
          >
            <IconRerun className="h-4 w-4" /> Start over
          </button>
        )}
      </div>

      {mode === "url" && (
        <div className="space-y-3">
          <ToolInputBar
            value={urlInput}
            onChange={setUrlInput}
            onSubmit={() => load(urlInput)}
            loading={fetcher.loading}
            placeholder="https://yoursite.com/page"
            label="Page URL"
            cta="Load tags"
            slug="meta-tag-preview"
            examples={fetcher.page ? undefined : ["allbirds.com/products/mens-wool-runners", "healthline.com/nutrition/green-tea-and-weight-loss", "stripe.com"]}
          />
          <QuotaNote quota={fetcher.quota} noun="page loads" />
          {fetcher.error && <ErrorNote message={fetcher.error.message} limited={fetcher.error.limited} />}
          {fetcher.loading && <Loading />}
          {fetcher.page && urlFields && !fetcher.loading && (
            <LoadedBar
              page={fetcher.page}
              fields={urlFields}
              keyword={urlFields.keyword}
              onReset={() => setUrlFields(fieldsFromPage(fetcher.page!, { keyword: urlFields.keyword }))}
              onReload={() => load(fetcher.page!.requestedUrl)}
            />
          )}
        </div>
      )}

      {fields ? (
        <motion.div key={mode === "url" ? `url-${fetcher.page?.fetchedAt}` : "manual"} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}>
          <Results fields={fields} set={set} mode={mode} page={page} />
        </motion.div>
      ) : (
        !fetcher.loading && <EmptyUrlState />
      )}
    </div>
  );
}

function Results({ fields, set, mode, page }: { fields: MetaFields; set: <K extends FieldKey>(k: K, v: MetaFields[K]) => void; mode: Mode; page: PageExtract | null }) {
  const tags = useMemo(() => (mode === "manual" ? derivedTags(fields) : literalTags(fields)), [fields, mode]);
  const outputTags = useMemo(() => derivedTags(fields), [fields]);
  const pageUrl = canonicalUrl(fields.url || page?.finalUrl || "");

  const ogAbs = isAbsoluteHttp(tags.ogImage) ? tags.ogImage : "";
  const xImg = tags.twitterImage || tags.ogImage;
  const xAbs = isAbsoluteHttp(xImg) ? xImg : "";
  const lookup = useImageFacts([ogAbs, xAbs, isAbsoluteHttp(tags.twitterImage) ? tags.twitterImage : ""], page?.imageProbes);
  const ogFacts = ogAbs ? lookup(ogAbs) : undefined;
  const xFacts = xAbs ? lookup(xAbs) : undefined;

  const date = fields.showDate ? serpDate(fields.published) : null;
  const { title, description, keyword } = fields;
  const desktop = useMemo(() => layoutSnippet({ title, description, url: pageUrl, keyword, date }, "desktop", measureText), [title, description, pageUrl, keyword, date]);
  const mobile = useMemo(() => layoutSnippet({ title, description, url: pageUrl, keyword, date }, "mobile", measureText), [title, description, pageUrl, keyword, date]);

  const siteName = fields.siteName.trim() || page?.siteName || bareHost(pageUrl) || "yoursite.com";
  const cards = useMemo(() => resolveCards(tags, pageUrl, lookup), [tags, pageUrl, lookup]);
  const issues = useMemo(() => computeIssues({ mode, tags, page, ogFacts, xFacts, desktop, mobile }), [mode, tags, page, ogFacts, xFacts, desktop, mobile]);
  const tagLines = useMemo(() => buildTagLines(outputTags, { ogFacts, page }), [outputTags, ogFacts, page]);

  return (
    <div className="space-y-6">
      <GoogleSection fields={fields} set={set} desktop={desktop} mobile={mobile} siteName={siteName} mode={mode} />
      <SocialSection fields={fields} set={set} cards={cards} mode={mode} ogFacts={ogFacts} pageUrl={pageUrl} />
      <IssuesPanel issues={issues} subject={mode === "url" && page ? `Live page plus your edits · ${hostOf(page.finalUrl)}` : "Based on the tags you wrote (the tag block fills in every social tag)"} />
      <TagOutput lines={tagLines} live={mode === "url" && !!page} />
    </div>
  );
}

function LoadedBar({ page, fields, keyword, onReset, onReload }: { page: PageExtract; fields: MetaFields; keyword: string; onReset: () => void; onReload: () => void }) {
  const original = useMemo(() => fieldsFromPage(page, { keyword }), [page, keyword]);
  const edits = (Object.keys(original) as FieldKey[]).filter((k) => k !== "keyword" && original[k] !== fields[k]).length;
  const time = new Date(page.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[18px] py-2 pl-4 pr-2">
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ds-ink-2">
        <span>
          Loaded from <span className="font-medium text-ds-ink">{hostOf(page.finalUrl)}</span> at {time}
        </span>
        <Chip tone={page.status === 200 ? "good" : "bad"}>HTTP {page.status}</Chip>
        {page.redirects.length > 0 && <Chip>{page.redirects.length} redirect{page.redirects.length > 1 ? "s" : ""}</Chip>}
        {edits > 0 && <Chip tone="accent">{edits} edit{edits > 1 ? "s" : ""}</Chip>}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onReset} disabled={!edits} className="inline-flex h-9 items-center rounded-[10px] px-3 text-[13.5px] text-ds-ink-2 transition hover:bg-white/50 hover:text-ds-ink disabled:opacity-40">
          Reset edits
        </button>
        <button type="button" onClick={onReload} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] text-ds-ink-2 transition hover:bg-white/50 hover:text-ds-ink" title="Fetch the page again (uses one page load)">
          <IconRerun className="h-4 w-4" /> Reload
        </button>
      </div>
    </div>
  );
}

function Loading() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STAGES.length - 1)), 1100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="glass grid gap-6 rounded-[24px] p-6 sm:p-8 md:grid-cols-[1fr_1.2fr]">
      <RunningStages stages={STAGES} step={step} />
      <div className="hidden space-y-3 md:block" aria-hidden>
        <div className="skeleton h-28 rounded-ds-lg" />
        <div className="skeleton h-14 rounded-ds-md" />
        <div className="skeleton h-14 rounded-ds-md" />
      </div>
    </div>
  );
}

function EmptyUrlState() {
  return (
    <div className="glass rounded-[24px] p-6 sm:p-8">
      <h3 className="font-serif text-[30px] leading-[1.05] text-ds-ink sm:text-[36px]">
        See any page the way <span className="italic">Google and feeds</span> do.
      </h3>
      <p className="mt-3 max-w-[620px] text-[15.5px] leading-6 text-ds-ink-2">
        We read the live title, description, canonical, Open Graph and X tags, check the share image from our server, then fill every field so you can rewrite and compare before you ship.
      </p>
    </div>
  );
}
