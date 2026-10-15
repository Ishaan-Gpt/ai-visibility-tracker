import type { Metadata } from "next";
import { Masthead } from "@/components/studio/Glass";
import { Rise } from "@/components/studio/Views";
import { ComingSoonPage } from "@/components/studio/ComingSoon";
import { BacklinksApp } from "@/components/backlinks/BacklinksApp";
import { getAccount } from "@/lib/app-context";
import { usageToday } from "@/lib/account-data";
import { featureState } from "@/lib/features";
import { BACKLINK_ROWS } from "@/lib/limits";

export const metadata: Metadata = { title: "Backlinks" };
export const maxDuration = 60;

export default async function BacklinksPage() {
  const { user, tier, brand } = await getAccount();
  const feature = featureState("backlinks");
  if (!feature.live) return <ComingSoonPage feature={feature} title="Back" italic="links" />;
  const usage = (await usageToday(user.uid, tier).catch(() => [])).find((u) => u.tool === "backlinks");
  return (
    <>
      <Masthead
        title="Back"
        italic="links"
        lede="Who links to any site or page: authority, referring domains, anchors, and the links you gained or lost this year. Spammy links are hidden until you ask for them."
      />
      <Rise>
        <BacklinksApp defaultTarget={brand?.domain ?? ""} lookupsLeft={usage ? Math.max(0, usage.limit - usage.used) : 0} lookupsLimit={usage?.limit ?? 0} rowLimit={BACKLINK_ROWS[tier]} />
      </Rise>
    </>
  );
}
