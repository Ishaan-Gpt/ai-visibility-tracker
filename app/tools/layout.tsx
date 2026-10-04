import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — OMNI SEO",
    default: "Free SEO Tools — OMNI SEO",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
