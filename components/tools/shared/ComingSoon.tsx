import type { ComponentType, SVGProps } from "react";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { ToolsFooter } from "@/components/tools/shared/layout/ToolsFooter";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { Badge } from "@/components/tools/shared/ui/Badge";

type ComingSoonProps = {
  toolName: string;
  tagline: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function ComingSoon({ toolName, tagline, description, icon: Icon }: ComingSoonProps) {
  return (
    <>
      <ToolsHeader toolName={toolName} />
      <SectionShell height="full" className="items-center">
        <div className="mx-auto max-w-xl text-center">
          <IconTile className="mx-auto mb-8">
            <Icon />
          </IconTile>
          <Badge tone="primary" className="mb-6">
            Coming soon
          </Badge>
          <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text={toolName} />
          </h1>
          <p className="mt-4 font-body text-sm uppercase tracking-[0.1em] text-primary md:whitespace-nowrap">
            {tagline}
          </p>
          <p className="mx-auto mt-6 max-w-md font-body text-foreground/60">{description}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <MagneticButton href="/tools/schema-generator">Try Schema Markup Generator</MagneticButton>
            <MagneticButton href="/" tone="ghost">
              Back to OpenSeo
            </MagneticButton>
          </div>
        </div>
      </SectionShell>
      <ToolsFooter />
    </>
  );
}
