'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function DeFiArchitectureSection() {
  return (
    <section className="py-24 bg-[#FAF9F6] px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1360px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-tight text-neutral-900"
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
            >
              Architected for high-performance Search &amp; AI Visibility
            </h2>
            <p className="text-base text-muted-foreground mt-2 font-mono">
              Real-Time SERP Intelligence. Access the Future of Organic Search.
            </p>
          </div>

          <button
            type="button"
            className="self-start md:self-auto px-6 py-2.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-neutral-900 hover:bg-neutral-100 transition shadow-sm cursor-pointer"
          >
            Start Auditing ↗
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT TALL CARD (Card 1 - Spans 5 columns on desktop) */}
          <motion.div
            whileHover={{ y: -4 }}
            className="lg:col-span-5 rounded-[32px] bg-white border border-black/8 p-8 md:p-10 shadow-sm flex flex-col justify-between min-h-[440px]"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider mb-8">
                <span>01</span>
                <span>SEARCH ENGINE ARCHITECTURE</span>
              </div>

              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight leading-snug">
                Unlock the visibility of your indexed assets
              </h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mt-8">
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
                Track your organic keyword rewards minute by minute with our high-res SERP indexer. Keep your finger on the pulse of your portfolio's performance.
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
                  <span>🔒</span>
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
                    ↗
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
