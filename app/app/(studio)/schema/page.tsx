import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getAppContext } from "@/lib/app-context";
import { SchemaTool } from "@/components/app/tools/ToolWrappers";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("schema");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  const ctx = await getAppContext();
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <SchemaTool brandName={ctx.brand.name} domain={ctx.brand.domain} />
    </>
  );
}
