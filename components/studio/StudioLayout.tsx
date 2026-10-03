'use client'

import React, { useState } from 'react'
import { Logomark } from '@/components/tools/shared/icons/Logomark'
import { StudioDashboard } from './StudioDashboard'

// Workspace tools imports (named exports):
import { SchemaWorkspace } from '@/components/tools/schema-generator/workspace/SchemaWorkspace'
import { SitemapWorkspace } from '@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace'
import { HtmlSitemapWorkspace } from '@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace'
import { KeywordDensityWorkspace } from '@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace'

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function SelectorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="7 15 12 20 17 15" />
      <polyline points="7 9 12 4 17 9" />
    </svg>
  )
}

interface StudioLayoutProps {
  userEmail: string
  initialDomain?: string
  onLogout: () => void
}

export function StudioLayout({
  userEmail,
  initialDomain = 'acme.com',
  onLogout,
}: StudioLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [projectDomain, setProjectDomain] = useState<string>(initialDomain)

  const omniTools = [
    {
      id: 'opengeo',
      name: 'AI Search Visibility',
      icon: SearchIcon,
      badge: 'AI Agent',
    },
    {
      id: 'schema-generator',
      name: 'Schema Generator',
      icon: CodeIcon,
      badge: 'JSON-LD',
    },
    {
      id: 'sitemap-xml-generator',
      name: 'Sitemap.xml Generator',
      icon: MapIcon,
      badge: 'XML',
    },
    {
      id: 'sitemap-html-generator',
      name: 'Sitemap.html Generator',
      icon: GlobeIcon,
      badge: 'HTML',
    },
    {
      id: 'keyword-density-checker',
      name: 'Keyword Density',
      icon: BarChartIcon,
      badge: 'Density',
    },
  ]

  return (
    <div className="flex h-screen w-full bg-[#FAF9F6] text-neutral-900 overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 shrink-0 border-r border-neutral-200/80 bg-white flex flex-col justify-between p-4 z-20 shadow-sm">
        <div>
          {/* Top Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
            <Logomark className="w-8 h-8 text-[#E86A00]" />
            <span
              className="text-xl font-bold text-neutral-900 tracking-tight"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              OMNI SEO
            </span>
          </div>

          {/* Project Workspace Selector Dropdown */}
          <div className="mb-6 px-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-mono">
              Workspace Project
            </label>
            <div className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs font-semibold text-neutral-800 shadow-sm">
              <span className="truncate font-mono">{projectDomain}</span>
              <SelectorIcon className="text-neutral-400 shrink-0" />
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <div className="space-y-6">
            {/* Dashboard Link */}
            <div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#FFD209] text-black shadow-sm font-bold'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <DashboardIcon />
                Dashboard
              </button>
            </div>

            {/* TOOLS Category Section */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                TOOLS
              </div>
              <div className="space-y-1">
                {omniTools.map((tool) => {
                  const isActive = activeTab === tool.id
                  const IconComp = tool.icon
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTab(tool.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm font-bold'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComp className={isActive ? 'text-[#FFD209]' : 'text-neutral-400'} />
                        <span className="truncate">{tool.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {tool.badge}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* MOST BOTTOM: USER PROFILE SECTION */}
        <div className="pt-4 border-t border-neutral-200/80">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FFD209] text-black font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {userEmail ? userEmail[0].toUpperCase() : 'I'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 truncate">
                  {userEmail || 'ishaangupta011205@gmail.com'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">
                  Pro Plan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Log out"
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF9F6]">
        {/* Header Bar inside Studio */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200/80">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              {activeTab === 'dashboard'
                ? 'OMNI SEO Studio'
                : omniTools.find((t) => t.id === activeTab)?.name || 'Workspace'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active Project: <span className="font-mono font-semibold text-neutral-800">{projectDomain}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition shadow-sm cursor-pointer"
            >
              View Dashboard
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-[#FFD209] text-black text-xs font-bold shadow-sm hover:bg-[#e0b800] transition cursor-pointer"
            >
              Landing Page ↗
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTENT ROUTER */}
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <StudioDashboard domain={projectDomain} onSelectTool={(id) => setActiveTab(id)} />
          )}

          {activeTab === 'opengeo' && (
            <div className="bg-white p-6 md:p-8 rounded-[28px] border border-neutral-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <h2
                    className="text-xl font-bold text-neutral-900 tracking-tight"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    AI Search Visibility Tracker
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track whether Gemini, ChatGPT, and Perplexity mention your brand in search summaries.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FFD209] text-black font-bold text-xs">
                  OpenGeo Engine Active
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-neutral-200 space-y-4">
                <label className="block text-xs font-semibold text-neutral-800">
                  Target Domain &amp; Keywords Audit
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    defaultValue={projectDomain}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono text-neutral-900 outline-none focus:border-black transition"
                  />
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold shadow-md hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Run AI Simulation
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">ChatGPT Visibility</span>
                  <div className="text-2xl font-bold text-neutral-900 mt-1">88% Cited</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">Gemini AI Overviews</span>
                  <div className="text-2xl font-bold text-neutral-900 mt-1">94% Ranked</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">Perplexity Citations</span>
                  <div className="text-2xl font-bold text-neutral-900 mt-1">Top 3 Sources</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema-generator' && (
            <div className="bg-white p-6 md:p-8 rounded-[28px] border border-neutral-200/80 shadow-sm">
              <SchemaWorkspace />
            </div>
          )}

          {activeTab === 'sitemap-xml-generator' && (
            <div className="bg-white p-6 md:p-8 rounded-[28px] border border-neutral-200/80 shadow-sm">
              <SitemapWorkspace />
            </div>
          )}

          {activeTab === 'sitemap-html-generator' && (
            <div className="bg-white p-6 md:p-8 rounded-[28px] border border-neutral-200/80 shadow-sm">
              <HtmlSitemapWorkspace />
            </div>
          )}

          {activeTab === 'keyword-density-checker' && (
            <div className="bg-white p-6 md:p-8 rounded-[28px] border border-neutral-200/80 shadow-sm">
              <KeywordDensityWorkspace />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
