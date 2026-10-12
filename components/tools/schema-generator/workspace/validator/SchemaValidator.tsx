"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorNote, QuotaNote, RunningStages } from "@/components/tools/shell/Bits";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { useFetchPage } from "@/lib/tools/pageExtract/useFetchPage";
import { extractFromPastedCode } from "@/lib/tools/pageExtract/structuredData";
import type { StructuredData } from "@/lib/tools/pageExtract/types";
import { createResolver, validateStructuredData, type ValidatedItem } from "@/lib/tools/validation/structuredDataValidator";
import { importToForm } from "@/lib/tools/validation/schemaImport";
import type { SchemaFormData, SchemaType } from "@/lib/tools/schemaTemplates";
import { ReportView } from "@/components/tools/schema-generator/workspace/validator/ReportView";

const STAGES = ["Fetching the live page", "Extracting JSON-LD, microdata and RDFa", "Checking types, properties and values", "Testing Google rich result rules"];
const CODE_KEY = "seowise:schema-validator-code";

const EXAMPLES: { label: string; code: string }[] = [
  {
    label: "Product with mistakes",
    code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Trail Runner 2",
  "image": "/images/trail-runner-2.jpg",
  "brand": { "@type": "Brand", "name": "Northpeak" },
  "gtin13": "4006381333932",
  "offers": {
    "@type": "Offer",
    "price": "$129.00",
    "priceCurrency": "usd",
    "availabilty": "https://schema.org/InStock"
  },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7" }
}
</script>`,
  },
  {
    label: "Broken JSON",
    code: `{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Weeknight dal",
  "image": "https://example.com/dal.jpg",
  "cookTime": "35 minutes",
  "recipeIngredient": ["1 cup red lentils", "1 onion",],
}`,
  },
  {
    label: "Microdata",
    code: `<div itemscope itemtype="https://schema.org/LocalBusiness">
  <h1 itemprop="name">Corner Bakery</h1>
  <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
    <span itemprop="streetAddress">12 Market St</span>,
    <span itemprop="addressLocality">Leeds</span>
    <span itemprop="postalCode">LS1 6DT</span>
  </div>
  <span itemprop="telephone">+44 113 496 0000</span>
  <meta itemprop="openingHours" content="Mo-Sa 07:00-17:00">
</div>`,
  },
];

function hostOf(u: string) {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export type LoadIntoGenerator = <T extends SchemaType>(type: T, data: SchemaFormData[T], label: string) => void;

/** "Test a URL" and "Paste code" modes: a Rich Results Test + Schema Markup Validator in one. */
export function SchemaValidator({ mode, onLoadIntoGenerator }: { mode: "url" | "code"; onLoadIntoGenerator: LoadIntoGenerator }) {
  /* ---------- URL mode ---------- */
  const [url, setUrl] = useState("");
  const { page, loading, error, quota, load } = useFetchPage();
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);
  const runUrl = async (target: string) => {
    if (timer.current) clearInterval(timer.current);
    setStep(0);
    timer.current = setInterval(() => setStep((s) => Math.min(STAGES.length - 1, s + 1)), 800);
    await load(target);
    if (timer.current) clearInterval(timer.current);
  };

  const urlReport = useMemo(() => (page ? validateStructuredData(page.structuredData, { pageUrl: page.finalUrl }) : null), [page]);

  /* ---------- Code mode ---------- */
  // Only rendered after the user picks "Paste code" (client-side), so reading storage during init is safe.
  const [code, setCode] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : (window.localStorage.getItem(CODE_KEY) ?? "");
    } catch {
      return "";
    }
  });
  const [debounced, setDebounced] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(code);
      try {
        if (code.trim()) window.localStorage.setItem(CODE_KEY, code.slice(0, 200_000));
        else window.localStorage.removeItem(CODE_KEY);
      } catch {
        /* storage unavailable */
      }
    }, 280);
    return () => clearTimeout(t);
  }, [code]);
  const codeData = useMemo<StructuredData | null>(() => (debounced.trim() ? extractFromPastedCode(debounced) : null), [debounced]);
  const codeReport = useMemo(() => (codeData ? validateStructuredData(codeData) : null), [codeData]);

  const edit = (item: ValidatedItem, sd: StructuredData, pageUrl?: string) => {
    if (!item.template) return;
    const data = importToForm(item.template, item.node, createResolver(sd, pageUrl));
    onLoadIntoGenerator(item.template, data, item.title || item.types[0] || "item");
  };

  if (mode === "url") {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <ToolInputBar
            value={url}
            onChange={setUrl}
            onSubmit={() => runUrl(url)}
            loading={loading}
            placeholder="https://yoursite.com/product-page"
            label="Page URL to test"
            cta="Test URL"
            slug="schema-generator"
            examples={page ? undefined : ["allrecipes.com/recipe/10813/best-chocolate-chip-cookies", "allbirds.com/products/mens-wool-runners", "bbc.com/news"]}
          />
          <QuotaNote quota={quota} noun="URL imports" />
        </div>
        {error && <ErrorNote message={error.message} limited={error.limited} />}
        {loading && (
          <div className="glass grid gap-6 rounded-[24px] p-6 sm:p-8 md:grid-cols-[1fr_1.2fr]">
            <RunningStages stages={STAGES} step={step} />
            <div className="hidden space-y-3 md:block" aria-hidden>
              <div className="skeleton h-28 rounded-ds-lg" />
              <div className="skeleton h-14 rounded-ds-md" />
              <div className="skeleton h-14 rounded-ds-md" />
            </div>
          </div>
        )}
        {page && urlReport && !loading && (
          <div className="space-y-3">
            {(page.status >= 400 || !page.isHtml) && (
              <ErrorNote message={page.status >= 400 ? `The page returned HTTP ${page.status}, so what we tested may be an error page.` : `The URL returned ${page.contentType || "a non-HTML response"}, not a web page.`} />
            )}
            <p className="pl-1 text-[13px] text-ds-ink-2">
              Tested <span className="text-ds-ink">{page.finalUrl}</span>
              {page.redirects.length ? ` after ${page.redirects.length} redirect${page.redirects.length > 1 ? "s" : ""}` : ""} · HTML as served, before JavaScript runs. Markup injected by scripts (for example by a tag manager) isn&apos;t seen here; Google renders
              JavaScript, so check those pages in Google&apos;s Rich Results Test too.
            </p>
            <ReportView report={urlReport} blocks={page.structuredData.jsonLd} subject={hostOf(page.finalUrl)} onEdit={(item) => edit(item, page.structuredData, page.finalUrl)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-[22px] p-2">
        <label className="sr-only" htmlFor="schema-validator-code">
          Structured data or HTML to validate
        </label>
        <textarea
          id="schema-validator-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={code.split("\n").length > 14 ? 18 : 12}
          placeholder={'Paste JSON-LD, a <script type="application/ld+json"> tag, HTML with microdata / RDFa, or a whole page source.'}
          className="block w-full resize-y rounded-[16px] bg-white/55 p-4 font-mono text-[13px] leading-5 text-ds-ink outline-none placeholder:font-sans placeholder:text-[15px] placeholder:text-ds-ink-3 focus:bg-white/70"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ds-ink-2">
            <span className="font-serif text-[16px] italic">try</span>
            {EXAMPLES.map((ex) => (
              <button key={ex.label} type="button" onClick={() => setCode(ex.code)} className="glass-inset rounded-[10px] px-2.5 py-1 text-[12.5px] text-ds-ink-2 transition hover:bg-white/80 hover:text-ds-ink">
                {ex.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[12.5px] text-ds-ink-3">
            <span>Checked live in your browser · nothing uploaded</span>
            {code && (
              <button type="button" onClick={() => setCode("")} className="text-ds-ink-2 underline underline-offset-2 hover:text-ds-ink">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      {codeReport && codeData && <ReportView report={codeReport} blocks={codeData.jsonLd} subject="Pasted code" onEdit={(item) => edit(item, codeData)} />}
    </div>
  );
}
