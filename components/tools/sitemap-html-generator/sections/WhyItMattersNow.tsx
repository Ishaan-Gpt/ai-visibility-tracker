import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { ListIcon, LinkIcon, LayersIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PILLARS = [
  {
    icon: ListIcon,
    title: "Real navigation",
    body: "For large or complex sites, a grouped sitemap page helps visitors find what your nav menu buries.",
  },
  {
    icon: LinkIcon,
    title: "Internal linking",
    body: "A sitemap page distributes links to deep pages that might otherwise have none pointing to them at all.",
  },
  {
    icon: LayersIcon,
    title: "Orphan prevention",
    body: "Pages with no internal links pointing to them are easy to lose — a sitemap page gives every URL at least one.",
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
          <RevealText text="A page worth actually linking." />
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
