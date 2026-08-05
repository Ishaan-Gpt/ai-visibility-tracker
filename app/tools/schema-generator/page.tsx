import type { Metadata } from "next";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { ToolsFooter } from "@/components/tools/shared/layout/ToolsFooter";
import { ScrollProgress } from "@/components/tools/shared/motion/ScrollProgress";
import { OpeningMark } from "@/components/tools/schema-generator/sections/OpeningMark";
import { TheBlindSpot } from "@/components/tools/schema-generator/sections/TheBlindSpot";
import { WhyItMattersNow } from "@/components/tools/schema-generator/sections/WhyItMattersNow";
import { WhatTheOldToolsMiss } from "@/components/tools/schema-generator/sections/WhatTheOldToolsMiss";
import { LiveMechanism } from "@/components/tools/schema-generator/sections/LiveMechanism";
import { CoverageMap } from "@/components/tools/schema-generator/sections/CoverageMap";
import { TrustAndProof } from "@/components/tools/schema-generator/sections/TrustAndProof";
import { TheBridge } from "@/components/tools/schema-generator/sections/TheBridge";
import { StartBuilding } from "@/components/tools/schema-generator/sections/StartBuilding";

export const metadata: Metadata = {
  title: "Schema Markup Generator",
  description:
    "Generate rich, Google-eligible JSON-LD schema markup — Organization, Product, Article, FAQ, and more — free, no login, with live completeness scoring against real rich-result requirements.",
};

export default function SchemaGeneratorPage() {
  return (
    <>
      <ScrollProgress />
      <ToolsHeader toolName="Schema Markup Generator" />
      <main>
        <OpeningMark />
        <TheBlindSpot />
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
