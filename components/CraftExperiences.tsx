'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function LightningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// --- Animated Words Helper ---
function AnimatedWords({ text, baseDelay = 0 }: { text: string; baseDelay?: number }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 0.5,
            delay: baseDelay + i * 0.045,
            ease: 'easeOut',
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  )
}

// --- Card 1 Carousel Component ---
const CAROUSEL_ITEMS = [
  'AI Overviews & ChatGPT',
  'JSON-LD Schema Graphs',
  'Automated XML Sitemaps',
  'Topical Keyword Density',
  'Real-Time SERP Tracking',
  'Indexation Health Scoring',
]

function StyleCarouselCard() {
  const [active, setActive] = useState(2)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % CAROUSEL_ITEMS.length)
    }, 2800)
    return () => clearTimeout(timer)
  }, [])

  const len = CAROUSEL_ITEMS.length
  const half = Math.floor(len / 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
      className="flex flex-1 relative h-[585px] rounded-3xl overflow-hidden bg-stone-900 text-white shadow-xl"
    >
      {/* Background Mesh Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFD209]/10 via-black/40 to-black/80 z-0" />

      {/* Top & Bottom Gradient Overlays */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-20" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent z-20" />

      {/* Carousel Wrapper */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="relative w-full h-[80px] flex items-center justify-center">
          {CAROUSEL_ITEMS.map((label, i) => {
            const diff = ((i - active + len + half) % len) - half
            const isActive = diff === 0
            const isVisible = Math.abs(diff) <= 2

            const PILL_ROW_HEIGHT = 56
            const PILL_GAP = 18
            const ACTIVE_GAP = 22

            let y = 0
            if (diff !== 0) {
              if (diff < 0) {
                y = diff * (PILL_ROW_HEIGHT + PILL_GAP) - ACTIVE_GAP
              } else {
                y = diff * (PILL_ROW_HEIGHT + PILL_GAP) + ACTIVE_GAP
              }
            }

            const opacity = !isVisible ? 0 : Math.abs(diff) === 2 ? 0.55 : 1

            return (
              <motion.div
                key={label}
                animate={{ y, opacity }}
                transition={{
                  y: { type: 'spring', stiffness: 260, damping: 28 },
                  opacity: { duration: 0.4, ease: 'easeInOut' },
                }}
                className="absolute left-0 right-0 flex justify-center pointer-events-none"
              >
                {isActive ? (
                  <div className="w-[calc(100%_-_60px)] mx-[30px] h-[80px] bg-white/25 backdrop-blur-xl shadow-2xl rounded-full border border-white/20 p-2.5 flex items-center gap-4">
                    <div className="w-[63px] h-[63px] rounded-full bg-[#FFD209] text-black font-bold flex items-center justify-center shrink-0">
                      <LightningIcon />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div
                        className="text-white text-lg font-medium truncate"
                        style={{ fontFamily: "'Inter Tight', sans-serif" }}
                      >
                        {label}
                      </div>
                      <span className="text-white/70 text-[11px] tracking-[0.15em] uppercase font-semibold">
                        OMNI SEO CHOICE
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[261px] h-[56px] px-4 bg-white/15 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-[8.5px]">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-white/50" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="h-2 w-[120px] bg-white/50 rounded-full mb-1" />
                      <div className="h-2 w-[60px] bg-white/35 rounded-full" />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// --- Card 2 Morphing Chat Component ---
function ChatCustomerCard() {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilled(true)
    }, 1100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, delay: 0.35, ease: 'easeOut' }}
      className="flex flex-1 relative h-[585px] rounded-3xl overflow-hidden bg-[#141413] flex-col pt-10 pb-10 justify-between shadow-xl"
    >
      {/* Top Chat Bubbles Area */}
      <div className="flex-1 flex flex-col justify-center gap-[10px] mb-6">
        {/* Bubble 1: Static Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-[58px] h-[108px] rounded-2xl bg-[#FAFAFA14] flex items-start pt-[22px] pl-[22px] relative"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF54] shrink-0" />
          <div className="ml-[12px] flex-1 flex flex-col gap-[9px] pr-[22px]">
            <div className="h-[6px] w-[31px] bg-[#FFFFFF3D] rounded-full mt-[5px]" />
            <div className="h-[6px] w-[85%] bg-[#FFFFFF3D] rounded-full" />
            <div className="h-[6px] w-[55%] bg-[#FFFFFF3D] rounded-full" />
          </div>
        </motion.div>

        {/* Bubble 2: Morphing Bubble */}
        <motion.div
          layout
          animate={{ backgroundColor: filled ? '#9E948B' : '#FAFAFA14' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mx-[45px] h-[135px] rounded-3xl p-[22px] overflow-hidden relative"
        >
          <AnimatePresence mode="wait">
            {!filled ? (
              <motion.div
                key="skeleton"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFFFFF54] shrink-0" />
                <div className="ml-[12px] flex-1 flex flex-col gap-[9px] pr-[22px]">
                  <div className="h-[6px] w-[31px] bg-[#FFFFFF3D] rounded-full mt-[5px]" />
                  <div className="h-[6px] w-[85%] bg-[#FFFFFF3D] rounded-full" />
                  <div className="h-[6px] w-[55%] bg-[#FFFFFF3D] rounded-full" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center gap-[12px] h-[44px]">
                  <div className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center">
                    <UserIcon />
                  </div>
                  <span className="text-white text-base font-semibold">Me</span>
                </div>
                <p className="text-white text-[15px] leading-snug mt-1 ml-[44px] font-sans">
                  &quot;My search rankings won&apos;t update, any ideas on how to use OMNI SEO?&quot;
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="flex justify-between items-end pl-[32px] pr-[32px]">
        <div
          className="w-64 text-white text-3xl md:text-4xl leading-tight font-medium"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          <AnimatedWords text="Engage and rank across all engines" baseDelay={0.5} />
        </div>

        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#141413] bg-[#FFD209] text-black font-bold flex items-center justify-center text-sm z-30 shadow-md">
            01
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-[#141413] bg-[#252522] text-white/40 font-bold flex items-center justify-center text-sm -ml-3 z-20">
            2
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-[#141413] bg-[#252522] text-white/40 font-bold flex items-center justify-center text-sm -ml-3 z-10">
            3
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// --- Card 3 Adaptable List Component ---
function AdaptableListCard() {
  const items = [
    { label: 'AI Answer Engine Prompts', color: '#887C71' },
    { label: 'Google Schema Rules', color: '#9E948B' },
    { label: 'Topical Density Rules', color: '#9E948B' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, delay: 0.7, ease: 'easeOut' }}
      className="flex flex-1 relative h-[585px] rounded-3xl overflow-hidden flex-col px-[33px] pt-[44px] pb-10 bg-[#7D756E] text-white shadow-xl"
    >
      {/* Top Header & Subtext */}
      <div className="flex flex-col gap-[26px]">
        <h3
          className="text-white text-5xl font-normal leading-[1.05]"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          It&apos;s completely
          <br />
          adaptable.
        </h3>

        <p className="text-white/70 text-lg leading-snug max-w-[340px] font-sans">
          <AnimatedWords
            text="Customize OMNI SEO to fit your technical stack—whether you need rich schema, automated sitemaps, or AI visibility tracking."
            baseDelay={0.6}
          />
        </p>
      </div>

      {/* Bottom Rules List */}
      <div className="mt-auto z-10 flex flex-col gap-[12px]">
        {items.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 1.1 + idx * 0.18, ease: 'easeOut' }}
            className="w-full py-[15px] px-[27px] rounded-2xl bg-white flex items-center justify-between shadow-md"
          >
            <span
              className="text-lg font-semibold"
              style={{ color: item.color, fontFamily: "'Inter Tight', sans-serif" }}
            >
              {item.label}
            </span>

            <svg
              className="w-[22px] h-[22px] text-neutral-400 stroke-[2.5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Gradient Fade Overlay at Bottom */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-10 h-[140px] -mx-4 z-20 bg-gradient-to-t from-[#7D756E] via-[#7D756E]/80 to-transparent" />
    </motion.div>
  )
}

export function CraftExperiences() {
  return (
    <section className="bg-white border-b border-black/5">
      <div className="max-w-[1360px] mx-auto px-6 md:px-12 pt-16 pb-20">
        <h2
          className="text-center text-5xl md:text-6xl font-normal leading-[1.1] mb-12 text-neutral-900"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
            Craft search experiences
          </span>{' '}
          your
          <br />
          customers &amp; AI engines will remember
        </h2>

        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
          <StyleCarouselCard />
          <ChatCustomerCard />
          <AdaptableListCard />
        </div>
      </div>
    </section>
  )
}
