'use client'

import React from 'react'
import { AnimatedHeading, AnimatedText, MaskedImage } from './AnimatedHeading'

export function BenefitsSection() {
  const items = [
    {
      num: '01',
      title: 'Manual Audits',
      desc: 'We understand that relying on manual SEO audits leaves your site vulnerable to hidden indexation bottlenecks.',
      img: '/images/manual_audit_concept_1786114952122.png',
      reversed: false,
    },
    {
      num: '02',
      title: 'Penalty-Proof Strategy',
      desc: 'When SEO lacks integrity, low-quality link farms damage domain authority. OMNI SEO builds clean, structured data Google and LLMs trust.',
      img: '/images/unethical_seo_concept_1786114969669.png',
      reversed: true,
    },
    {
      num: '03',
      title: 'Instant SERP Visibility',
      desc: 'Brands experience long waiting times before traditional tools update rankings. OMNI SEO delivers instant visibility across Google & ChatGPT.',
      img: '/images/rank_waitlist_concept_1786114985986.png',
      reversed: false,
    },
  ]

  return (
    <section id="benefits" className="py-20 md:py-32 px-5 sm:px-8 md:px-12 bg-[#FAF9F6] border-b border-ds-line">
      <div className="max-w-[1728px] mx-auto">
        {/* Top Intro Grid */}
        <div className="grid grid-cols-12 gap-x-0 gap-y-8 md:gap-x-12 md:gap-y-12 mb-16 md:mb-24 items-start">
          <div className="col-span-12 md:col-span-7">
            <AnimatedHeading className="text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.05] text-ds-ink">
              Explore the Benefits of
              <br />
              Our AI Search Platform
            </AnimatedHeading>
          </div>

          <div className="col-span-12 md:col-span-4 md:col-start-9 md:pt-4">
            <AnimatedText className="text-base text-ds-ink-2 leading-relaxed">
              By choosing an automated AI search platform over legacy offline tools, modern brands reach global search audiences easily, connect with high-intent buyers, and shape the future of organic discovery.
            </AnimatedText>
          </div>
        </div>

        {/* 3-Card Grid with Custom Divider Lines */}
        <div
          className="relative grid grid-cols-1 md:grid-cols-3"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px)',
            backgroundSize: '1px 100%, 1px 100%',
            backgroundPosition: '33.3333% 0, 66.6666% 0',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Top Horizontal Line */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.15) 85%, transparent 100%)',
            }}
          />

          {/* Bottom Horizontal Line */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 bottom-0 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.15) 85%, transparent 100%)',
            }}
          />

          {items.map((card, i) => {
            if (card.reversed) {
              // CARD 02: REVERSED (Image on top, Content on bottom)
              return (
                <div key={card.num} className="p-10 flex flex-col gap-8 justify-between">
                  <div className="aspect-square overflow-hidden rounded-ds-lg bg-white p-4 border border-ds-line">
                    <MaskedImage
                      src={card.img}
                      alt={card.title}
                      className="w-full h-full"
                      delay={i * 0.12}
                    />
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-xs text-ds-ink-2 font-mono mt-2">
                        ({card.num})
                      </span>
                      <AnimatedHeading as="h3" className="text-3xl font-medium text-ds-ink" delay={i * 0.1}>
                        {card.title}
                      </AnimatedHeading>
                    </div>
                    <AnimatedText className="text-sm text-ds-ink-2 leading-relaxed max-w-sm" delay={0.2 + i * 0.1}>
                      {card.desc}
                    </AnimatedText>
                  </div>
                </div>
              )
            }

            // CARD 01 & 03: STANDARD (Content on top, Image on bottom)
            return (
              <div key={card.num} className="p-10 flex flex-col gap-8 justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-xs text-ds-ink-2 font-mono mt-2">
                      ({card.num})
                    </span>
                    <AnimatedHeading as="h3" className="text-3xl font-medium text-ds-ink" delay={i * 0.1}>
                      {card.title}
                    </AnimatedHeading>
                  </div>
                  <AnimatedText className="text-sm text-ds-ink-2 leading-relaxed max-w-sm" delay={0.2 + i * 0.1}>
                    {card.desc}
                  </AnimatedText>
                </div>

                <div className="aspect-square overflow-hidden rounded-ds-lg bg-white p-4 border border-ds-line mt-auto">
                  <MaskedImage
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full"
                    delay={i * 0.12}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
