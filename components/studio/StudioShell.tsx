"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  ArrowRight,
  Code2,
  FileCode2,
  Gauge,
  LayoutGrid,
  LogOut,
  Menu,
  Network,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Logomark } from "@/components/tools/shared/icons/Logomark";
import { Card, Pill } from "@/components/ds/primitives";
import { SchemaWorkspace } from "@/components/tools/schema-generator/workspace/SchemaWorkspace";
import { SitemapWorkspace } from "@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace";
import { HtmlSitemapWorkspace } from "@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace";
import { KeywordResearchWorkspace } from "@/components/tools/keyword-research/KeywordResearchWorkspace";
import { KeywordDensityWorkspace } from "@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace";

type ToolId =
  | "opengeo"
  | "schema-generator"
  | "sitemap-xml-generator"
  | "sitemap-html-generator"
  | "keyword-density-checker"
  | "keyword-research";
type Tab = "overview" | ToolId;

type Tool = { id: ToolId; name: string; description: string; icon: LucideIcon };

const TOOLS: Tool[] = [
  { id: "keyword-research", name: "Keyword Research", description: "Discover keywords, topics and intent for any seed.", icon: Search },
  { id: "opengeo", name: "AI Visibility", description: "Track whether AI answers mention your brand.", icon: Sparkles },
  { id: "schema-generator", name: "Schema Generator", description: "Google-eligible JSON-LD with live scoring.", icon: Code2 },
  { id: "sitemap-xml-generator", name: "Sitemap.xml", description: "Spec-conformant sitemaps for crawlers.", icon: Network },
  { id: "sitemap-html-generator", name: "Sitemap.html", description: "A readable sitemap page for visitors.", icon: FileCode2 },
  { id: "keyword-density-checker", name: "Keyword Density", description: "Spot over-optimization and topical gaps.", icon: Gauge },
];

