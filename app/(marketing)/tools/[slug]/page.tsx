import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolMount } from "@/components/tools/ToolMount";
import { ToolStage, ToolHero, ToolFaq } from "@/components/tools/ToolFrame";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { IcOpen } from "@/components/icons/Studio";
import { IconSpark } from "@/components/icons/Icons";
import { TOOLS, toolBySlug, toolHref } from "@/lib/tools/registry";
import { siteUrl } from "@/lib/site";
import { BRAND } from "@/lib/brand";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return {};
  const title = tool.kind === "account" ? tool.name : `Free ${tool.name} Tool`;
  return {
    title,
    description: tool.description,
    alternates: { canonical: toolHref(tool.slug) },
    openGraph: { title: `${title} · ${BRAND.name}`, description: tool.description, url: toolHref(tool.slug) },
  };
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();

  const related = TOOLS.filter((t) => t.slug !== tool.slug && (t.tier === "hero" || tool.tier === "more")).slice(0, 3);
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `${tool.name} by ${BRAND.name}`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${base}${toolHref(tool.slug)}`,
        description: tool.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      { "@type": "FAQPage", mainEntity: tool.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Tools", item: `${base}/tools` },
          { "@type": "ListItem", position: 2, name: tool.name, item: `${base}${toolHref(tool.slug)}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <ToolHero slug={tool.slug} name={tool.name} headline={tool.headline} tagline={tool.tagline} kind={tool.kind} />

      <ToolStage>
        <ToolMount slug={tool.slug} />
      </ToolStage>

      {/* AI lens + how it works */}
      <section className="no-print py-24 sm:py-32" data-print-hide>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-md bg-[#e9e3d5] px-2.5 py-1 text-[12.5px] text-ds-ink-2">
              <IconSpark className="h-3.5 w-3.5 text-ds-accent-ink" /> The AI-search lens
            </p>
            <h2 className="mt-5 font-serif text-[44px] leading-[1.02] tracking-[-0.025em] sm:text-[64px]">
              <span className="block">Ready for ChatGPT, Gemini</span>
              <span className="block italic">and Perplexity?</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {tool.aiLens.map((l, i) => (
              <div key={l} className="glass relative overflow-hidden rounded-[22px] p-6">
                <span className="font-serif text-[48px] italic leading-none text-ds-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-4 text-[15.5px] leading-6 text-ds-ink">{l}</p>
              </div>
            ))}
          </div>

          <div className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="font-serif text-[44px] leading-[1.02] tracking-[-0.025em] sm:text-[56px]">
              How it <span className="italic">works</span>
            </h2>
            <ol>
              {tool.explainer.map((e, i) => (
                <li key={e.title} className="grid grid-cols-[44px_1fr] gap-x-2 border-t border-ds-line py-6 last:border-b">
                  <span className="pt-1 font-mono text-[11.5px] text-[#5c7c68]">0{i + 1}</span>
                  <div>
                    <h3 className="text-[19px] font-medium tracking-[-0.015em]">{e.title}</h3>
                    <p className="mt-2 text-[15.5px] leading-7 text-ds-ink-2">{e.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <ToolFaq faq={tool.faq} />
        </div>
      </section>

      <section className="no-print pb-28" data-print-hide>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-[36px] leading-none">
              Pairs well <span className="italic">with</span>
            </h2>
            <Link href="/tools" className="text-[14px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline">
              Every tool
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((t) => (
              <Link key={t.slug} href={toolHref(t.slug)} className="glass group flex flex-col rounded-[22px] p-6 transition-transform duration-500 ease-[var(--ds-ease)] hover:-translate-y-1">
                <span className="flex items-start justify-between">
                  <span className="glass-inset flex h-12 w-12 items-center justify-center rounded-[14px] transition-transform duration-500 ease-[var(--ds-spring)] group-hover:rotate-[-8deg] group-hover:scale-110">
                    <ToolGlyph slug={t.slug} className="h-6 w-6" />
                  </span>
                  <IcOpen className="h-4 w-4 text-ds-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ds-ink" />
                </span>
                <span className="mt-6 font-serif text-[26px] leading-none">{t.name}</span>
                <span className="mt-2 text-[14px] leading-6 text-ds-ink-2">{t.tagline}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
