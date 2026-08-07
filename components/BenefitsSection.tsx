'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function BenefitsSection() {
  const benefits = [
    {
      title: 'Manual Audits are Dead',
      desc: 'Real-time automated crawls detect broken schemas, sitemap errors, and indexation bottlenecks in seconds.',
      img: '/images/manual_audit_concept_1786114952122.png',
      badge: 'Automated Audits',
    },
    {
      title: 'Ethical & Penalty-Proof',
      desc: 'No black-hat tricks or link farms. OMNI SEO builds clean, structured data Google and LLMs trust.',
      img: '/images/unethical_seo_concept_1786114969669.png',
      badge: 'Penalty Proof',
    },
    {
      title: 'Instant Rank Visibility',
      desc: 'No more waiting weeks for rank reports. See your position across Google & ChatGPT in real-time.',
      img: '/images/rank_waitlist_concept_1786114985986.png',
      badge: 'Real-Time SERP',
    },
  ]

  return (
    <section className="py-24 bg-[#FAF9F6] px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-white border border-black/10 text-black text-xs font-semibold uppercase tracking-wider">
            Why OMNI SEO
          </span>
          <h2
            className="text-4xl md:text-5xl font-medium leading-tight text-neutral-900 mt-4"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Engineered for predictable organic growth
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Stop relying on guesswork. Our platform replaces manual audits and legacy tools with automated intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              whileHover={{ y: -6 }}
              className="rounded-[28px] bg-white border border-black/8 overflow-hidden p-7 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-full h-52 rounded-2xl bg-[#FAF9F6] overflow-hidden mb-6 flex items-center justify-center p-4">
                  <img
                    src={b.img}
                    alt={b.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-bold bg-[#FFD209] text-black px-3 py-1 rounded-full inline-block mb-3">
                  {b.badge}
                </span>
                <h3 className="text-2xl font-bold text-neutral-900">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {b.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-neutral-900">
                <span>Learn More</span>
                <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
