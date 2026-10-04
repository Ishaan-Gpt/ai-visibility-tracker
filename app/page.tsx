'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

import { SiteNav } from '@/components/SiteNav'
import { ScrollProgress } from '@/components/tools/shared/motion/ScrollProgress'
import { HeroCommandBar } from '@/components/landing/HeroCommandBar'
import { ProductsGrid } from '@/components/landing/ProductsGrid'
import { ResultCards } from '@/components/landing/ResultCards'
import { Pricing } from '@/components/landing/Pricing'
import { TrustedBy } from '@/components/TrustedBy'
import { CraftExperiences } from '@/components/CraftExperiences'
import { Testimonials } from '@/components/Testimonials'
import { TeamSection } from '@/components/TeamSection'
import { BenefitsSection } from '@/components/BenefitsSection'
import { ConsultantsSection } from '@/components/ConsultantsSection'
import { DeFiArchitectureSection } from '@/components/DeFiArchitectureSection'
import { FAQFooterSection } from '@/components/FAQFooterSection'

// --- Animated Words Component ---
interface AnimatedWordsProps {
  text: string
  className?: string
  delayStart?: number
  stagger?: number
  inView?: boolean
}

export function AnimatedWords({
  text,
  className = '',
  delayStart = 0,
  stagger = 0.06,
  inView = false,
}: AnimatedWordsProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const shouldAnimate = inView ? isInView : true
  const words = text.split(' ')

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden pb-[0.16em] align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={
              shouldAnimate
                ? { y: '0%', opacity: 1 }
                : { y: '110%', opacity: 0 }
            }
            transition={{
              duration: 0.6,
              ease: [0.25, 1, 0.5, 1],
              delay: delayStart + i * stagger,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </span>
  )
}

// --- Animated Dotted Frame Connector Component ---
function AnimatedDottedFrame({
  className = '',
  style = {},
  startDelay = 4200,
}: {
  className?: string
  style?: React.CSSProperties
  startDelay?: number
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])

  useEffect(() => {
    if (pathRef.current) {
      const path = pathRef.current
      const total = path.getTotalLength()
      const pts: { x: number; y: number }[] = []
      for (let d = 2; d <= total; d += 4) {
        const p = path.getPointAtLength(d)
        pts.push({ x: p.x, y: p.y })
      }
      setPoints(pts)
    }
  }, [])

  return (
    <svg
      className={className}
      style={style}
      width="141"
      height="107"
      viewBox="0 0 141 107"
      fill="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M140.75 3.75H5.75C2.98857 3.75 0.75 5.98858 0.75 8.75V95.75C0.75 98.5114 2.98858 100.75 5.75 100.75H40"
      />
      <g>
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="1"
            fill="#FFFFFF"
            className="dot-pop"
            style={{ animationDelay: `${startDelay + i * 40}ms` }}
          />
        ))}
      </g>
    </svg>
  )
}

