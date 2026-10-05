import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { KeywordResearchWorkspace } from "@/components/tools/keyword-research/KeywordResearchWorkspace";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("keywords");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <KeywordResearchWorkspace />
    </>
  );
}
