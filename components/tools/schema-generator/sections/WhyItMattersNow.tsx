import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { WebsiteIcon, SparkIcon, GraphIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PILLARS = [
  {
    icon: WebsiteIcon,
    title: "Google Rich Results",
    stat: "Stars, FAQs, breadcrumbs",
    body: "Structured data is the only way to unlock the visual real estate above a plain blue link.",
  },
  {
    icon: SparkIcon,
    title: "AI Answer Engines",
    stat: "Gemini · ChatGPT Search · Perplexity",
    body: "These models increasingly ground answers in structured facts, not just page copy — schema is the data diet they read first.",
  },
  {
    icon: GraphIcon,
    title: "Knowledge Graph Entities",
    stat: "One page, one canonical entity",
    body: "Composed, linked JSON-LD tells search engines who you are unambiguously — not just what your page says.",
  },
];

export function WhyItMattersNow() {
  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Why this matters in 2026
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Schema isn't just for Google anymore." />
        </h2>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col gap-4">
            <IconTile>
              <pillar.icon />
            </IconTile>
            <h3 className="font-display text-xl text-foreground">{pillar.title}</h3>
            <p className="font-body text-xs uppercase tracking-[0.08em] text-primary">{pillar.stat}</p>
            <p className="font-body text-sm text-foreground/60">{pillar.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