// --- Main Hero Component ---
function HeroSection() {
  const keyFeatures = [
    { name: 'AI Search Agent', active: false },
    { name: 'Lead Capture & SERP', active: false },
    { name: 'Automated Sitemaps & Schema', active: true },
    { name: 'Keyword Density', active: false },
    { name: 'Rank Tracking', active: false },
  ]

  return (
    <div className="w-full bg-ds-canvas min-h-screen flex flex-col justify-between pb-12">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full">
        

        {/* 2) HERO */}
        <section className="pt-12 md:pt-16 text-center mx-auto max-w-[1000px]">
          {/* Eyebrow Pill */}
          <motion.div
            className="inline-flex items-center p-[4px] pr-[11px] pl-[4px] gap-[10px] rounded-[8px] bg-[rgba(192,192,192,0.17)] mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.20 }}
          >
            <div className="w-[28px] h-[22px] rounded-[6px] bg-white flex items-center justify-center">
              <svg className="w-[14px] h-[12px]" viewBox="0 0 12 10">
                <path
                  d="M5.71198 0L9.56198 9.982H7.686L6.734 7.336H2.786L1.806 9.982H0L3.85 0H5.71198ZM6.272 6.02L4.788 1.82L3.234 6.02H6.272ZM11.998 0.014V9.982H10.234V0.014H11.998Z"
                  opacity="0.85"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-[14px] text-foreground font-normal">
              All 5 AI Search &amp; Visibility Tools in One Suite
            </span>
          </motion.div>

          {/* H1 Heading (2-Line Wrapper, Smaller Font, Tight Line Spacing) */}
          <h1 className="max-w-[950px] text-[40px] sm:text-[54px] md:text-[64px] lg:text-[70px] font-medium leading-[0.98] md:leading-[0.98] tracking-[-0.035em] text-center mx-auto">
            <div className="xl:whitespace-nowrap">
              <AnimatedWords
                text="AI that ranks & converts search traffic"
                delayStart={0.40}
                stagger={0.04}
              />
            </div>
            <div className="mt-1 flex items-center justify-center flex-wrap gap-2 xl:whitespace-nowrap">
              <AnimatedWords text="for your" delayStart={0.65} stagger={0.04} />
              <motion.div
                className="inline-block w-[64px] h-[64px] md:w-[76px] md:h-[76px] rounded-full overflow-hidden border-2 border-white align-middle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: 'backOut', delay: 0.85 }}
              >
                <img
                  src="/images/hero_ai_strategist_1786133434717.png"
                  alt="AI Search Specialist"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <AnimatedWords
                text="modern brand"
                className="text-foreground/25"
                delayStart={0.80}
                stagger={0.04}
              />
            </div>
          </h1>

          {/* Subheading Paragraph */}
          <motion.p
            className="mt-[24px] max-w-[720px] text-[16px] md:text-[17px] leading-[1.45] text-ds-ink-2 text-center mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 1.20 }}
          >
            Built for how customers actually search. They Google. They compare. They convert.
            <br />
            Our AI handles every search touchpoint — AI Overviews, Schema, SERP tracking — until they convert.
          </motion.p>

          {/* CTA Row */}
          <div className="mt-[32px] flex items-center justify-center gap-[12px]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'backOut', delay: 1.40 }}
            ><Link href="/tools/ai-visibility-tracker/signup" className="inline-flex rounded-full bg-ds-btn px-6 py-3 text-[15px] font-medium text-[#f7f7f7] transition-colors hover:bg-black">Start OMNI SEO</Link></motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'backOut', delay: 1.50 }}
            ><Link href="#faq" className="inline-flex rounded-full bg-ds-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[var(--ds-accent-hover)]">Let’s Talk ↗</Link></motion.div>
          </div>

          <HeroCommandBar />
        </section>

        {/* 3) SHOWCASE CARD (mesh-showcase with NEW AI generated dashboard mockup) */}
        <motion.div
          className="mesh-showcase mt-[48px] w-full rounded-ds-lg overflow-hidden p-5 md:p-7 text-white"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.25, 1, 0.5, 1], delay: 1.70 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* LEFT INNER CARD */}
            <motion.div
              className="min-h-[360px] rounded-ds-lg bg-ds-btn p-6 md:p-7 text-white relative flex flex-col justify-between overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 1.90 }}
            >
              <div>
                {/* Pro Pill */}
                <motion.div
                  className="w-[36px] h-[22px] rounded-[6px] bg-ds-accent text-[#111114] text-[12px] font-medium flex items-center justify-center mb-4"
                  initial={{ scale: 2.4, opacity: 0.2 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.25, 1, 0.5, 1],
                    delay: 2.15,
                  }}
                >
                  Pro
                </motion.div>

                <h3 className="text-[28px] font-medium leading-[1.15] tracking-tight text-white mt-5">
                  <div>
                    <AnimatedWords text="All-in-One" delayStart={2.30} />
                  </div>
                  <div>
                    <AnimatedWords text="AI Search Platform" delayStart={2.45} />
                  </div>
                </h3>
              </div>

              <div className="mt-auto pt-6">
                <p className="text-[16px] font-normal text-white/40 leading-[19px]">
                  From lead capture to recurring SERP rankings,
                  <br />
                  We run your search visibility with AI.
                </p>
              </div>

              {/* Floating Browser Mockup & Key Features Popover (md+ only) */}
              <div className="hidden md:block absolute bottom-0 right-0 w-[330px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] pointer-events-none">
                {/* Browser Dot Seam */}
                <div className="absolute top-[40px] left-[1px] w-[8px] h-[8px] bg-white rounded-full border-2 border-white/25 box-content z-20" />

                {/* Dashed Connector SVG */}
                <AnimatedDottedFrame
                  className="absolute left-[-135.75px] top-[43.25px] z-10"
                  startDelay={3000}
                />

                {/* Key Features Popover */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 2.65 }}
                  className="absolute bottom-[-24px] right-[214px] z-20 w-[210px] h-[222px] rounded-[13.654px] border border-white/35 bg-white/10 backdrop-blur-sm p-3 flex flex-col pointer-events-auto"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white text-xs">↗</span>
                    <span className="text-white text-[13px] font-medium">Key Features</span>
                  </div>

                  <div className="relative h-px bg-white/20 -mx-3 mb-2">
                    <div className="absolute -left-1 -top-1 w-[8px] h-[8px] bg-white rounded-full border-2 border-white/25 box-content" />
                  </div>

                  <div className="space-y-1">
                    {keyFeatures.map((feat) => (
                      <div
                        key={feat.name}
                        className={`px-2 py-1.5 rounded-[4.312px] flex items-center gap-2 text-xs font-medium ${
                          feat.active
                            ? 'bg-[#F4F4F4] text-[#111114]'
                            : 'text-white/90'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-[1px] flex items-center justify-center shrink-0 ${
                            feat.active ? 'bg-ds-accent' : 'bg-white/15 rounded-[3px]'
                          }`}
                        >
                          {feat.active && (
                            <svg className="w-2 h-2 text-white stroke-current stroke-[4]" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="truncate">{feat.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* New AI Generated Browser Dashboard Image */}
                <img
                  src="/images/hero_browser_dashboard_1786133451507.png"
                  alt="Browser Mockup"
                  className="w-full h-auto rounded-tl-xl border border-white/10"
                />
              </div>
            </motion.div>

            {/* RIGHT INNER CARD */}
            <motion.div
              className="min-h-[360px] rounded-ds-lg bg-white p-6 md:p-7 text-ds-ink relative flex flex-col justify-between"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 2.00 }}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 -space-x-2">
                      <img src="/images/ai_expert_1_1786114890114.png" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                      <img src="/images/ai_expert_2_1786114890114.png" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                      <img src="/images/ai_expert_3_1786114929317.png" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    </div>
                    <span className="text-[15px] font-medium text-foreground">What our customers say</span>
                  </div>

                  <div className="flex flex-col gap-[4.34px]">
                    <div className="w-[32.569px] h-[4.343px] rounded-[5.428px] bg-[#131318]" />
                    <div className="w-[16.285px] h-[4.343px] rounded-[5.428px] bg-[#DCDCDC]" />
                  </div>
                </div>

                <div className="mt-12 text-[13px] text-ds-ink-2 font-mono">Feb 02, 2026</div>

                <blockquote className="mt-2 max-w-[420px] text-[22px] font-medium leading-[1.3] tracking-tight">
                  <AnimatedWords
                    text="They converted 340% more search traffic"
                    delayStart={2.30}
                  />
                  {'\u00A0'}
                  <AnimatedWords
                    text="than our previous agency — and never missed an AI overview ranking."
                    className="text-ds-ink-2"
                    delayStart={2.45}
                    stagger={0.04}
                  />
                </blockquote>
              </div>

              <div className="pt-6 border-t border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
                    ⚡
                  </div>
                  <span className="text-sm font-bold text-ds-ink">Nutanix Tech</span>
                </div>

                {/* 4.5 Stars */}
                <div className="flex items-center gap-1 text-ds-accent">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.5l2.95 6.2 6.8.78-5.05 4.66 1.4 6.66L12 17.6l-6.1 3.2 1.4-6.66L2.25 9.48l6.8-.78L12 2.5z" />
                  </svg>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.5l2.95 6.2 6.8.78-5.05 4.66 1.4 6.66L12 17.6l-6.1 3.2 1.4-6.66L2.25 9.48l6.8-.78L12 2.5z" />
                  </svg>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.5l2.95 6.2 6.8.78-5.05 4.66 1.4 6.66L12 17.6l-6.1 3.2 1.4-6.66L2.25 9.48l6.8-.78L12 2.5z" />
                  </svg>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.5l2.95 6.2 6.8.78-5.05 4.66 1.4 6.66L12 17.6l-6.1 3.2 1.4-6.66L2.25 9.48l6.8-.78L12 2.5z" />
                  </svg>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stopColor="#FFD209" />
                        <stop offset="50%" stopColor="rgba(0,0,0,0.15)" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#half-star)" d="M12 2.5l2.95 6.2 6.8.78-5.05 4.66 1.4 6.66L12 17.6l-6.1 3.2 1.4-6.66L2.25 9.48l6.8-.78L12 2.5z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* TRUSTED-BY MARQUEE ROW (Inside Mesh Card) */}
          <div className="mt-[28px] px-1 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <p className="text-[13px] leading-[1.5] text-white/75 max-w-md">
              Trusted by industry leaders in search who don&apos;t just follow trends, but define how organic discovery moves forward.
            </p>

            <div className="w-full md:max-w-[60%] overflow-hidden relative [mask-image:linear-gradient(to_right,transparent_0,#000_80px,#000_calc(100%-80px),transparent_100%)]">
              <div className="flex w-max animate-marquee gap-10">
                {[...Array(2)].map((_, groupIdx) => (
                  <div key={groupIdx} className="flex items-center gap-10 shrink-0 opacity-70">
                    <span className="text-xl font-bold text-white tracking-wider">INTEL</span>
                    <span className="text-xl font-bold text-white tracking-wider">ORACLE</span>
                    <span className="text-xl font-bold text-white tracking-wider">GOFUNDME</span>
                    <span className="text-xl font-bold text-white tracking-wider">NUTANIX</span>
                    <span className="text-xl font-bold text-white tracking-wider">UPSIDE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="w-full bg-ds-canvas min-h-screen font-sans text-ds-ink">
      <ScrollProgress />
      <SiteNav />

      {/* 1) HERO SECTION */}
      <HeroSection />

      {/* 2) TRUSTED BY SECTION */}
      <TrustedBy />

      {/* 3) PRODUCTS (Explee-style product grid) */}
      <ProductsGrid />

      {/* 4) CRAFT EXPERIENCES SECTION */}
      <CraftExperiences />

      {/* 5) TESTIMONIALS SECTION */}
      <Testimonials />

      {/* 6) RESULT CARDS (Explee-style stat cards with real product facts) */}
      <ResultCards />

      {/* 7) TEAM SECTION */}
      <TeamSection />

      {/* 8) BENEFITS SECTION */}
      <BenefitsSection />

      {/* 9) CONSULTANTS BENTO SECTION */}
      <ConsultantsSection />

      {/* 10) ARCHITECTURE BENTO SECTION */}
      <DeFiArchitectureSection />

      {/* 11) PRICING */}
      <Pricing />

      {/* 12) FAQ & FOOTER SECTION */}
      <div id="faq">
        <FAQFooterSection />
      </div>
    </div>
  )
}
