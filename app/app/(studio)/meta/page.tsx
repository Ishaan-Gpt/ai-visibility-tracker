import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getAppContext } from "@/lib/app-context";
import { SerpPreviewWorkspace } from "@/components/tools/serp-preview/SerpPreviewWorkspace";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("meta");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  const ctx = await getAppContext();
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <SerpPreviewWorkspace brandName={ctx.brand.name} domain={ctx.brand.domain} />
    </>
  );
}
