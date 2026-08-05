import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — OpenSeo",
    default: "Free SEO Tools — OpenSeo",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
