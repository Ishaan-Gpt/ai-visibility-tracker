import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getAppContext } from "@/lib/app-context";
import { PageAuditWorkspace } from "@/components/tools/page-audit/PageAuditWorkspace";
import { toolBySlug } from "@/lib/nav";

const tool = toolBySlug("audit");

export const metadata: Metadata = { title: tool.name };

export default async function Page() {
  const ctx = await getAppContext();
  return (
    <>
      <PageHeader title={tool.name} description={tool.description} />
      <PageAuditWorkspace initialUrl={`https://${ctx.brand.domain}`} />
    </>
  );
}
