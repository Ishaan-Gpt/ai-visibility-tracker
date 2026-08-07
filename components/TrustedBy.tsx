'use client'

import React from 'react'

export function TrustedBy() {
  const brands = [
    { name: 'Intel', tag: 'A.Intel' },
    { name: 'OMNI SEO', tag: null },
    { name: 'Oracle', tag: 'A.Oracle' },
    { name: 'GoFundMe', tag: 'A.GoFundMe' },
    { name: 'Nutanix', tag: 'A.Nutanix' },
    { name: 'Upside', tag: 'A.Upside' },
    { name: 'Microsoft', tag: 'A.Microsoft' },
  ]

  const marqueeList = [...brands, ...brands]

  return (
    <section className="bg-white pt-16 pb-14 px-[40px] border-b border-black/5">
      <h2
        className="text-center text-3xl md:text-4xl font-medium text-neutral-900 mb-12"
        style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
      >
        Trusted by the{' '}
        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
          leading brands
        </span>
      </h2>

      <div className="relative overflow-hidden w-full max-w-[1360px] mx-auto">
        {/* Left & Right Gradient Overlays */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="flex w-max animate-marquee gap-16">
          {marqueeList.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
              {item.tag && (
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center">
                  ⚡
                </div>
              )}
              <span
                className="text-3xl font-bold text-black whitespace-nowrap"
                style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
              >
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
