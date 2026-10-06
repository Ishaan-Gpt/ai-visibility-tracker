import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Cards } from "@/components/landing/Cards";
import { Honest } from "@/components/landing/Honest";
import { Pricing } from "@/components/landing/Pricing";
import { Closing } from "@/components/landing/Closing";
import { ScoreClimb } from "@/components/landing/ScoreClimb";
import { RobotsPlayground } from "@/components/landing/RobotsPlayground";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name}: free SEO tools with an AI-search lens` },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${base}/#org`, name: BRAND.name, url: base, logo: `${base}/icon.svg` },
      { "@type": "WebSite", "@id": `${base}/#site`, name: BRAND.name, url: base, publisher: { "@id": `${base}/#org` }, description: BRAND.description },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <HowItWorks />
      <ScoreClimb />
      <Cards />
      <RobotsPlayground />
      <Honest />
      <Pricing />
      <Closing />
    </>
  );
}
