import type { Metadata } from "next";
import { ToolCard, ToolRow } from "@/components/marketing/ToolCards";
import { ToolStage } from "@/components/tools/ToolFrame";
import { HERO_TOOLS, MORE_TOOLS } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Free SEO tools",
  description:
    "Every seowise tool, free and without signup: page audit, AI crawler check, robots.txt and llms.txt generator, schema, sitemaps, meta preview, keyword research and density.",
  alternates: { canonical: "/tools" },
};

/** Bento spans on a 6-column grid: rows of 4+2, 2+4, 3+3. */
const BENTO = [4, 2, 2, 4, 3, 3];

export default function ToolsHub() {
  return (
    <>
      <section className="pt-12 text-center sm:pt-16">
        <div className="mx-auto max-w-[1000px] px-4">
          <span className="rounded-md bg-[#e9e3d5] px-2.5 py-1 text-[12.5px] text-ds-ink-2">{HERO_TOOLS.length + MORE_TOOLS.length} tools · all free</span>
          <h1 className="mt-7 font-serif text-[50px] leading-[1] tracking-[-0.025em] sm:text-[80px] lg:text-[96px]">
            <span className="block">Every tool, free.</span>
            <span className="block italic">No signup.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[540px] text-[17px] leading-[1.55] text-ds-ink-2">
            Paste a URL and get an answer. Every result carries an AI-search lens and exports to a clean PDF you can send a client
          </p>
        </div>
      </section>

      <ToolStage>
        <div className="grid gap-4 md:grid-cols-6">
          {HERO_TOOLS.map((t, i) => {
            const span = BENTO[i % BENTO.length];
            return (
              <div key={t.slug} className={`${span === 4 ? "md:col-span-4" : span === 3 ? "md:col-span-3" : "md:col-span-2"} min-h-[270px]`}>
                <ToolCard slug={t.slug} index={i} large={span >= 3} />
              </div>
            );
          })}
        </div>
        <p className="mb-3 mt-10 pl-2 font-serif text-[22px] italic text-ds-ink-2">Also in the kit</p>
        <ul className="glass overflow-hidden rounded-[24px]">
          {MORE_TOOLS.map((t, i) => (
            <ToolRow key={t.slug} slug={t.slug} index={i} />
          ))}
        </ul>
      </ToolStage>
      <div className="h-24" />
    </>
  );
}
