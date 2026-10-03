'use client'

import React from 'react'
import { AnimatedHeading, AnimatedText } from './AnimatedHeading'
import { TeamCarousel } from './TeamCarousel'

export function TeamSection() {
  return (
    <section
      className="py-32 px-8 md:px-12 bg-white border-b border-ds-line"
    >
      <div className="max-w-[1728px] mx-auto">
        {/* Heading Block padded left to align with carousel card 1 */}
        <div style={{ paddingLeft: '335.26px' }} className="mb-20">
          <div
            className="flex gap-24 tracking-[0.2em] uppercase text-ds-ink-2 mb-16 font-medium"
            style={{ fontSize: '11.26px' }}
          >
            <span>OMNI SEO</span>
            <span>Our Search Strategists</span>
          </div>

          <AnimatedHeading className="font-medium leading-[1.05] text-ds-ink">
            <span
              style={{
                fontSize: '58.55px',
                lineHeight: 1.05,
                display: 'block',
              }}
            >
              Get to Know the AI Engineers
              <br />
              that Dominate the SERPs
            </span>
          </AnimatedHeading>
        </div>

        {/* Carousel Row */}
        <TeamCarousel
          intro={
            <AnimatedText className="text-ds-ink-2 leading-relaxed">
              <span
                style={{
                  fontSize: '16.89px',
                  lineHeight: 1.5,
                  display: 'block',
                  width: '270px',
                }}
              >
                On our platform, our devoted team of AI search engineers works ceaselessly to enhance your online presence and ensure maximum visibility across all search surfaces.
              </span>
            </AnimatedText>
          }
        />
      </div>
    </section>
  )
}
