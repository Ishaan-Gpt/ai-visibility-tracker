'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function DeFiArchitectureSection() {
  const specs = [
    { title: 'Sub-second SERP Crawling', desc: 'Real-time search index tracking across global locations.' },
    { title: 'JSON-LD Graph Composer', desc: 'Compose rich, multi-type schemas without syntax errors.' },
    { title: 'XML & HTML Auto-Sync', desc: 'Automatically generate & update sitemaps as content grows.' },
    { title: 'Topical Density Analysis', desc: 'Identify keyword over-optimization before Google flags it.' },
  ]

  return (
    <section className="py-24 bg-[#FAF9F6] px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-white border border-black/10 text-black text-xs font-semibold uppercase tracking-wider">
            High-Performance Search Architecture
          </span>
          <h2
            className="text-4xl md:text-5xl font-medium leading-tight text-neutral-900 mt-4"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Under the hood of OMNI SEO
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Built on enterprise-grade infrastructure to deliver real-time search insights and zero-latency technical updates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specs.map((s) => (
            <motion.div
              key={s.title}
              whileHover={{ y: -4 }}
              className="p-7 rounded-[22px] bg-white border border-black/8 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFD209] text-black font-bold flex items-center justify-center mb-5 text-base">
                  ⚡
                </div>
                <h3 className="text-lg font-bold text-neutral-900">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
