'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export function CraftExperiences() {
  const [activeTab, setActiveTab] = useState(0)

  const features = [
    {
      title: 'Real-Time SERP & AI Visibility',
      desc: 'Monitor whether Perplexity, Gemini, and ChatGPT Search mention your brand.',
      badge: 'Flagship Feature',
    },
    {
      title: 'Automated Schema Markup',
      desc: 'Generate Google-eligible JSON-LD structured data with live health scoring.',
      badge: 'Technical SEO',
    },
    {
      title: 'Prioritized Sitemap Engine',
      desc: 'Build XML and HTML sitemaps optimized for fast search engine indexation.',
      badge: 'Indexation',
    },
  ]

  return (
    <section className="py-24 bg-white px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
            Search Experience Studio
          </span>
          <h2
            className="text-4xl md:text-6xl font-medium leading-[1.08] tracking-tight text-neutral-900 mt-4"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Craft search experiences that convert
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            Everything your brand needs to capture high-intent search traffic across traditional Google SERPs and modern AI answer engines.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab(i)}
              className={`p-8 rounded-[24px] border transition-all cursor-pointer flex flex-col justify-between ${
                activeTab === i
                  ? 'bg-[#FAF9F6] border-black/20 shadow-lg ring-2 ring-black/5'
                  : 'bg-white border-black/8 hover:border-black/20'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-black bg-[#FFD209] px-3 py-1 rounded-full inline-block mb-6">
                  {f.badge}
                </span>
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-neutral-900">
                <span>Explore Capability</span>
                <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
