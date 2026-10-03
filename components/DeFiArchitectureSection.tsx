'use client'

import React from 'react'
import { motion } from 'framer-motion'

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

export function DeFiArchitectureSection() {
  return (
    <section className="py-24 bg-[#FAF9F6] px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1360px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-tight text-neutral-900"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Architected for high-performance Search &amp; AI Visibility
            </h2>
            <p className="text-base text-muted-foreground mt-2 font-mono">
              Real-Time SERP Intelligence. Access the Future of Organic Search.
            </p>
          </div>

          <button
            type="button"
            className="self-start md:self-auto px-6 py-2.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-neutral-900 hover:bg-neutral-100 transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            Start Auditing <ArrowUpRightIcon />
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT TALL CARD (Card 1 - Spans 5 columns on desktop) with AI Tech Nodes Asset */}
          <motion.div
            whileHover={{ y: -4 }}
            className="lg:col-span-5 rounded-[32px] bg-white border border-black/8 p-8 md:p-10 shadow-sm flex flex-col justify-between min-h-[440px] relative overflow-hidden"
          >
            <div className="z-10">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider mb-8">
                <span>01</span>
                <span>SEARCH ENGINE ARCHITECTURE</span>
              </div>

              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight leading-snug">
                Unlock the visibility of your indexed assets
              </h3>
            </div>

            {/* AI Tech Architecture Nodes Graphic */}
            <div className="my-4 h-36 rounded-2xl overflow-hidden bg-neutral-50 border border-black/5">
              <img
                src="/images/architecture_tech_concept_1786133613467.png"
                alt="Architecture Tech Concept"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed z-10">
              Crawl, score, and rank items without indexation delays. Experience zero-latency SERP updates with immediate access to insights.
            </p>
          </motion.div>

          {/* RIGHT COLUMN (Spans 7 columns on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* TOP WIDE CARD (Card 2) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-[32px] bg-white border border-black/8 p-8 md:p-10 shadow-sm flex flex-col justify-between min-h-[200px]"
            >
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                <span className="font-bold text-neutral-900">REAL-TIME SERP ANALYTICS</span>
                <span>02</span>
              </div>

              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Real-time SERP Rewards
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-xl">
                Track your organic keyword rewards minute by minute with our high-res SERP indexer. Keep your finger on the pulse of your portfolio&apos;s performance.
              </p>
            </motion.div>

            {/* BOTTOM 2-COLUMN SPLIT (Card 3 & Card 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* CARD 3: BANK-GRADE SCHEMA */}
              <motion.div
                whileHover={{ y: -4 }}
                className="rounded-[32px] bg-white border border-black/8 p-8 shadow-sm flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                    <span>BANK-GRADE SCHEMA</span>
                    <span>03</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    JSON-LD structured data audited by Google Search Central standards, protected by automated linting.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-neutral-900">
                  <span>View Audits</span>
                  <LockIcon />
                </div>
              </motion.div>

              {/* CARD 4: CROSS-ENGINE */}
              <motion.div
                whileHover={{ y: -4 }}
                className="rounded-[32px] bg-white border border-black/8 p-8 shadow-sm flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                    <span>CROSS-ENGINE</span>
                    <span>04</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Wrap your brand citation across page 1 search summaries seamlessly. Dominate SERPs where opportunity arises.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-900">
                    <ArrowUpRightIcon />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
