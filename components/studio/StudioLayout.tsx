'use client'

import React, { useState } from 'react'
import { Logomark } from '@/components/tools/shared/icons/Logomark'
import { StudioDashboard } from './StudioDashboard'

// Workspace tools imports (named exports):
import { SchemaWorkspace } from '@/components/tools/schema-generator/workspace/SchemaWorkspace'
import { SitemapWorkspace } from '@/components/tools/sitemap-xml-generator/workspace/SitemapWorkspace'
import { HtmlSitemapWorkspace } from '@/components/tools/sitemap-html-generator/workspace/HtmlSitemapWorkspace'
import { KeywordDensityWorkspace } from '@/components/tools/keyword-density-checker/workspace/KeywordDensityWorkspace'

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
      icon: '🤖',
      badge: 'AI Agent',
    },
    {
      id: 'schema-generator',
      name: 'Schema Generator',
      icon: '🏷️',
      badge: 'JSON-LD',
    },
    {
      id: 'sitemap-xml-generator',
      name: 'Sitemap.xml Generator',
      icon: '🗺️',
      badge: 'XML',
    },
    {
      id: 'sitemap-html-generator',
      name: 'Sitemap.html Generator',
      icon: '🌐',
      badge: 'HTML',
    },
    {
      id: 'keyword-density-checker',
      name: 'Keyword Density',
      icon: '📊',
      badge: 'Density',
    },
  ]

  return (
    <div className="flex h-screen w-full bg-[#FAF9F6] text-neutral-900 overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 shrink-0 border-r border-neutral-200 bg-white flex flex-col justify-between p-4 z-20">
        <div>
          {/* Top Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
            <Logomark className="w-8 h-8 text-[#E86A00]" />
            <span
              className="text-xl font-bold text-neutral-900 tracking-tight"
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
            >
              OMNI SEO
            </span>
          </div>

          {/* Project Workspace Selector Dropdown */}
          <div className="mb-6 px-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Workspace Project
            </label>
            <div className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs font-semibold text-neutral-800">
              <span className="truncate font-mono">{projectDomain}</span>
              <span className="text-muted-foreground">↕</span>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <div className="space-y-6">
            {/* Dashboard Link */}
            <div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'dashboard'
                    ? 'bg-[#FFD209] text-black font-semibold shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <span className="text-base">📊</span>
                Dashboard
              </button>
            </div>

            {/* TOOLS Category Section */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                TOOLS
              </div>
              <div className="space-y-1">
                {omniTools.map((tool) => {
                  const isActive = activeTab === tool.id
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTab(tool.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-neutral-900 text-white font-semibold shadow-sm'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-sm">{tool.icon}</span>
                        <span className="truncate">{tool.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
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
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FFD209] text-black font-bold text-xs flex items-center justify-center shrink-0">
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
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition text-xs"
            >
              🚪
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
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
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
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition shadow-sm"
            >
              View Dashboard
            </button>

            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition shadow-sm"
            >
              Landing Page ↗
            </a>
          </div>
        </div>

        {/* TAB WORKSPACE ROUTER */}
        {activeTab === 'dashboard' && (
          <StudioDashboard
            domain={projectDomain}
            onSelectTool={(toolId) => setActiveTab(toolId)}
          />
        )}

        {activeTab === 'opengeo' && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  AI Search Visibility Tracker (OpenGeo)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Track mentions across Gemini, ChatGPT Search, and Perplexity in real-time.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span>Target Query Audit</span>
                <span className="text-emerald-600">Active Monitoring</span>
              </div>
              <input
                type="text"
                defaultValue={`best AI visibility tools for ${projectDomain}`}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm outline-none font-mono"
              />
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-[#FFD209] text-black font-semibold text-xs hover:bg-[#e0b800] transition"
              >
                Run AI Visibility Audit 🚀
              </button>
            </div>
          </div>
        )}

        {activeTab === 'schema-generator' && (
          <SchemaWorkspace
            initialTypes={['organization']}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'sitemap-xml-generator' && (
          <SitemapWorkspace
            initialEntries={[
              { loc: `https://${projectDomain}/`, lastmod: '2026-08-07', changefreq: 'daily', priority: '1.0' },
              { loc: `https://${projectDomain}/about`, lastmod: '2026-08-07', changefreq: 'monthly', priority: '0.8' },
            ]}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'sitemap-html-generator' && (
          <HtmlSitemapWorkspace
            initialEntries={[
              { label: 'Home Page', url: `https://${projectDomain}/`, section: 'Main' },
              { label: 'Pricing & Plans', url: `https://${projectDomain}/pricing`, section: 'Main' },
            ]}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'keyword-density-checker' && (
          <KeywordDensityWorkspace
            initialContent={`OMNI SEO is the all-in-one AI search visibility and SEO optimization suite for modern brands.`}
            initialKeywordsRaw="OMNI SEO, AI search, visibility"
            onBack={() => setActiveTab('dashboard')}
          />
        )}
      </main>
    </div>
  )
}
