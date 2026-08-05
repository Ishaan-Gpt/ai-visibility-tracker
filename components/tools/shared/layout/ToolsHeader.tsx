import Link from "next/link";
import { Logomark } from "@/components/tools/shared/icons/Logomark";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

type ToolsHeaderProps = {
  /** Optional current-tool label shown next to the wordmark, e.g. "Schema Markup Generator". */
  toolName?: string;
};

export function ToolsHeader({ toolName }: ToolsHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Logomark className="h-6 w-6 text-primary" />
          <span className="font-display text-lg">OpenSeo</span>
          {toolName ? (
            <span className="hidden font-body text-sm text-foreground/40 md:inline">/ {toolName}</span>
          ) : null}
        </Link>

        <MagneticButton href="/tools/ai-visibility-tracker/signup" tone="ink" className="!px-5 !py-2.5 !text-xs">
          Get OpenGeo free
        </MagneticButton>
      </div>
    </header>
  );
}
