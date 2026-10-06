import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { HistoryView, OverviewView } from "@/components/studio/Views";
import { BillingView } from "@/components/studio/Billing";
import ScoreCard from "@/components/dashboard/ScoreCard";
import CompetitorCompare from "@/components/dashboard/CompetitorCompare";
import { Glass, Masthead } from "@/components/studio/Glass";
import TrendChart from "@/components/dashboard/TrendChart";
import { planRows } from "@/lib/plan-rows";
import type { HistoryItem } from "@/lib/history";

/**
 * Development-only design preview of the studio with sample data (no sign-in needed).
 * Returns 404 in production. Views: ?view=overview | history | billing | visibility
 */
export const metadata: Metadata = { title: "Studio preview", robots: { index: false, follow: false } };

const DAY = 86_400_000;
const SAMPLE: HistoryItem[] = [
  { id: "1", tool: "page-audit", title: "Northside Dental · Services", subtitle: "https://northside-dental.example/services", score: 72, aiScore: 58, createdAt: Date.now() - 2 * 3600_000 },
  { id: "2", tool: "ai-crawlers", title: "acme-bakery.example", subtitle: "https://acme-bakery.example/robots.txt", score: 41, aiScore: null, createdAt: Date.now() - DAY },
  { id: "3", tool: "page-audit", title: "Acme Bakery · Wedding cakes", subtitle: "https://acme-bakery.example/wedding-cakes", score: 88, aiScore: 81, createdAt: Date.now() - 3 * DAY },
  { id: "4", tool: "page-audit", title: "Fieldnotes Studio · Home", subtitle: "https://fieldnotes.example/", score: 94, aiScore: 90, createdAt: Date.now() - 9 * DAY },
];

export default async function StudioPreview({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { view = "overview" } = await searchParams;
  const path = view === "history" ? "/app/history" : view === "billing" ? "/app/billing" : view === "visibility" ? "/app/visibility" : "/app";

  return (
    <AppShell email="ishaan@example.com" planLabel="Free" previewPath={path}>
      {view === "history" && <HistoryView reports={SAMPLE} limit={10} isPro={false} />}
      {view === "billing" && <BillingView isPaid={false} billingConfigured={false} billingStatus={null} rows={planRows()} />}
      {view === "visibility" && (
        <>
          <Masthead crumb="acme-bakery.example" title="AI" italic="Visibility" lede="Sample data. Engine: Gemini with Google Search grounding." />
          <div className="grid gap-5 lg:grid-cols-3">
            <ScoreCard score={62} checkedPrompts={3} />
            <Glass className="p-6 lg:col-span-2">
              <h2 className="mb-3 font-serif text-[28px] leading-none">
                Visibility <span className="italic">over time</span>
              </h2>
              <TrendChart
                rollups={[40, 44, 51, 48, 57, 62].map((score, i) => ({ brandId: "x", date: `2026-09-${String(10 + i * 4).padStart(2, "0")}`, totalPrompts: 3, mentionedCount: 2, score, competitorMentionCounts: {} }))}
              />
            </Glass>
          </div>
          <div className="mt-5 max-w-[560px]">
            <CompetitorCompare
              brand={{ id: "x", ownerUid: "x", name: "Acme Bakery", domain: "acme-bakery.example", competitors: [{ name: "Crumb & Co", domain: "crumb.example" }], createdAt: 0 }}
              latestRollup={{ brandId: "x", date: "2026-10-01", totalPrompts: 3, mentionedCount: 2, score: 62, competitorMentionCounts: { "crumb.example": 1 } }}
            />
          </div>
        </>
      )}
      {view === "overview" && (
        <OverviewView
          name="ishaan"
          usage={[
            { tool: "page-audit", used: 7, limit: 25 },
            { tool: "ai-crawlers", used: 31, limit: 40 },
            { tool: "keywords", used: 1, limit: 6 },
          ]}
          reports={SAMPLE}
          reportLimit={10}
          brand={null}
        />
      )}
    </AppShell>
  );
}
