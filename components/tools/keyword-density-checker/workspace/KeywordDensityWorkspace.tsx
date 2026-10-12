"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ModeSwitch } from "@/components/tools/schema-generator/workspace/ModeSwitch";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { ErrorNote, QuotaNote, RunningStages } from "@/components/tools/shell/Bits";
import { buttonClass, inputClass } from "@/components/ds/primitives";
import { IconArrow, IconCheckCircle, IconSpinner } from "@/components/icons/Icons";
import { requestPageExtract, useFetchPage, type FetchPageError } from "@/lib/tools/pageExtract/useFetchPage";
import type { PageExtract } from "@/lib/tools/pageExtract/types";
import { analyzeDocument } from "@/lib/tools/keywordDensity/analyzer";
import { docFromPage, docFromPaste } from "@/lib/tools/keywordDensity/document";
import { analyzeTarget } from "@/lib/tools/keywordDensity/target";
import { compareDocs } from "@/lib/tools/keywordDensity/compare";
import type { OverOptFlag } from "@/lib/tools/keywordDensity/overOptimization";
import { loadKeywordDensitySession, saveKeywordDensitySession } from "@/lib/tools/keywordDensity/keywordDensityWorkspaceStorage";
import { ContentInput, KeywordField } from "@/components/tools/keyword-density-checker/workspace/ContentInput";
import { Tabs } from "@/components/tools/keyword-density-checker/workspace/ui";
import { Results } from "@/components/tools/keyword-density-checker/workspace/Results";
import { SAMPLE_KEYWORDS, SAMPLE_TEXT } from "@/components/tools/keyword-density-checker/workspace/sample";

type KeywordDensityWorkspaceProps = {
  initialContent: string;
  initialKeywordsRaw: string;
  restored?: boolean;
  onBack: () => void;
};

type Mode = "paste" | "url" | "compare";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "paste", label: "Paste text", hint: "Analyse a draft or any text, live in your browser" },
  { value: "url", label: "Analyze URL", hint: "Load a live page's main content with its title, meta description, headings and alt text" },
  { value: "compare", label: "Compare", hint: "Your page or text against a competitor's page: term gaps per 1,000 words" },
];

const STAGES = ["Fetching the page", "Extracting the main content", "Counting words and phrases", "Checking placement and readability"];
const MIN_WORDS = 30;

function splitKeywords(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter((k) => k && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))
    .slice(0, 6);
}

