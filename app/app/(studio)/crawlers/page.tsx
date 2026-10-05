import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getAppContext } from "@/lib/app-context";
import { AiCrawlerWorkspace } from "@/components/tools/ai-crawlers/AiCrawlerWorkspace";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("crawlers");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  const ctx = await getAppContext();
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <AiCrawlerWorkspace initialDomain={ctx.brand.domain} />
    </>
  );
}
