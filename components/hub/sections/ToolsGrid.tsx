import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { Badge } from "@/components/tools/shared/ui/Badge";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import {
  GraphIcon,
  OrganizationIcon,
  WebsiteIcon,
  BreadcrumbIcon,
  GaugeIcon,
} from "@/components/tools/shared/icons/SchemaIcons";
import { HUB_TOOLS } from "@/lib/hub/tools";

const ICONS = {
  opengeo: GraphIcon,
  "schema-generator": OrganizationIcon,
  "sitemap-xml-generator": WebsiteIcon,
  "sitemap-html-generator": BreadcrumbIcon,
  "keyword-density-checker": GaugeIcon,
} as const;

export function ToolsGrid() {
  const opengeo = HUB_TOOLS.find((t) => t.slug === "opengeo")!;
  const rest = HUB_TOOLS.filter((t) => t.slug !== "opengeo");

  return (
    <SectionShell id="tools" className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          The suite
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Five tools. One is live." />
        </h2>
      </div>

      <GlassCard className="mb-6 flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraphIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-display text-2xl text-foreground">{opengeo.name}</h3>
              <Badge tone="outline">Coming soon</Badge>
            </div>
            <p className="font-body text-sm text-foreground/60">{opengeo.description}</p>
          </div>
        </div>
        <MagneticButton href={opengeo.href} tone="ghost" className="shrink-0">
          Preview
        </MagneticButton>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {rest.map((tool) => {
          const Icon = ICONS[tool.slug as keyof typeof ICONS];
          return (
            <a key={tool.slug} href={tool.href} className="block">
              <GlassCard className="group flex h-full flex-col gap-4 p-5 transition-transform duration-300 hover:-translate-y-1">
                <Icon className="h-6 w-6 text-foreground/70 transition-colors group-hover:text-primary" />
                <p className="font-body text-sm text-foreground">{tool.name}</p>
                <p className="font-body text-xs text-foreground/50">{tool.tagline}</p>
                <Badge tone={tool.status === "live" ? "primary" : "outline"} className="mt-auto w-fit">
                  {tool.status === "live" ? "Available now" : "Coming soon"}
                </Badge>
              </GlassCard>
            </a>
          );
        })}
      </div>
    </SectionShell>
  );
}
