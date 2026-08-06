import type { Metadata } from "next";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { ToolsFooter } from "@/components/tools/shared/layout/ToolsFooter";
import { ScrollProgress } from "@/components/tools/shared/motion/ScrollProgress";
import { OpeningMark } from "@/components/tools/keyword-density-checker/sections/OpeningMark";
import { TheMythSection } from "@/components/tools/keyword-density-checker/sections/TheMythSection";
import { WhyItMattersNow } from "@/components/tools/keyword-density-checker/sections/WhyItMattersNow";
import { WhatTheOldToolsMiss } from "@/components/tools/keyword-density-checker/sections/WhatTheOldToolsMiss";
import { LiveMechanism } from "@/components/tools/keyword-density-checker/sections/LiveMechanism";
import { CoverageMap } from "@/components/tools/keyword-density-checker/sections/CoverageMap";
import { TrustAndProof } from "@/components/tools/keyword-density-checker/sections/TrustAndProof";
import { TheBridge } from "@/components/tools/keyword-density-checker/sections/TheBridge";
import { StartBuilding } from "@/components/tools/keyword-density-checker/sections/StartBuilding";

export const metadata: Metadata = {
  title: "Keyword Density Checker",
  description:
    "There's no ideal keyword density — check readability, natural repetition, and vocabulary diversity instead. Free, no login, entirely in your browser.",
};

export default function KeywordDensityCheckerPage() {
  return (
    <>
      <ScrollProgress />
      <ToolsHeader toolName="Keyword Density Checker" />
      <main>
        <OpeningMark />
        <TheMythSection />
        <WhyItMattersNow />
        <WhatTheOldToolsMiss />
        <LiveMechanism />
        <CoverageMap />
        <TrustAndProof />
        <TheBridge />
        <StartBuilding />
      </main>
      <ToolsFooter />
    </>
  );
}
