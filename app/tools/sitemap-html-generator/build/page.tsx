import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function SitemapHtmlGeneratorBuildPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/tools/ai-visibility-tracker/login?next=%2Ftools%2Fai-visibility-tracker%2Fdashboard%3Ftool%3Dsitemap-html-generator");
  }
  redirect("/tools/ai-visibility-tracker/dashboard?tool=sitemap-html-generator");
}