export function KeywordDensityWorkspace({ initialContent = "", initialKeywordsRaw = "", restored }: Partial<KeywordDensityWorkspaceProps> = {}) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("paste");
  const [content, setContent] = useState(initialContent);
  const [debounced, setDebounced] = useState(initialContent);
  const [keywordsRaw, setKeywordsRaw] = useState(initialKeywordsRaw);
  const [toast, setToast] = useState(!!restored);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef(initialContent);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  const hydrated = useRef(false);

  // Restore the last pasted text once, after hydration (never fetched pages).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!initialContent) {
        const s = loadKeywordDensitySession();
        if (s?.content) {
          setContent(s.content);
          setDebounced(s.content);
          if (!initialKeywordsRaw && s.targetKeywords.length) setKeywordsRaw(s.targetKeywords.join(", "));
          setToast(true);
        }
      }
      hydrated.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [initialContent, initialKeywordsRaw]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(content), content.length > 40000 ? 500 : content.length > 15000 ? 350 : 200);
    return () => clearTimeout(t);
  }, [content]);

  const keywords = useMemo(() => splitKeywords(keywordsRaw), [keywordsRaw]);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => saveKeywordDensitySession({ content, targetKeywords: keywords }), 400);
    return () => clearTimeout(t);
  }, [content, keywords]);

  /* ── URL mode ── */
  const fetcher = useFetchPage();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState(0);

  /* ── Compare mode ── */
  const [yoursKind, setYoursKind] = useState<"url" | "text">("url");
  const [yourUrl, setYourUrl] = useState("");
  const [theirUrl, setTheirUrl] = useState("");
  const [cmp, setCmp] = useState<{ you: PageExtract | null; them: PageExtract | null }>({ you: null, them: null });
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpError, setCmpError] = useState<FetchPageError | null>(null);
  const cmpSeq = useRef(0);

  const busy = fetcher.loading || cmpLoading;
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STAGES.length - 1)), 850);
    return () => clearInterval(id);
  }, [busy]);

  const runUrl = () => {
    if (!url.trim()) return;
    setStep(0);
    void fetcher.load(url.trim());
  };

  const { setQuota } = fetcher;
  const runCompare = useCallback(async () => {
    if (!theirUrl.trim() || (yoursKind === "url" && !yourUrl.trim())) return;
    const id = ++cmpSeq.current;
    setStep(0);
    setCmpLoading(true);
    setCmpError(null);
    try {
      const [mine, theirs] = await Promise.all([yoursKind === "url" ? requestPageExtract(yourUrl.trim()) : Promise.resolve(null), requestPageExtract(theirUrl.trim())]);
      if (id !== cmpSeq.current) return;
      setCmp({ you: mine?.page ?? null, them: theirs.page });
      const q = theirs.quota ?? mine?.quota;
      if (q) setQuota(q);
    } catch (e) {
      if (id !== cmpSeq.current) return;
      const err = e as Error & { limited?: boolean; quota?: Parameters<typeof setQuota>[0] };
      if (err.quota) setQuota(err.quota);
      setCmpError({ message: err.message || "Could not load one of the pages.", limited: err.limited });
    } finally {
      if (id === cmpSeq.current) setCmpLoading(false);
    }
  }, [theirUrl, yourUrl, yoursKind, setQuota]);

  /* ── Analysis (client-side, memoised; heavy work is deferred so typing stays smooth) ── */
  const deferredText = useDeferredValue(debounced);
  const deferredKeywords = useDeferredValue(keywords);
  const pasteDoc = useMemo(() => docFromPaste(deferredText), [deferredText]);
  const pageDoc = useMemo(() => (fetcher.page ? docFromPage(fetcher.page) : null), [fetcher.page]);
  const yourPageDoc = useMemo(() => (cmp.you ? docFromPage(cmp.you) : null), [cmp.you]);
  const theirDoc = useMemo(() => (cmp.them ? docFromPage(cmp.them) : null), [cmp.them]);

  const pasteAnalysis = useMemo(() => (mode === "paste" || (mode === "compare" && yoursKind === "text") ? analyzeDocument(pasteDoc) : null), [pasteDoc, mode, yoursKind]);
  const pageAnalysis = useMemo(() => (pageDoc ? analyzeDocument(pageDoc) : null), [pageDoc]);
  const yourPageAnalysis = useMemo(() => (yourPageDoc ? analyzeDocument(yourPageDoc) : null), [yourPageDoc]);
  const theirAnalysis = useMemo(() => (theirDoc ? analyzeDocument(theirDoc) : null), [theirDoc]);

  const primary = mode === "paste" ? pasteAnalysis : mode === "url" ? pageAnalysis : yoursKind === "text" ? pasteAnalysis : yourPageAnalysis;
  const them = mode === "compare" ? theirAnalysis : null;
  const compareResult = useMemo(() => (primary && them && primary.wordCount >= MIN_WORDS && them.wordCount >= MIN_WORDS ? compareDocs(primary, them) : null), [primary, them]);

  const targets = useMemo(() => (primary ? deferredKeywords.map((k) => analyzeTarget(primary, k)) : []), [primary, deferredKeywords]);
  const themTargets = useMemo(() => (them ? deferredKeywords.map((k) => analyzeTarget(them, k)) : null), [them, deferredKeywords]);

  const extraFlags = useMemo<OverOptFlag[]>(() => {
    if (!primary) return [];
    const docPhrases = new Set(primary.overOptimization.map((f) => f.phrase?.toLowerCase()).filter(Boolean));
    return targets.flatMap((t) =>
      t.flags
        .filter((f) => !(f.id === "kw-repetition" && docPhrases.has(t.keyword.toLowerCase())))
        .map((f) => ({ ...f, id: `${t.keyword}:${f.id}`, title: f.id === "kw-repetition" ? f.title : `“${t.keyword}”: ${f.title}` })),
    );
  }, [primary, targets]);

  const tracked = useMemo(() => new Set(keywords.map((k) => k.toLowerCase())), [keywords]);
  const track = useCallback((term: string) => {
    setKeywordsRaw((raw) => {
      const list = splitKeywords(raw);
      if (list.some((k) => k.toLowerCase() === term.toLowerCase())) return raw;
      return [...list, term].join(", ");
    });
  }, []);
  const untrack = useCallback((term: string) => setKeywordsRaw((raw) => splitKeywords(raw).filter((k) => k.toLowerCase() !== term.toLowerCase()).join(", ")), []);

  /** Selects a sentence in the editor (paste mode). Matches the first words loosely so Markdown markup doesn't get in the way. */
  const locate = useCallback(
    (sentence: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const words = sentence.split(/\s+/).filter(Boolean);
      const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sep = "[\\s*_`#>\\-]+";
      const content = contentRef.current;
      const head = new RegExp(words.slice(0, 6).map(esc).join(sep), "i").exec(content);
      if (!head) return;
      let end = head.index + head[0].length;
      if (words.length > 6) {
        const tail = new RegExp(words.slice(-3).map(esc).join(sep), "i");
        const rest = content.slice(head.index);
        const m = tail.exec(rest);
        if (m) end = head.index + m.index + m[0].length;
      }
      ta.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(head.index, end);
      ta.blur();
      ta.focus({ preventScroll: true });
    },
    [reduce],
  );

  const showResults = !!primary && primary.wordCount > 0 && !(mode !== "paste" && busy) && (mode !== "compare" || !!compareResult);
  const thinPage = (mode === "url" && pageAnalysis && pageAnalysis.wordCount < MIN_WORDS) || (mode === "compare" && ((yourPageAnalysis && yoursKind === "url" && yourPageAnalysis.wordCount < MIN_WORDS) || (theirAnalysis && theirAnalysis.wordCount < MIN_WORDS)));

  // Stable element: typing in the editor must not re-render the switch (its layout animation measures the page).
  const modeSwitch = useMemo(() => <ModeSwitch value={mode} onChange={setMode} options={MODES} label="What to analyse" />, [mode]);

  return (
    <div className="w-full space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-strong fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-[13.5px] text-ds-ink shadow-[var(--ds-shadow-pop)]"
          >
            <IconCheckCircle className="h-4 w-4 text-ds-success" /> Restored your last text
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {modeSwitch}
        <p className="text-[13px] text-ds-ink-3">{mode === "paste" ? "Nothing leaves your browser." : "Pages are loaded by our server, then analysed in your browser."}</p>
      </div>

      {/* ── Inputs ── */}
      {mode === "paste" && (
        <div className="grid gap-4">
          <ContentInput
            content={content}
            onContentChange={setContent}
            wordCount={pasteAnalysis?.wordCount ?? 0}
            textareaRef={textareaRef}
            onSample={() => {
              setContent(SAMPLE_TEXT);
              setDebounced(SAMPLE_TEXT);
              if (!keywordsRaw.trim()) setKeywordsRaw(SAMPLE_KEYWORDS);
            }}
          />
          <KeywordField value={keywordsRaw} onChange={setKeywordsRaw} />
        </div>
      )}

      {mode === "url" && (
        <div className="space-y-3">
          <ToolInputBar
            value={url}
            onChange={setUrl}
            onSubmit={runUrl}
            loading={fetcher.loading}
            placeholder="https://yoursite.com/blog/post"
            label="Page URL"
            cta="Analyze page"
            slug="keyword-density-checker"
            examples={fetcher.page ? undefined : ["en.wikipedia.org/wiki/Green_tea", "developers.google.com/search/docs/fundamentals/creating-helpful-content"]}
          />
          <QuotaNote quota={fetcher.quota} noun="page loads" />
          <KeywordField value={keywordsRaw} onChange={setKeywordsRaw} />
        </div>
      )}

      {mode === "compare" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cmpLoading) void runCompare();
          }}
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="glass min-w-0 rounded-[20px] p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[16px] font-medium text-ds-ink">Yours</p>
                <Tabs
                  label="Your side"
                  value={yoursKind}
                  onChange={setYoursKind}
                  options={[
                    { value: "url", label: "URL" },
                    { value: "text", label: "Pasted text" },
                  ]}
                />
              </div>
              {yoursKind === "url" ? (
                <input value={yourUrl} onChange={(e) => setYourUrl(e.target.value)} placeholder="https://yoursite.com/your-post" inputMode="url" autoComplete="url" spellCheck={false} aria-label="Your page URL" className={inputClass} />
              ) : (
                <ContentInput content={content} onContentChange={setContent} wordCount={pasteAnalysis?.wordCount ?? 0} textareaRef={textareaRef} label="Your text (shared with Paste text)" />
              )}
            </div>
            <div className="glass min-w-0 rounded-[20px] p-4 sm:p-5">
              <p className="mb-3 flex h-10 items-center text-[16px] font-medium text-ds-ink">Competitor</p>
              <input value={theirUrl} onChange={(e) => setTheirUrl(e.target.value)} placeholder="https://competitor.com/their-post" inputMode="url" autoComplete="url" spellCheck={false} aria-label="Competitor page URL" className={inputClass} />
              <p className="mt-2 text-[13px] leading-5 text-ds-ink-3">Pick a page that ranks for the topic you&apos;re writing about. Only its main content is compared.</p>
            </div>
          </div>
          <KeywordField value={keywordsRaw} onChange={setKeywordsRaw} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={cmpLoading || !theirUrl.trim() || (yoursKind === "url" ? !yourUrl.trim() : !content.trim())} className={buttonClass("primary", "lg")}>
              {cmpLoading ? <IconSpinner className="h-4 w-4 animate-spin" /> : null}
              {cmpLoading ? "Comparing…" : "Compare pages"}
              {!cmpLoading && <IconArrow className="h-4 w-4" />}
            </button>
            <QuotaNote quota={fetcher.quota} noun="page loads" />
          </div>
        </form>
      )}

      {/* ── Status ── */}
      {mode === "url" && fetcher.error && <ErrorNote message={fetcher.error.message} limited={fetcher.error.limited} />}
      {mode === "compare" && cmpError && <ErrorNote message={cmpError.message} limited={cmpError.limited} />}
      {mode !== "paste" && busy && (
        <div className="glass grid gap-6 rounded-[24px] p-6 sm:p-8 md:grid-cols-[1fr_1.2fr]">
          <RunningStages stages={STAGES} step={step} />
          <div className="hidden space-y-3 md:block" aria-hidden>
            <div className="skeleton h-28 rounded-ds-lg" />
            <div className="skeleton h-14 rounded-ds-md" />
            <div className="skeleton h-14 rounded-ds-md" />
          </div>
        </div>
      )}
      {mode !== "paste" && !busy && thinPage && (
        <div className="glass flex flex-wrap items-center gap-4 rounded-[20px] p-5">
          <p className="min-w-0 flex-1 text-[15px] leading-6 text-ds-ink">
            {mode === "compare" && theirAnalysis && theirAnalysis.wordCount < MIN_WORDS ? "The competitor page" : "That page"} gave us almost no readable text. It may block automated requests or build its content with JavaScript. Paste the text instead.
          </p>
          <button type="button" onClick={() => setMode("paste")} className={buttonClass("secondary", "sm")}>
            Paste text
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {showResults && primary && !thinPage ? (
        <Results
          mode={mode}
          primary={primary}
          them={them}
          compareResult={compareResult}
          targets={targets}
          themTargets={themTargets}
          extraFlags={extraFlags}
          tracked={tracked}
          track={track}
          untrack={untrack}
          locate={mode === "paste" || (mode === "compare" && yoursKind === "text") ? locate : undefined}
        />
      ) : mode === "paste" && !content.trim() ? (
        <div className="glass rounded-[22px] p-6 sm:p-8">
          <p className="max-w-[620px] font-serif text-[28px] leading-[1.1] text-ds-ink sm:text-[34px]">
            Paste a draft to see what it&apos;s <span className="italic">really</span> about.
          </p>
          <p className="mt-3 max-w-[620px] text-[15px] leading-6 text-ds-ink-2">
            You&apos;ll get the words and phrases it leans on, where your target keyword appears, anything repeated unnaturally, and a readability check with the sentences worth rewriting. Or switch to Analyze URL for a live page.
          </p>
          <button
            type="button"
            onClick={() => {
              setContent(SAMPLE_TEXT);
              setDebounced(SAMPLE_TEXT);
              if (!keywordsRaw.trim()) setKeywordsRaw(SAMPLE_KEYWORDS);
            }}
            className={`${buttonClass("secondary", "sm")} mt-5`}
          >
            Try a sample
          </button>
        </div>
      ) : null}
    </div>
  );
}
