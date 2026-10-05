import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getAppContext } from "@/lib/app-context";
import { DensityTool } from "@/components/app/tools/ToolWrappers";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("density");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  const ctx = await getAppContext();
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <DensityTool brandName={ctx.brand.name} />
    </>
  );
}
