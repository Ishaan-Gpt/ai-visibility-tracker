'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function ConsultantsSection() {
  return (
    <section className="py-24 bg-white px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-10">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider mb-6">
                <span>✨</span> OMNI SEO Search Engine
              </div>

              <h2
                className="text-4xl md:text-6xl font-medium leading-[1.08] tracking-tight text-neutral-900"
                style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
              >
                World-class search AI that empowers modern brands
                <span className="inline-block ml-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-100 transition shadow-sm"
                  >
                    <span>▷</span> How do we work
                  </button>
                </span>
              </h2>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  className="px-6 py-3 rounded-full bg-[#FFD209] text-black text-sm font-bold shadow-md hover:bg-[#e0b800] transition cursor-pointer"
                >
                  Start OMNI SEO
                </button>

                <button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                >
                  Request a call
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-black/5">
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed mb-6">
                OMNI SEO collaborates with search-first growth leaders to foster the success of high-intent organic visibility.
              </p>

              <div className="flex items-center gap-8 font-bold text-neutral-400 text-sm tracking-tight">
                <span>Headway</span>
                <span>brightline</span>
                <span>hazel</span>
                <span>G&amp;STC</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — 3 BENTO CARDS */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* TOP WIDE CARD (Spans 2 columns) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="sm:col-span-2 rounded-[32px] p-8 md:p-10 text-white flex flex-col justify-between min-h-[260px] relative overflow-hidden shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #C084FC 100%)',
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold leading-snug max-w-md text-white">
                If you're ready to dominate search &amp; AI visibility, let's get in touch.
              </h3>

              <div className="mt-8 flex items-center justify-between">
                <p className="text-xs text-white/80 max-w-xs leading-relaxed">
                  Our search team guarantees real-time citations across ChatGPT Search, Gemini &amp; Perplexity.
                </p>
                <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                  ↗
                </div>
              </div>
            </motion.div>

            {/* BOTTOM LEFT CARD */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-[28px] p-6 text-neutral-900 flex flex-col justify-between min-h-[220px] shadow-md border border-sky-100"
              style={{
                background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/80 text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                  Solutions
                </span>
                <div className="w-8 h-8 rounded-full bg-white text-sky-900 font-bold text-xs flex items-center justify-center shadow-sm">
                  ↗
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-sky-950 mt-4 leading-tight">
                  Unified AI &amp; SERP Engine
                </h4>
                <p className="text-xs text-sky-900/80 mt-2 leading-relaxed">
                  Empower your brand for real-time citations across LLM search summaries.
                </p>
              </div>
            </motion.div>

            {/* BOTTOM RIGHT CARD */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-[28px] p-6 text-neutral-900 flex flex-col justify-between min-h-[220px] shadow-md border border-lime-200"
              style={{
                background: 'linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%)',
              }}
            >
              <div>
                <span className="px-3 py-1 rounded-full bg-white/80 text-[11px] font-bold text-lime-900 uppercase tracking-wider">
                  Coverage
                </span>
                <div className="text-5xl font-extrabold text-lime-950 mt-4 tracking-tight">
                  99%
                </div>
              </div>

              <p className="text-xs text-lime-900/80 mt-2 leading-relaxed font-medium">
                Our AI engine detects schema completeness, sitemap health, and SERP visibility.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
