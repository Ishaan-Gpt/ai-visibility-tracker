import Link from "next/link";
import { Logomark } from "@/components/tools/shared/icons/Logomark";

const TOOLS = [
  { name: "OpenGeo — AI Visibility Tracker", href: "/tools/opengeo" },
  { name: "Schema Markup Generator", href: "/tools/schema-generator" },
  { name: "Sitemap.xml Generator", href: "/tools/sitemap-xml-generator" },
  { name: "Sitemap.html Generator", href: "/tools/sitemap-html-generator" },
  { name: "Keyword Density Checker", href: "/tools/keyword-density-checker" },
];

export function ToolsFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Logomark className="h-6 w-6 text-primary" />
              <span className="font-display text-lg">OMNI SEO</span>
            </div>
            <p className="max-w-xs font-body text-sm text-foreground/60">
              A suite of free SEO tools built by the team behind OpenGeo — the AI visibility tracker for brands
              that want to show up when people ask ChatGPT and Gemini.
            </p>
          </div>

          <div>
            <p className="mb-3 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">Tools</p>
            <ul className="space-y-2">
              {TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className="font-body text-sm text-foreground/70 hover:text-foreground">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">OpenGeo</p>
            <ul className="space-y-2">
              <li>
                <Link href="/tools/opengeo" className="font-body text-sm text-foreground/70 hover:text-foreground">
                  Product
                </Link>
              </li>
              <li>
                <Link href="/tools/ai-visibility-tracker/signup" className="font-body text-sm text-foreground/70 hover:text-foreground">
                  Get started free
                </Link>
              </li>
              <li>
                <Link href="/tools/ai-visibility-tracker/login" className="font-body text-sm text-foreground/70 hover:text-foreground">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-foreground/10 pt-6 font-body text-xs text-foreground/40 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} OMNI SEO. All rights reserved.</p>
          <p>Built for the age of AI search.</p>
        </div>
      </div>
    </footer>
  );
}
