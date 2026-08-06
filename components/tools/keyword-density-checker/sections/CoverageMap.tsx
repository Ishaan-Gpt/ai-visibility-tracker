import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { Badge } from "@/components/tools/shared/ui/Badge";
import {
  ListIcon,
  GaugeIcon,
  LinkIcon,
  BreadcrumbIcon,
  CheckRingIcon,
  SparkIcon,
  WebsiteIcon,
  LayersIcon,
} from "@/components/tools/shared/icons/SchemaIcons";

const FEATURES = [
  { icon: ListIcon, name: "1/2/3-word phrase analysis", badge: "Not just single words" },
  { icon: LayersIcon, name: "Stop-word filtering", badge: "On by default" },
  { icon: LinkIcon, name: "Target keyword tracking", badge: "Diagnostic, not a target" },
  { icon: BreadcrumbIcon, name: "Heading-aware parsing", badge: "HTML & Markdown" },
  { icon: GaugeIcon, name: "Flesch readability score", badge: "Published formula" },
  { icon: SparkIcon, name: "Vocabulary diversity", badge: "Live scoring" },
  { icon: CheckRingIcon, name: "Stuffing-risk detection", badge: "Not a fake gauge" },
  { icon: WebsiteIcon, name: "No URL fetching", badge: "100% in your browser" },
];

export function CoverageMap() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Full coverage
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Every signal that actually helps." />
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
