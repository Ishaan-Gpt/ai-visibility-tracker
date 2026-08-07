"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { SchemaWorkspace } from "@/components/tools/schema-generator/workspace/SchemaWorkspace";
import { SitemapWorkspace } from "@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace";
import { HtmlSitemapWorkspace } from "@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace";
import { KeywordDensityWorkspace } from "@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace";

const TOOLS = [
  { id: "opengeo", name: "AI Search Visibility", icon: "🤖", badge: "AI Agent" },
  { id: "schema-generator", name: "Schema Generator", icon: "🏷️", badge: "JSON-LD" },
  { id: "sitemap-xml-generator", name: "Sitemap.xml Generator", icon: "🗺️", badge: "XML" },
  { id: "sitemap-html-generator", name: "Sitemap.html Generator", icon: "🌐", badge: "HTML" },
  { id: "keyword-density-checker", name: "Keyword Density", icon: "📊", badge: "Density" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];
type Tab = "dashboard" | ToolId;

interface StudioShellProps {
  userEmail: string;
  brandName: string;
  brandDomain: string;
  initialTab?: string;
  dashboardContent: ReactNode;
}

export function StudioShell({ userEmail, brandName, brandDomain, initialTab, dashboardContent }: StudioShellProps) {
  const router = useRouter();
  const validTab: Tab = TOOLS.some((t) => t.id === initialTab) ? (initialTab as Tab) : "dashboard";
  const [activeTab, setActiveTab] = useState<Tab>(validTab);

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/session", { method: "DELETE" });
    router.push("/tools/ai-visibility-tracker/login");
    router.refresh();
  }

  const activeToolMeta = TOOLS.find((t) => t.id === activeTab);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAF9F6] font-sans text-neutral-900">
      {/* LEFT SIDEBAR */}
      <aside className="z-20 flex w-72 shrink-0 flex-col justify-between border-r border-neutral-200 bg-white p-4">
        <div>
          <div className="mb-4 flex items-center gap-2.5 px-2 py-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFD209] text-sm font-bold text-black"
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
            >
              O
            </div>
            <span
              className="text-xl font-bold tracking-tight text-neutral-900"
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
            >
              OMNI SEO
            </span>
          </div>

          <div className="mb-6 px-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace Project
            </label>
            <div className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-800">
              <span className="truncate font-mono">{brandDomain}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === "dashboard"
                    ? "bg-[#FFD209] font-semibold text-black shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <span className="text-base">📊</span>
                Dashboard
              </button>
            </div>

            <div>
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                TOOLS
              </div>
              <div className="space-y-1">
                {TOOLS.map((tool) => {
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTab(tool.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? "bg-neutral-900 font-semibold text-white shadow-sm"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-sm">{tool.icon}</span>
                        <span className="truncate">{tool.name}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                          isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {tool.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE */}
        <div className="border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFD209] text-xs font-bold text-black">
                {userEmail ? userEmail[0].toUpperCase() : "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-neutral-900">{userEmail}</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Free Plan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="rounded-lg p-1.5 text-xs text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-[#FAF9F6] p-6 md:p-8">
        <div className="mx-auto mb-8 flex max-w-[1280px] items-center justify-between border-b border-neutral-200/80 pb-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl"
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
            >
              {activeTab === "dashboard" ? "OMNI SEO Studio" : activeToolMeta?.name ?? "Workspace"}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {brandName} · <span className="font-mono font-semibold text-neutral-800">{brandDomain}</span>
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] pb-16">
          {activeTab === "dashboard" && dashboardContent}

          {activeTab === "opengeo" && dashboardContent}

          {activeTab === "schema-generator" && (
            <SchemaWorkspace initialTypes={["organization"]} onBack={() => setActiveTab("dashboard")} />
          )}

          {activeTab === "sitemap-xml-generator" && (
            <SitemapWorkspace
              initialEntries={[
                { loc: `https://${brandDomain}/`, lastmod: "", changefreq: "weekly", priority: "1.0" },
                { loc: `https://${brandDomain}/about`, lastmod: "", changefreq: "monthly", priority: "0.8" },
              ]}
              onBack={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "sitemap-html-generator" && (
            <HtmlSitemapWorkspace
              initialEntries={[
                { url: `https://${brandDomain}/`, label: "Home", section: "Main" },
                { url: `https://${brandDomain}/pricing`, label: "Pricing & Plans", section: "Main" },
              ]}
              onBack={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "keyword-density-checker" && (
            <KeywordDensityWorkspace
              initialContent={`${brandName} is tracked by OMNI SEO — the all-in-one AI search visibility and SEO optimization suite for modern brands.`}
              initialKeywordsRaw={`${brandName}, AI search, visibility`}
              onBack={() => setActiveTab("dashboard")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
