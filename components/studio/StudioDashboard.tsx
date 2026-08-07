'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface StudioDashboardProps {
  domain: string
  onSelectTool: (toolId: string) => void
}

export function StudioDashboard({ domain, onSelectTool }: StudioDashboardProps) {
  const [projectDomain, setProjectDomain] = useState(domain || 'acme.com')
  const [isSaved, setIsSaved] = useState(true)

  function handleSaveDomain() {
    setIsSaved(true)
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto pb-16">
      {/* Top Banner Alert */}
      <div className="w-full rounded-2xl bg-[#0F172A] text-white p-4 px-6 flex items-center justify-between text-sm shadow-sm">
        <div className="flex items-center gap-2">
          <span>We hope you're enjoying OMNI SEO!</span>
          <a href="#upgrade" className="underline text-blue-300 hover:text-white font-medium">
            Upgrade anytime
          </a>
          <span className="text-white/60">or</span>
          <a href="#support" className="underline text-blue-300 hover:text-white font-medium">
            reach out with questions
          </a>
          .
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/80 font-mono">
          Pro Suite Active
        </span>
      </div>

      {/* Card 1: ONBOARDING CHECKLIST */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
          <span>ONBOARDING CHECKLIST</span>
          <span>1 / 4 ›</span>
        </div>

        <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
          What site are you working on?
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Set your project's domain and every card on this page starts working for it — backlinks, schema validation, sitemaps, and search audits.
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-sm font-mono text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
          />
          <button
            type="button"
            onClick={handleSaveDomain}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition shadow-sm"
          >
            {isSaved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* Middle 2-Column Grid (Connect AI Agent vs Google Search Console) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 2: Connect your AI Agent */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                Connect your AI agent
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Already connected
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              OMNI SEO is designed to give your AI agent the data it needs to build a great SEO strategy and help you execute it. This way you aren't limited on "AI credits".
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              You can work with your agent to figure out what automations make sense for you and it can help you write content too.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <a
              href="#ai-mcp"
              className="text-xs font-semibold text-neutral-900 hover:underline inline-flex items-center gap-1"
            >
              Set up in AI &amp; MCP →
            </a>
          </div>
        </div>

        {/* Card 3: Google Search Console */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                Google Search Console
              </h3>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                ● Not connected
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect GSC to see how your website is actually performing in Google Search, track impressions, click-through rates, and organic keyword positions.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition shadow-sm flex items-center gap-2"
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

      {/* Card 4: Site Audit */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
          Site audit for {projectDomain}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Crawl your site for broken links, missing tags, schema completeness, and indexability problems.
        </p>

        <div className="mt-5">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition shadow-sm"
          >
            Run an audit
          </button>
        </div>
      </div>

      {/* 5 Purpose-Built Tools Grid */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
            All 5 OMNI SEO Tools
          </h3>
          <span className="text-xs text-muted-foreground">
            Direct access workspace tools
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              id: 'opengeo',
              name: 'AI Search Visibility Tracker',
              tagline: 'See whether Gemini, ChatGPT, and Perplexity mention your brand.',
              icon: '🤖',
              badge: 'Flagship Tool',
            },
            {
              id: 'schema-generator',
              name: 'Schema Markup Generator',
              tagline: 'Google-eligible JSON-LD with live completeness scoring.',
              icon: '🏷️',
              badge: 'Live',
            },
            {
              id: 'sitemap-xml-generator',
              name: 'Sitemap.xml Generator',
              tagline: 'Clean, prioritized sitemap.xml files ready for Search Console.',
              icon: '🗺️',
              badge: 'Live',
            },
            {
              id: 'sitemap-html-generator',
              name: 'Sitemap.html Generator',
              tagline: 'Readable HTML sitemap page for human navigation.',
              icon: '🌐',
              badge: 'Live',
            },
            {
              id: 'keyword-density-checker',
              name: 'Keyword Density Checker',
              tagline: 'Spot over-optimization and topical gaps before Google does.',
              icon: '📊',
              badge: 'Live',
            },
          ].map((tool) => (
            <motion.div
              key={tool.id}
              whileHover={{ y: -3 }}
              onClick={() => onSelectTool(tool.id)}
              className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-black/20 transition cursor-pointer flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-[11px] font-semibold bg-[#FFD209]/20 text-neutral-900 px-2.5 py-0.5 rounded-full">
                    {tool.badge}
                  </span>
                </div>

                <h4 className="text-base font-semibold text-neutral-900">
                  {tool.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {tool.tagline}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-black">
                <span>Open Tool</span>
                <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
