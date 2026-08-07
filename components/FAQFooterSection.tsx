'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Logomark } from '@/components/tools/shared/icons/Logomark'

export function FAQFooterSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      q: 'What is OMNI SEO?',
      a: 'OMNI SEO is the all-in-one search visibility suite designed for modern brands. It unifies AI Search Visibility tracking (OpenGeo), Schema Markup Generation, Sitemap XML & HTML building, and Keyword Density checking into one unified platform.',
    },
    {
      q: 'How does OMNI SEO track AI answer engines like ChatGPT and Gemini?',
      a: 'OMNI SEO runs real-time query simulations across ChatGPT Search, Google AI Overviews, Gemini, and Perplexity to track whether your brand is cited and recommended in AI summaries.',
    },
    {
      q: 'Can I replace my existing SEO subscriptions with OMNI SEO?',
      a: 'Yes! OMNI SEO replaces 5 fragmented tools (schema generators, sitemap plugins, density checkers, AI trackers, and bloated SEO suites) starting free.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes, OMNI SEO offers a free tier with full access to all 5 search tools so you can start optimizing immediately.',
    },
  ]

  return (
    <footer className="bg-white border-t border-black/5">
      {/* FAQ SECTION */}
      <div className="py-24 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
            Frequently Asked Questions
          </span>
          <h2
            className="text-4xl md:text-5xl font-medium leading-tight text-neutral-900 mt-4"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Everything you need to know about OMNI SEO
          </h2>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="rounded-[20px] bg-[#FAF9F6] border border-black/8 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left font-bold text-neutral-900 flex items-center justify-between gap-4 text-base md:text-lg"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl font-mono">{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-black/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA BANNER */}
      <div className="bg-[#FFD209] py-16 px-6 text-center text-black">
        <h3
          className="text-3xl md:text-5xl font-bold tracking-tight"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Ready to dominate page 1 and AI search?
        </h3>
        <p className="text-base text-black/80 mt-3 max-w-lg mx-auto">
          Join thousands of modern brands using OMNI SEO to capture high-intent search traffic.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="#book-demo"
            className="px-8 py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition shadow-lg"
          >
            Start OMNI SEO Free ↗
          </a>
        </div>
      </div>

      {/* FOOTER BOTTOM */}
      <div className="py-12 px-6 md:px-12 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <Logomark className="w-6 h-6 text-[#E86A00]" />
          <span className="font-bold text-neutral-900 text-sm">OMNI SEO</span>
          <span>© 2026 OMNI SEO Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6 font-medium text-neutral-700">
          <a href="#privacy" className="hover:text-black">Privacy Policy</a>
          <a href="#terms" className="hover:text-black">Terms of Service</a>
          <a href="#contact" className="hover:text-black">Contact</a>
        </div>
      </div>
    </footer>
  )
}
