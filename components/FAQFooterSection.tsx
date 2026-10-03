'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logomark } from '@/components/tools/shared/icons/Logomark'

function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

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
    {
      q: 'Which currencies or plans are supported?',
      a: 'All plans include unlimited workspace team access with transparent usage limits for enterprise domains.',
    },
  ]

  return (
    <footer className="bg-white border-t border-ds-line">
      {/* TOP SECTION: GRADIENT CTA BANNER + FAQ ACCORDIONS */}
      <div className="py-24 px-6 md:px-12 max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT WARM VIBRANT GRADIENT CTA CARD */}
          <div
            className="lg:col-span-6 rounded-ds-lg p-8 md:p-12 text-black flex flex-col justify-between min-h-[380px] relative overflow-hidden"
            style={{
              background: '#FFF1E6',
            }}
          >
            <div>
              <h3
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 leading-[1.1]"
              >
                Ready to Dominate Search &amp; AI Visibility?
              </h3>
              <p className="text-sm font-medium text-black/80 mt-4 max-w-sm leading-relaxed">
                Zero Friction. Real-Time SERP Insights at the Best Rates.
              </p>
            </div>

            <div className="mt-10">
              <button
                type="button"
                className="px-8 py-4 rounded-ds-lg bg-black text-white text-sm font-bold hover:bg-neutral-900 transition cursor-pointer flex items-center gap-2"
              >
                Get Started Today <ArrowUpRightIcon />
              </button>
            </div>
          </div>

          {/* RIGHT ACCORDION LIST */}
          <div className="lg:col-span-6 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-ds-lg bg-[#FAF9F6] border border-black/8 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 md:p-6 text-left font-bold text-ds-ink flex items-center justify-between gap-4 text-base md:text-lg cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-xl font-mono shrink-0">{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-5 md:px-6 pb-6 text-sm text-ds-ink-2 leading-relaxed border-t border-ds-line pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FOOTER BOTTOM NAV & NEWSLETTER */}
      <div className="py-16 px-6 md:px-12 border-t border-ds-line max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* BRAND COLUMN */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <Logomark className="w-7 h-7 text-[#E86A00]" />
              <span className="font-bold text-ds-ink text-xl tracking-tight">OMNI SEO</span>
            </div>
            <p className="text-xs text-ds-ink-2 max-w-xs leading-relaxed">
              Reliable search tools that always reach your destination on time.
            </p>
          </div>

          {/* NAVIGATION LINKS */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-ds-ink uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li><a href="#features" className="hover:text-black">Features</a></li>
              <li><a href="#benefits" className="hover:text-black">Benefits</a></li>
              <li><a href="#testimonials" className="hover:text-black">Testimonials</a></li>
              <li><a href="#pricing" className="hover:text-black">Pricing</a></li>
            </ul>
          </div>

          {/* PAGES LINKS */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-ds-ink uppercase tracking-wider">Pages</h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li><Link href="/" className="hover:text-black">Home</Link></li>
              <li><a href="#contact" className="hover:text-black">Contact</a></li>
              <li><a href="#faq" className="hover:text-black">FAQ</a></li>
            </ul>
          </div>

          {/* NEWSLETTER COLUMN */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-ds-ink uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs text-ds-ink-2">Join our newsletter and get notified.</p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-xs text-ds-ink outline-none focus:border-black transition"
              />
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-ds-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ds-ink-2">
          <span>© 2026 OMNI SEO Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-black">Privacy Policy</a>
            <a href="#terms" className="hover:text-black">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