interface StudioShellProps {
  userEmail: string;
  brandName: string;
  brandDomain: string;
  planLabel: string;
  initialTab?: string;
  overviewContent: ReactNode;
  trackerContent: ReactNode;
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  soon,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  soon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={soon}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-9 w-full items-center gap-3 rounded-ds-sm px-3 text-[14px] transition-colors duration-150 ${
        active ? "bg-ds-muted font-medium text-ds-ink" : "text-ds-ink-2 hover:bg-ds-muted hover:text-ds-ink"
      } ${soon ? "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-ds-ink-2" : ""}`}
    >
      {active && <span className="absolute left-0 top-2 h-5 w-0.5 rounded-full bg-ds-accent" />}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span className="truncate">{label}</span>
      {soon && <span className="ml-auto rounded-full bg-ds-muted px-2 py-0.5 text-[11px] text-ds-ink-2">Soon</span>}
    </button>
  );
}

export function StudioShell({
  userEmail,
  brandName,
  brandDomain,
  planLabel,
  initialTab,
  overviewContent,
  trackerContent,
}: StudioShellProps) {
  const router = useRouter();
  const startTab: Tab = TOOLS.some((t) => t.id === initialTab) ? (initialTab as ToolId) : "overview";
  const [activeTab, setActiveTab] = useState<Tab>(startTab);
  const [navOpen, setNavOpen] = useState(false);

  function go(tab: Tab) {
    setActiveTab(tab);
    setNavOpen(false);
    const url = tab === "overview" ? window.location.pathname : `${window.location.pathname}?tool=${tab}`;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/session", { method: "DELETE" });
    router.push("/tools/ai-visibility-tracker/login");
    router.refresh();
  }

  const activeTool = TOOLS.find((t) => t.id === activeTab);
  const title = activeTab === "overview" ? "Overview" : (activeTool?.name ?? "Workspace");
  const subtitle =
    activeTab === "overview" ? `Everything for ${brandName} in one place.` : (activeTool?.description ?? "");
  const back = () => go("overview");

  const sidebar = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex h-16 items-center gap-2 px-5">
          <Logomark className="h-6 w-6 text-ds-accent" />
          <span className="text-[18px] font-medium tracking-[-0.02em] text-ds-ink">OMNI SEO</span>
        </div>

        <div className="px-3">
          <div className="mb-6 rounded-ds-sm border border-ds-line bg-ds-canvas px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-ds-ink-3">Project</div>
            <div className="truncate font-mono text-[13px] text-ds-ink">{brandDomain}</div>
          </div>

          <NavItem icon={LayoutGrid} label="Overview" active={activeTab === "overview"} onClick={() => go("overview")} />

          <div className="mb-2 mt-6 px-3 text-[11px] font-medium uppercase tracking-wider text-ds-ink-3">Tools</div>
          <div className="space-y-0.5">
            {TOOLS.map((t) => (
              <NavItem key={t.id} icon={t.icon} label={t.name} active={activeTab === t.id} onClick={() => go(t.id)} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-ds-line p-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ds-muted text-[13px] font-medium text-ds-ink">
            {userEmail ? userEmail[0].toUpperCase() : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-ds-ink">{userEmail}</p>
            <p className="text-[12px] text-ds-ink-2">{planLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="rounded-ds-sm p-2 text-ds-ink-2 transition-colors hover:bg-ds-muted hover:text-ds-ink"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="studio-scope flex min-h-screen w-full bg-ds-canvas font-sans text-ds-ink">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-ds-line bg-ds-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-ds-line bg-ds-surface">{sidebar}</aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b border-ds-line bg-ds-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Open menu"
            className="rounded-ds-sm p-2 hover:bg-ds-muted"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-[16px] font-medium">{title}</span>
          <span className="w-9" />
        </div>

        <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 lg:py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-normal leading-9 tracking-[-0.02em] text-ds-ink">{title}</h1>
              <p className="mt-1 text-[16px] text-ds-ink-2">{subtitle}</p>
            </div>
            <Pill className="font-mono text-[13px]">{brandDomain}</Pill>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              {overviewContent}
              <section>
                <h2 className="mb-3 text-[18px] font-medium text-ds-ink">Your tools</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {TOOLS.map((t) => (
                    <button key={t.id} type="button" onClick={() => go(t.id)} className="group text-left">
                      <Card className="flex h-full items-start gap-4 p-5 transition-colors group-hover:bg-ds-canvas">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md bg-ds-muted">
                          <t.icon className="h-5 w-5 text-ds-ink" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[16px] font-medium text-ds-ink">{t.name}</span>
                          <span className="mt-0.5 block text-[14px] leading-5 text-ds-ink-2">{t.description}</span>
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ds-ink-3 transition-colors group-hover:text-ds-ink" />
                      </Card>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "opengeo" && trackerContent}

          {activeTab === "keyword-research" && <KeywordResearchWorkspace />}

          {activeTab === "schema-generator" && (
            <Card className="p-4 sm:p-6">
              <SchemaWorkspace
                initialTypes={["organization"]}
                brand={{ name: brandName, domain: brandDomain }}
                onBack={back}
              />
            </Card>
          )}

          {activeTab === "sitemap-xml-generator" && (
            <Card className="p-4 sm:p-6">
              <SitemapWorkspace
                initialEntries={[
                  { loc: `https://${brandDomain}/`, lastmod: "", changefreq: "weekly", priority: "1.0" },
                  { loc: `https://${brandDomain}/about`, lastmod: "", changefreq: "monthly", priority: "0.8" },
                ]}
                onBack={back}
              />
            </Card>
          )}

          {activeTab === "sitemap-html-generator" && (
            <Card className="p-4 sm:p-6">
              <HtmlSitemapWorkspace
                initialEntries={[
                  { url: `https://${brandDomain}/`, label: "Home", section: "Main" },
                  { url: `https://${brandDomain}/pricing`, label: "Pricing & Plans", section: "Main" },
                ]}
                onBack={back}
              />
            </Card>
          )}

          {activeTab === "keyword-density-checker" && (
            <Card className="p-4 sm:p-6">
              <KeywordDensityWorkspace
                initialContent={`${brandName} is tracked by OMNI SEO — the all-in-one AI search visibility and SEO optimization suite for modern brands.`}
                initialKeywordsRaw={`${brandName}, AI search, visibility`}
                onBack={back}
              />
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
