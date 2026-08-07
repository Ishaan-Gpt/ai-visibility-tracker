import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function SitemapXmlGeneratorBuildPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/tools/ai-visibility-tracker/login?next=%2Ftools%2Fai-visibility-tracker%2Fdashboard%3Ftool%3Dsitemap-xml-generator");
  }
  redirect("/tools/ai-visibility-tracker/dashboard?tool=sitemap-xml-generator");
}
