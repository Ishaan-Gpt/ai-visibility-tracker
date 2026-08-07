'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function ConsultantsSection() {
  return (
    <section className="py-24 bg-white px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
            AI Answer Engines &amp; SERP Intelligence
          </span>
          <h2
            className="text-4xl md:text-6xl font-medium leading-[1.08] tracking-tight text-neutral-900 mt-4"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            World-class search AI working for your brand
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            Get 24/7 automated monitoring across Google AI Overviews, ChatGPT Search, Gemini, and Perplexity.
          </p>
        </div>

        {/* 3-Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 rounded-[28px] bg-[#1E1D19] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-xl">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                Real-Time AI Visibility Engine
              </span>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white mt-6">
                Never lose your rank in AI search summaries.
              </h3>
              <p className="text-base text-white/70 mt-4 max-w-xl leading-relaxed">
                When users ask ChatGPT or Gemini for product recommendations, OMNI SEO ensures your brand is cited as the top authoritative source.
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
              <span>Automatic Brand Citations</span>
              <span className="text-[#FFD209] font-bold">100% Monitored ↗</span>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-[28px] bg-[#FAF9F6] border border-black/8 p-8 flex flex-col justify-between shadow-sm">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-[#FFD209] text-black text-xs font-semibold uppercase tracking-wider">
                Instant Audits
              </span>
              <h3 className="text-2xl font-bold text-neutral-900 mt-6">
                Automated Technical Audits
              </h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Check schema validation, missing meta tags, and sitemap priorities with 1 click.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-neutral-900">
              <span>Run Live Audit</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
