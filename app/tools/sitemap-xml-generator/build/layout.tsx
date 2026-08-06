import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Sitemap",
  robots: { index: false, follow: true },
};

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
