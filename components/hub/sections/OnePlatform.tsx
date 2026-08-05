import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { OrganizationIcon, WebsiteIcon, GaugeIcon, SparkIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PILLARS = [
  { icon: OrganizationIcon, title: "Structured data", body: "Schema markup that satisfies Google's actual requirements, not just valid JSON." },
  { icon: WebsiteIcon, title: "Discoverability", body: "Sitemaps built for crawlers and for the humans who land on your site directly." },
  { icon: GaugeIcon, title: "Content balance", body: "Keyword density and topical coverage checks before you ship a page." },
  { icon: SparkIcon, title: "AI visibility", body: "Whether Gemini and ChatGPT actually cite you when it matters — OpenGeo's job." },
];

export function OnePlatform() {
  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          One system, four surfaces
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Everything that decides whether you're found." />
        </h2>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <div key={p.title} className="flex flex-col gap-4">
            <IconTile>
              <p.icon />
            </IconTile>
            <h3 className="font-display text-lg text-foreground">{p.title}</h3>
            <p className="font-body text-sm text-foreground/60">{p.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
