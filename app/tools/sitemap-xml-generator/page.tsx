import type { Metadata } from "next";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { ToolsFooter } from "@/components/tools/shared/layout/ToolsFooter";
import { ScrollProgress } from "@/components/tools/shared/motion/ScrollProgress";
import { OpeningMark } from "@/components/tools/sitemap-xml-generator/sections/OpeningMark";
import { TheCrawlWall } from "@/components/tools/sitemap-xml-generator/sections/TheCrawlWall";
import { WhyItMattersNow } from "@/components/tools/sitemap-xml-generator/sections/WhyItMattersNow";
import { WhatTheOldToolsMiss } from "@/components/tools/sitemap-xml-generator/sections/WhatTheOldToolsMiss";
import { LiveMechanism } from "@/components/tools/sitemap-xml-generator/sections/LiveMechanism";
import { CoverageMap } from "@/components/tools/sitemap-xml-generator/sections/CoverageMap";
import { TrustAndProof } from "@/components/tools/sitemap-xml-generator/sections/TrustAndProof";
import { TheBridge } from "@/components/tools/sitemap-xml-generator/sections/TheBridge";
import { StartBuilding } from "@/components/tools/sitemap-xml-generator/sections/StartBuilding";

export const metadata: Metadata = {
  title: "Sitemap.xml Generator",
  description:
    "Generate a spec-conformant sitemap.xml — no crawling, no URL cap. Paste a list or build it by hand, with automatic sitemap-index splitting past 50,000 URLs.",
};

export default function SitemapXmlGeneratorPage() {
  return (
    <>
      <ScrollProgress />
      <ToolsHeader toolName="Sitemap.xml Generator" />
      <main>
        <OpeningMark />
        <TheCrawlWall />
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
