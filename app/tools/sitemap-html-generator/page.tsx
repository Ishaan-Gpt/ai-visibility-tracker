import type { Metadata } from "next";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { ToolsFooter } from "@/components/tools/shared/layout/ToolsFooter";
import { ScrollProgress } from "@/components/tools/shared/motion/ScrollProgress";
import { OpeningMark } from "@/components/tools/sitemap-html-generator/sections/OpeningMark";
import { TheFlatListProblem } from "@/components/tools/sitemap-html-generator/sections/TheFlatListProblem";
import { WhyItMattersNow } from "@/components/tools/sitemap-html-generator/sections/WhyItMattersNow";
import { WhatTheOldToolsMiss } from "@/components/tools/sitemap-html-generator/sections/WhatTheOldToolsMiss";
import { LiveMechanism } from "@/components/tools/sitemap-html-generator/sections/LiveMechanism";
import { CoverageMap } from "@/components/tools/sitemap-html-generator/sections/CoverageMap";
import { TrustAndProof } from "@/components/tools/sitemap-html-generator/sections/TrustAndProof";
import { TheBridge } from "@/components/tools/sitemap-html-generator/sections/TheBridge";
import { StartBuilding } from "@/components/tools/sitemap-html-generator/sections/StartBuilding";

export const metadata: Metadata = {
  title: "Sitemap.html Generator",
  description:
    "Turn a URL list — or an existing sitemap.xml — into a real, grouped HTML sitemap page. Free, no login, with a live rendered preview.",
};

export default function SitemapHtmlGeneratorPage() {
  return (
    <>
      <ScrollProgress />
      <ToolsHeader toolName="Sitemap.html Generator" />
      <main>
        <OpeningMark />
        <TheFlatListProblem />
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
