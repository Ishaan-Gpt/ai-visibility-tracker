import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { Logomark } from "@/components/tools/shared/icons/Logomark";

export function GetOpenGeo() {
  return (
    <SectionShell height="full" tone="foreground" className="items-center border-t border-foreground/10">
      <div className="mx-auto max-w-2xl text-center">
        <Logomark className="mx-auto mb-8 h-8 w-8 text-primary" />
        <p className="mb-6 font-body text-xs uppercase tracking-[0.25em] text-background/50 md:whitespace-nowrap">
          The suite's flagship
        </p>
        <h2 className="font-display text-4xl leading-tight md:text-6xl">
          <RevealText text="The free tools fix your markup." className="block" />
          <RevealText text="OpenGeo tells you if it worked." delay={0.12} className="block text-primary" />
        </h2>
        <p className="mx-auto mt-8 max-w-md font-body text-background/60">
          Structured data, sitemaps, and clean content are table stakes. OpenGeo is where you find out whether
          Gemini, ChatGPT, and Perplexity actually mention your brand.
        </p>
        <div className="mt-10">
          <MagneticButton href="/tools/ai-visibility-tracker/signup" tone="primary">
            Start OMNI SEO
          </MagneticButton>
        </div>
      </div>
    </SectionShell>
  );
}
