import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ds-canvas font-sans text-ds-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ds-ink focus:px-4 focus:py-2 focus:text-[#fffcf6]">
        Skip to content
      </a>
      <MarketingNav />
      <main id="main" className="flex-1 pt-[66px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
