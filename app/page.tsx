import type { Metadata } from "next";
import { ToolsHeader } from "@/components/tools/shared/layout/ToolsHeader";
import { ToolsFooter } from "@/components/tools/shared/layout/ToolsFooter";
import { ScrollProgress } from "@/components/tools/shared/motion/ScrollProgress";
import { Hero } from "@/components/hub/sections/Hero";
import { TheFragmentation } from "@/components/hub/sections/TheFragmentation";
import { OnePlatform } from "@/components/hub/sections/OnePlatform";
import { WhyNow } from "@/components/hub/sections/WhyNow";
import { HowWeBuild } from "@/components/hub/sections/HowWeBuild";
import { ToolsGrid } from "@/components/hub/sections/ToolsGrid";
import { UnderTheHood } from "@/components/hub/sections/UnderTheHood";
import { GetOpenGeo } from "@/components/hub/sections/GetOpenGeo";
import { StartExploring } from "@/components/hub/sections/StartExploring";

export const metadata: Metadata = {
  title: "OpenSeo — The SEO suite for the AI search era",
  description:
    "Structured data, sitemaps, content quality, and AI answer-engine visibility — one suite, starting free.",
};

export default function OpenSeoHubPage() {
  return (
    <>
      <ScrollProgress />
      <ToolsHeader />
      <main>
        <Hero />
        <TheFragmentation />
        <OnePlatform />
        <WhyNow />
        <HowWeBuild />
        <ToolsGrid />
        <UnderTheHood />
        <GetOpenGeo />
        <StartExploring />
      </main>
      <ToolsFooter />
    </>
  );
}
