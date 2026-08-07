'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function Testimonials() {
  return (
    <section className="py-24 bg-[#FAF9F6] px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1200px] mx-auto text-center">
        <span className="px-3.5 py-1 rounded-full bg-white border border-black/10 text-xs font-semibold uppercase tracking-wider text-black">
          Client Success
        </span>

        <blockquote
          className="text-3xl md:text-5xl font-medium leading-[1.15] tracking-tight text-neutral-900 mt-8 max-w-4xl mx-auto"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          "OMNI SEO replaced 5 separate subscriptions and increased our organic search traffic by{' '}
          <span className="text-[#E86A00] font-bold">340%</span> in less than 90 days."
        </blockquote>

        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFD209] text-black font-bold text-lg flex items-center justify-center">
            S
          </div>
          <div className="text-left">
            <h4 className="text-base font-bold text-neutral-900">Sarah Jenkins</h4>
            <p className="text-xs text-muted-foreground">VP of Growth, Nutanix Tech</p>
          </div>
        </div>
      </div>
    </section>
  )
}
