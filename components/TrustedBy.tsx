'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function TrustedBy() {
  const brands = [
    'Intel',
    'Oracle',
    'GoFundMe',
    'Nutanix',
    'Upside',
    'Microsoft',
    'Vercel',
    'Stripe',
  ]

  return (
    <section className="py-16 bg-[#FAF9F6] border-y border-black/5 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-8">
          TRUSTED BY SEARCH &amp; GROWTH LEADERS AT WORLD-CLASS BRANDS
        </p>

        <div className="w-full overflow-hidden relative [mask-image:linear-gradient(to_right,transparent_0,#000_100px,#000_calc(100%-100px),transparent_100%)]">
          <div className="flex w-max gap-16 animate-marquee">
            {[0, 1].map((groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-16 shrink-0">
                {brands.map((b) => (
                  <span
                    key={b}
                    className="text-xl md:text-2xl font-bold tracking-tight text-neutral-400 hover:text-black transition"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
