import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { WebsiteIcon, GaugeIcon, LayersIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PILLARS = [
  {
    icon: WebsiteIcon,
    title: "Discovery",
    body: "A sitemap tells crawlers every URL exists — the single most reliable way to get new pages found.",
  },
  {
    icon: GaugeIcon,
    title: "Freshness",
    body: "lastmod signals which pages changed recently, helping crawlers prioritize what to recheck first.",
  },
  {
    icon: LayersIcon,
    title: "Scale",
    body: "Past 50,000 URLs, you need a sitemap index splitting them into files — handled automatically here.",
  },
];

export function WhyItMattersNow() {
  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Why this matters
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="One file, three jobs." />
        </h2>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col gap-4">
            <IconTile>
              <pillar.icon />
            </IconTile>
            <h3 className="font-display text-xl text-foreground">{pillar.title}</h3>
            <p className="font-body text-sm text-foreground/60">{pillar.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
