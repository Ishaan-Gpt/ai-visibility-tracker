import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { BRAND } from "@/lib/brand";
import { Intro } from "@/components/motion/Intro";
import { PageTransition } from "@/components/motion/PageTransition";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    template: `%s · ${BRAND.name}`,
    default: `${BRAND.name}: free SEO tools with an AI-search lens`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: { siteName: BRAND.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#f2efe5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Decide before first paint whether the intro plays (once per session, never for reduced motion). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('sw-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='done'}catch(e){}",
          }}
        />
        <Intro />
        <PageTransition />
        {children}
      </body>
    </html>
  );
}
