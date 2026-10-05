import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getAppContext } from "@/lib/app-context";
import { AiFilesWorkspace } from "@/components/tools/ai-files/AiFilesWorkspace";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("ai-files");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  const ctx = await getAppContext();
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <AiFilesWorkspace brandName={ctx.brand.name} domain={ctx.brand.domain} />
    </>
  );
}
