"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { IconArrow as ArrowRight, IconLock as Lock, IconPdf as FileDown } from "@/components/icons/Icons";
import { ArchWindow } from "@/components/studio/Pieces";
import ScoreCard from "@/components/dashboard/ScoreCard";

// Each tool page only downloads its own workspace.
const loading = () => <div className="skeleton h-[420px] rounded-ds-xl" />;
const PageAuditWorkspace = dynamic(() => import("@/components/tools/page-audit/PageAuditWorkspace").then((m) => m.PageAuditWorkspace), { loading });
const AiCrawlerWorkspace = dynamic(() => import("@/components/tools/ai-crawlers/AiCrawlerWorkspace").then((m) => m.AiCrawlerWorkspace), { loading });
const AiFilesWorkspace = dynamic(() => import("@/components/tools/ai-files/AiFilesWorkspace").then((m) => m.AiFilesWorkspace), { loading });
const SerpPreviewWorkspace = dynamic(() => import("@/components/tools/serp-preview/SerpPreviewWorkspace").then((m) => m.SerpPreviewWorkspace), { loading });
const KeywordResearchWorkspace = dynamic(() => import("@/components/tools/keyword-research/KeywordResearchWorkspace").then((m) => m.KeywordResearchWorkspace), { loading });
const SchemaWorkspace = dynamic(() => import("@/components/tools/schema-generator/workspace/SchemaWorkspace").then((m) => m.SchemaWorkspace), { loading });
const SitemapWorkspace = dynamic(() => import("@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace").then((m) => m.SitemapWorkspace), { loading });
const HtmlSitemapWorkspace = dynamic(() => import("@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace").then((m) => m.HtmlSitemapWorkspace), { loading });
const KeywordDensityWorkspace = dynamic(() => import("@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace").then((m) => m.KeywordDensityWorkspace), { loading });
import { exportPdf } from "@/components/tools/shell/ResultActions";
import { PrintFooter, PrintHeader } from "@/components/tools/shell/Bits";
import { useViewer } from "@/components/viewer/useViewer";
import { toolBySlug } from "@/lib/tools/registry";

/** Frame for browser-only tools: a glass toolbar with PDF export, the workspace on a glass pane. */
function ClientToolFrame({ slug, children }: { slug: string; children: React.ReactNode }) {
  const tool = toolBySlug(slug)!;
  return (
    <div className="studio-scope">
      <PrintHeader title={tool.name} subject="Generated in your browser with seowise" />
      <div className="no-print glass mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] py-2 pl-4 pr-2" data-print-hide>
        <p className="inline-flex items-center gap-2.5 text-[13.5px] text-ds-ink-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5c7c68]/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5c7c68]" />
          </span>
          Runs in your browser · nothing uploaded · <span className="font-serif text-[16px] italic text-ds-ink">unlimited</span>
        </p>
        <button
          type="button"
          onClick={() => exportPdf(`seowise ${tool.name}`)}
          className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-ds-accent px-4 text-[14px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)] active:translate-y-px"
        >
          <FileDown className="h-4 w-4" /> Export PDF
        </button>
      </div>
      <div className="glass-strong rounded-[26px] p-3 sm:p-6">{children}</div>
      <PrintFooter />
    </div>
  );
}

function VisibilityCta() {
  const viewer = useViewer();
  const href = viewer?.signedIn ? "/app/visibility" : `/signup?next=${encodeURIComponent("/app/visibility")}`;
  return (
    <div className="glass-strong grid gap-3 rounded-[28px] p-3 md:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col justify-center p-5 sm:p-9">
        <p className="inline-flex w-fit items-center gap-2 rounded-md bg-[#e9e3d5] px-2.5 py-1 text-[12.5px] text-ds-ink-2">
          <Lock className="h-3.5 w-3.5" /> Needs a free account
        </p>
        <h2 className="mt-5 font-serif text-[44px] leading-[1] sm:text-[56px]">
          Watch your brand appear in <span className="italic">AI answers</span>
        </h2>
        <p className="mt-4 max-w-[480px] text-[15.5px] leading-7 text-ds-ink-2">
          Tracking runs on a schedule and keeps history, so it lives in your account. The free plan tracks 3 prompts and 1 competitor, checked weekly.
        </p>
        <Link href={href} className="group mt-7 inline-flex h-12 w-fit items-center gap-2 rounded-[12px] bg-ds-accent px-6 text-[15px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)]">
          {viewer?.signedIn ? "Open the tracker" : "Start tracking free"}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ArchWindow className="min-h-[380px]">
        <div className="text-ds-ink">
          <ScoreCard score={61} checkedPrompts={3} />
          <p className="mt-2 text-right text-[11px] text-white/85">The real tracker card, on sample data</p>
        </div>
      </ArchWindow>
    </div>
  );
}

export function ToolMount({ slug }: { slug: string }) {
  switch (slug) {
    case "page-audit":
      return <PageAuditWorkspace />;
    case "ai-crawler-check":
      return <AiCrawlerWorkspace />;
    case "keyword-research":
      return <KeywordResearchWorkspace />;
    case "llms-txt-generator":
      return (
        <ClientToolFrame slug={slug}>
          <AiFilesWorkspace brandName="" domain="" />
        </ClientToolFrame>
      );
    case "meta-tag-preview":
      return (
        <ClientToolFrame slug={slug}>
          <SerpPreviewWorkspace brandName="Your Brand" domain="yoursite.com" />
        </ClientToolFrame>
      );
    case "schema-generator":
      return (
        <ClientToolFrame slug={slug}>
          <SchemaWorkspace initialTypes={["organization"]} />
        </ClientToolFrame>
      );
    case "sitemap-xml-generator":
      return (
        <ClientToolFrame slug={slug}>
          <SitemapWorkspace
            initialEntries={[
              { loc: "https://yoursite.com/", lastmod: "", changefreq: "weekly", priority: "1.0" },
              { loc: "https://yoursite.com/about", lastmod: "", changefreq: "monthly", priority: "0.8" },
            ]}
          />
        </ClientToolFrame>
      );
    case "sitemap-html-generator":
      return (
        <ClientToolFrame slug={slug}>
          <HtmlSitemapWorkspace
            initialEntries={[
              { url: "https://yoursite.com/", label: "Home", section: "Main" },
              { url: "https://yoursite.com/pricing", label: "Pricing", section: "Main" },
            ]}
          />
        </ClientToolFrame>
      );
    case "keyword-density-checker":
      return (
        <ClientToolFrame slug={slug}>
          <KeywordDensityWorkspace />
        </ClientToolFrame>
      );
    case "ai-visibility-tracker":
      return <VisibilityCta />;
    default:
      return null;
  }
}
