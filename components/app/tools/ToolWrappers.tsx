"use client";

import { SchemaWorkspace } from "@/components/tools/schema-generator/workspace/SchemaWorkspace";
import { SitemapWorkspace } from "@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace";
import { HtmlSitemapWorkspace } from "@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace";
import { KeywordDensityWorkspace } from "@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace";
import { Card } from "@/components/ds/primitives";

/** Thin client wrappers so server route pages can render the (client) workspaces with project-specific seeds. */

export function SchemaTool({ brandName, domain }: { brandName: string; domain: string }) {
  return (
    <Card className="p-4 sm:p-6">
      <SchemaWorkspace initialTypes={["organization"]} brand={{ name: brandName, domain }} />
    </Card>
  );
}

export function SitemapXmlTool({ domain }: { domain: string }) {
  return (
    <Card className="p-4 sm:p-6">
      <SitemapWorkspace
        initialEntries={[
          { loc: `https://${domain}/`, lastmod: "", changefreq: "weekly", priority: "1.0" },
          { loc: `https://${domain}/about`, lastmod: "", changefreq: "monthly", priority: "0.8" },
        ]}
      />
    </Card>
  );
}

export function SitemapHtmlTool({ domain }: { domain: string }) {
  return (
    <Card className="p-4 sm:p-6">
      <HtmlSitemapWorkspace
        initialEntries={[
          { url: `https://${domain}/`, label: "Home", section: "Main" },
          { url: `https://${domain}/pricing`, label: "Pricing", section: "Main" },
        ]}
      />
    </Card>
  );
}

export function DensityTool({ brandName }: { brandName: string }) {
  return (
    <Card className="p-4 sm:p-6">
      <KeywordDensityWorkspace initialContent="" initialKeywordsRaw={brandName} />
    </Card>
  );
}
