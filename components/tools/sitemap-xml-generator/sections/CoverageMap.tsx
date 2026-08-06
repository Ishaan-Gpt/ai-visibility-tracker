import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { Badge } from "@/components/tools/shared/ui/Badge";
import {
  WebsiteIcon,
  LayersIcon,
  GaugeIcon,
  CheckRingIcon,
  UploadIcon,
  ListIcon,
  LinkIcon,
  BreadcrumbIcon,
} from "@/components/tools/shared/icons/SchemaIcons";

const FEATURES = [
  { icon: WebsiteIcon, name: "Standard <urlset> XML", badge: "Spec-conformant" },
  { icon: LayersIcon, name: "Automatic index splitting", badge: "Beyond 50k URLs" },
  { icon: GaugeIcon, name: "lastmod, changefreq, priority", badge: "Full protocol" },
  { icon: CheckRingIcon, name: "Paste-and-validate existing sitemaps", badge: "No crawl" },
  { icon: UploadIcon, name: "Bulk import from a pasted list", badge: "No cap" },
  { icon: ListIcon, name: "Manual row-by-row builder", badge: "For small sites" },
  { icon: LinkIcon, name: "Duplicate URL detection", badge: "Live scoring" },
  { icon: BreadcrumbIcon, name: "Protocol & host consistency checks", badge: "Live scoring" },
];

export function CoverageMap() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Full coverage
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Everything the protocol supports, done right." />
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
