'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface StudioDashboardProps {
  domain: string
  onSelectTool: (toolId: string) => void
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

export function StudioDashboard({ domain, onSelectTool }: StudioDashboardProps) {
  const [projectDomain, setProjectDomain] = useState(domain || 'acme.com')
  const [isSaved, setIsSaved] = useState(true)

  function handleSaveDomain() {
    setIsSaved(true)
  }

  const omniTools = [
    {
      id: 'opengeo',
      name: 'AI Search Visibility Tracker',
      tagline: 'See whether Gemini, ChatGPT, and Perplexity mention your brand.',
      icon: SearchIcon,
      badge: 'Flagship Tool',
      bgGradient: 'from-amber-500/10 to-yellow-500/5',
    },
    {
      id: 'schema-generator',
      name: 'Schema Markup Generator',
      tagline: 'Google-eligible JSON-LD with live completeness scoring.',
      icon: CodeIcon,
      badge: 'Live',
      bgGradient: 'from-blue-500/10 to-sky-500/5',
    },
    {
      id: 'sitemap-xml-generator',
      name: 'Sitemap.xml Generator',
      tagline: 'Automated sitemap index generation and validation.',
      icon: MapIcon,
      badge: 'XML Engine',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
    },
    {
      id: 'sitemap-html-generator',
      name: 'Sitemap.html Generator',
      tagline: 'User-friendly HTML sitemaps structured for search bots.',
      icon: GlobeIcon,
      badge: 'HTML Builder',
      bgGradient: 'from-purple-500/10 to-indigo-500/5',
    },
    {
      id: 'keyword-density-checker',
      name: 'Keyword Density Checker',
      tagline: 'Analyze topical keyword weight and avoid penalty over-optimization.',
      icon: BarChartIcon,
      badge: 'Density Auditor',
      bgGradient: 'from-orange-500/10 to-amber-500/5',
    },
  ]

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto pb-16">
      {/* Top Banner Alert */}
      <div className="w-full rounded-[22px] bg-[#111114] text-white p-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-black/10">
        <div className="flex items-center gap-3 text-xs md:text-sm">
          <div className="w-7 h-7 rounded-full bg-[#FFD209] text-black font-bold text-xs flex items-center justify-center shrink-0">
            ⚡
          </div>
          <div>
            <span className="font-semibold text-white">Welcome to OMNI SEO Pro Suite</span>
            <span className="text-white/60 ml-2 hidden md:inline">
              — All 5 AI Search &amp; Visibility tools are fully active for your workspace.
            </span>
          </div>
        </div>
        <span className="text-xs bg-[#FFD209] text-black px-3.5 py-1 rounded-full font-bold font-mono shrink-0">
          Pro Suite Active
        </span>
      </div>

      {/* Card 1: ONBOARDING CHECKLIST */}
      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-7 md:p-8 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">
          <span>WORKSPACE DOMAIN CONFIGURATION</span>
          <span>1 / 4 ›</span>
        </div>

        <h3
          className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Target Domain: <span className="font-mono font-bold text-[#E86A00]">{projectDomain}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Set your project&apos;s domain and every tool in OMNI SEO syncs to it — AI search citations, schema graphs, sitemaps, and keyword density.
        </p>

        <div className="mt-5 flex items-center gap-3 max-w-md">
          <input
            type="text"
            value={projectDomain}
            onChange={(e) => {
              setProjectDomain(e.target.value)
              setIsSaved(false)
            }}
            placeholder="acme.com"
            className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50 text-sm font-mono text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
          />
          <button
            type="button"
            onClick={handleSaveDomain}
            className="px-6 py-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            {isSaved ? 'Saved ✓' : 'Save Domain'}
          </button>
        </div>
      </div>

      {/* Middle 2-Column Grid (Connect AI Agent vs Google Search Console) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 2: Connect your AI Agent */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-lg font-bold text-neutral-900 tracking-tight"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                Connect your AI agent
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Connected ✓
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              OMNI SEO is designed to give your AI search agent real-time SERP and schema intelligence to dominate page 1 search summaries.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">Protocol Active</span>
            <a
              href="#ai-mcp"
              className="text-xs font-bold text-neutral-900 hover:underline inline-flex items-center gap-1"
            >
              Configure MCP Agent <ArrowUpRightIcon />
            </a>
          </div>
        </div>

        {/* Card 3: Google Search Console */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-lg font-bold text-neutral-900 tracking-tight"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                Google Search Console
              </h3>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                ● Ready to Sync
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect GSC to see organic impressions, click-through rates, and exact SERP positions directly inside your OMNI SEO dashboard.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Connect with Google
            </button>
          </div>
        </div>
      </div>

      {/* 5 Purpose-Built Tools Grid */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-xl font-bold text-neutral-900 tracking-tight"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            All 5 OMNI SEO Tools
          </h3>
          <span className="text-xs font-mono text-muted-foreground">
            Direct Workspace Access
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {omniTools.map((tool) => {
            const IconComp = tool.icon
            return (
              <motion.div
                key={tool.id}
                whileHover={{ y: -4 }}
                onClick={() => onSelectTool(tool.id)}
                className="rounded-[24px] border border-neutral-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[220px] transition cursor-pointer hover:border-black/20 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-[#FFD209] flex items-center justify-center shadow-sm">
                      <IconComp />
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#FFD209]/20 text-black uppercase tracking-wider">
                      {tool.badge}
                    </span>
                  </div>

                  <h4
                    className="text-lg font-bold text-neutral-900 tracking-tight mb-1"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    {tool.name}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tool.tagline}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-900">
                  <span>Launch Tool Workspace</span>
                  <ArrowUpRightIcon />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
