import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { Badge } from "@/components/tools/shared/ui/Badge";
import {
  ListIcon,
  WebsiteIcon,
  LinkIcon,
  LayersIcon,
  CheckRingIcon,
  GaugeIcon,
  UploadIcon,
  BreadcrumbIcon,
} from "@/components/tools/shared/icons/SchemaIcons";

const FEATURES = [
  { icon: ListIcon, name: "Grouped, labeled sections", badge: "Not a flat list" },
  { icon: WebsiteIcon, name: "Standalone hostable page", badge: "Ready to publish" },
  { icon: LinkIcon, name: "Embeddable snippet", badge: "Inherits your styles" },
  { icon: LayersIcon, name: "Import from sitemap.xml", badge: "No re-entry" },
  { icon: UploadIcon, name: "Cross-tool session detection", badge: "One suite" },
  { icon: BreadcrumbIcon, name: "Auto-derived labels", badge: "From the URL path" },
  { icon: GaugeIcon, name: "Live rendered preview", badge: "Not code-only" },
  { icon: CheckRingIcon, name: "Duplicate & structure scoring", badge: "Live scoring" },
];

export function CoverageMap() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Full coverage
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Everything a real sitemap page needs." />
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {FEATURES.map((feature) => (
          <GlassCard
            key={feature.name}
            className="group flex flex-col gap-4 p-5 transition-transform duration-300 hover:-translate-y-1"
          >
            <feature.icon className="h-6 w-6 text-foreground/70 transition-colors group-hover:text-primary" />
            <p className="font-body text-sm text-foreground">{feature.name}</p>
            <Badge tone="outline" className="w-fit">
              {feature.badge}
            </Badge>
          </GlassCard>
        ))}
      </div>
    </SectionShell>
  );
}
