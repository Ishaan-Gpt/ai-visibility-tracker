'use client'

import React from 'react'
import { motion } from 'framer-motion'

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2z" />
    </svg>
  )
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
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

export function ConsultantsSection() {
  return (
    <section className="py-24 bg-white px-6 md:px-12 border-b border-ds-line">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-10">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-ds-accent-soft text-black text-xs font-semibold uppercase tracking-wider mb-6">
                <SparklesIcon className="text-[#E86A00]" /> OMNI SEO Search Engine
              </div>

              <h2
                className="text-4xl md:text-6xl font-medium leading-[1.08] tracking-tight text-ds-ink"
              >
                World-class search AI that empowers modern brands
                <span className="inline-block ml-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
                  >
                    <PlayIcon /> How do we work
                  </button>
                </span>
              </h2>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  className="px-6 py-3 rounded-full bg-ds-accent text-black text-sm font-bold hover:bg-[var(--ds-accent-hover)] transition cursor-pointer flex items-center gap-2"
                >
                  Start OMNI SEO <ArrowUpRightIcon />
                </button>

                <button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-ds-ink hover:bg-neutral-100 transition cursor-pointer"
                >
                  Request a call
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-ds-line">
              <p className="text-xs text-ds-ink-2 max-w-md leading-relaxed mb-6">
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
              className="sm:col-span-2 rounded-ds-lg p-8 md:p-10 text-white flex flex-col justify-between min-h-[260px] relative overflow-hidden"
              style={{
                background: '#161616',
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold leading-snug max-w-md text-white z-10">
                If you&apos;re ready to dominate search &amp; AI visibility, let&apos;s get in touch.
              </h3>

              <div className="mt-8 flex items-center justify-between z-10">
                <p className="text-xs text-white/80 max-w-xs leading-relaxed">
                  Our search team guarantees real-time citations across ChatGPT Search, Gemini &amp; Perplexity.
                </p>
                <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shrink-0">
                  <ArrowUpRightIcon />
                </div>
              </div>
            </motion.div>

            {/* BOTTOM LEFT CARD with AI Mesh Asset */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-ds-lg p-6 text-ds-ink flex flex-col justify-between min-h-[220px] border border-ds-line relative overflow-hidden"
              style={{
                background: '#FFFFFF',
              }}
            >
              <div className="flex items-center justify-between z-10">
                <span className="px-3 py-1 rounded-full bg-ds-muted text-[11px] font-medium text-ds-ink uppercase tracking-wider">
                  Solutions
                </span>
                <div className="w-8 h-8 rounded-full bg-ds-muted text-ds-ink font-bold text-xs flex items-center justify-center">
                  <ArrowUpRightIcon />
                </div>
              </div>

              {/* AI Glass Orb Render Background Overlay */}
              <div className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-80 pointer-events-none">
                <img src="/images/consultants_ai_mesh_1786133598735.png" alt="AI Orb" className="w-full h-full object-cover" />
              </div>

              <div className="z-10 mt-4">
                <h4 className="text-lg font-bold text-ds-ink leading-tight">
                  Unified AI &amp; SERP Engine
                </h4>
                <p className="text-xs text-ds-ink-2 mt-2 leading-relaxed max-w-[180px]">
                  Empower your brand for real-time citations across LLM search summaries.
                </p>
              </div>
            </motion.div>

            {/* BOTTOM RIGHT CARD */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-ds-lg p-6 text-ds-ink flex flex-col justify-between min-h-[220px] border border-ds-line"
              style={{
                background: '#FFF1E6',
              }}
            >
              <div>
                <span className="px-3 py-1 rounded-full bg-white text-[11px] font-medium text-ds-ink uppercase tracking-wider">
                  Coverage
                </span>
                <div className="text-5xl font-extrabold text-ds-accent mt-4 tracking-tight">
                  99%
                </div>
              </div>

              <p className="text-xs text-ds-ink-2 mt-2 leading-relaxed font-medium">
                Our AI engine detects schema completeness, sitemap health, and SERP visibility.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
