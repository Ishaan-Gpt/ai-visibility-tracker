'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MaskedImage } from './AnimatedHeading'

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

interface TeamCarouselProps {
  intro: React.ReactNode
}

export function TeamCarousel({ intro }: TeamCarouselProps) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  const team = [
    { img: '/images/ai_expert_1_1786114890114.png', role: 'AI SEARCH STRATEGIST', name: 'Dr. Helga Brooks' },
    { img: '/images/ai_expert_2_1786114890114.png', role: 'SCHEMA & TECHNICAL ARCHITECT', name: 'Dr. Kwame Mbeki' },
    { img: '/images/ai_expert_3_1786114929317.png', role: 'SERP & CONTENT ENGINEER', name: 'Dr. Matteo Dubois' },
    { img: '/images/ai_expert_2_1786114890114.png', role: 'LLM ANSWER ENGINE SPECIALIST', name: 'Dr. Hana Sato' },
    { img: '/images/ai_expert_1_1786114890114.png', role: 'TOPICAL DENSITY AUDITOR', name: 'Dr. Aria Vance' },
  ]

  const GAP = 11.26
  const visible = 3.25
  const maxIndex = Math.max(0, Math.ceil(team.length - visible))

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex" style={{ gap: `${GAP}px` }}>
        {/* Intro Column */}
        <div className="shrink-0 w-[324px]">{intro}</div>

        {/* Viewport */}
        <div className="relative overflow-hidden flex-1 min-w-0">
          <motion.div
            className="flex"
            style={{
              gap: `${GAP}px`,
              width: `calc(${team.length} * ((100% - ${(visible - 1) * GAP}px) / ${visible}) + ${(team.length - 1) * GAP}px)`,
            }}
            animate={{
              x: `calc(${-index} * (100% + ${GAP}px) / ${team.length})`,
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {team.map((m, i) => (
              <div
                key={i}
                className="shrink-0"
                style={{
                  width: `calc((100% - ${(team.length - 1) * GAP}px) / ${team.length})`,
                  fontFamily: '"TT Hoves", "Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
              >
                <div className="aspect-[3/4] overflow-hidden bg-muted rounded-2xl">
                  <MaskedImage
                    src={m.img}
                    alt={m.name}
                    className="w-full h-full"
                    delay={i * 0.08}
                  />
                </div>
                <div className="pt-6">
                  <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase font-medium">
                    {m.role}
                  </p>
                  <p className="text-xl mt-2 font-medium text-neutral-900">
                    {m.name}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Hover Control Puck */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
          >
            <div
              className="flex items-center justify-center gap-4 rounded-full cursor-pointer shadow-2xl"
              style={{
                width: 126,
                height: 126,
                background: 'rgba(72, 72, 72, 0.35)',
                backdropFilter: 'blur(84px)',
                WebkitBackdropFilter: 'blur(84px)',
              }}
            >
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="flex items-center justify-center text-white disabled:opacity-30 transition cursor-pointer hover:scale-110"
              >
                <ArrowLeftIcon />
              </button>
              <button
                type="button"
                disabled={index >= maxIndex}
                onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
                className="flex items-center justify-center text-white disabled:opacity-30 transition cursor-pointer hover:scale-110"
              >
                <ArrowRightIcon />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
