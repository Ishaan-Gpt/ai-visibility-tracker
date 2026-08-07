'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

import { AuthFlowModal } from '@/components/AuthFlowModal'
import { StudioLayout } from '@/components/studio/StudioLayout'
import { TrustedBy } from '@/components/TrustedBy'
import { CraftExperiences } from '@/components/CraftExperiences'
import { Testimonials } from '@/components/Testimonials'
import { TeamSection } from '@/components/TeamSection'
import { BenefitsSection } from '@/components/BenefitsSection'
import { ConsultantsSection } from '@/components/ConsultantsSection'
import { DeFiArchitectureSection } from '@/components/DeFiArchitectureSection'
import { FAQFooterSection } from '@/components/FAQFooterSection'
import { Logomark } from '@/components/tools/shared/icons/Logomark'

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
          className="inline-block overflow-hidden pb-[0.2em] align-bottom"
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

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function StarIcon({ half, className }: { half?: boolean; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className}>
      {half && (
        <defs>
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2.5l2.95 6.2 6.8.78-5.05 4.66 1.4 6.66L12 17.6l-6.1 3.2 1.4-6.66L2.25 9.48l6.8-.78L12 2.5z"
        fill={half ? 'url(#half-star)' : 'currentColor'}
      />
    </svg>
  )
}

const MARQUEE_BRANDS = ['Oracle', 'GoFundMe', 'Nutanix', 'Upside']

function TrustedByStrip() {
  return (
    <div className="mt-6 px-2 pb-1 flex items-center justify-center">
      <div
        className="w-full max-w-2xl overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0, #000 60px, #000 calc(100% - 60px), transparent 100%)',
        }}
      >
        <div className="flex w-max gap-12 animate-marquee justify-center">
          {[0, 1].map((groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-12 shrink-0 pr-12">
              {MARQUEE_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="text-white/60 text-base font-semibold tracking-tight whitespace-nowrap"
                  style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
                >
                  {brand}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Main Hero Component ---
function HeroSection({ onStart }: { onStart: () => void }) {
  const brandName = 'OMNI SEO'
  const brandLetters = brandName.split('')
  const navLinks = [
    { name: 'Home', href: '#', active: true },
    { name: 'How it works', href: '#' },
    { name: 'Company', href: '#', hasDropdown: true },
    { name: 'Case Studies', href: '#' },
  ]

  const omniTools = [
    'AI Search Agent',
    'Rank Tracking & Audits',
    'Automated Content Engine',
    'Schema & Technical SEO',
    'Real-Time SERP Analytics',
  ]

  return (
    <div className="w-full bg-background min-h-screen flex flex-col justify-between pb-12">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full">
        {/* 1) HEADER */}
        <header className="flex items-center justify-between pt-6 md:pt-8">
          <a href="/" className="flex items-center gap-[9.23px]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'backOut' }}
            >
              <Logomark className="w-[38px] h-[38px] text-[#E86A00]" />
            </motion.div>
            <span
              className="text-[28px] font-semibold text-black tracking-tight leading-none flex"
              style={{ fontFamily: "var(--font-inter-tight), sans-serif" }}
            >
              {brandLetters.map((char, index) => (
                <span
                  key={index}
                  className="inline-block overflow-hidden pb-[0.1em]"
                >
                  <motion.span
                    className="inline-block"
                    initial={{ y: '110%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.25, 1, 0.5, 1],
                      delay: 0.5 + index * 0.06,
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                </span>
              ))}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-[36px]">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                className={`text-[15px] font-medium transition-colors flex items-center gap-1 ${
                  link.active
                    ? 'text-foreground underline underline-offset-[6px] decoration-[1.5px]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 + index * 0.08 }}
              >
                {link.name}
                {link.hasDropdown && <ChevronDown className="w-3 h-3 ml-0.5" />}
              </motion.a>
            ))}
          </nav>

          <motion.button
            type="button"
            onClick={onStart}
            className="rounded-full border border-border bg-white px-[20px] py-[10px] text-[14px] font-semibold text-foreground shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-neutral-100 transition-colors cursor-pointer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: 'backOut', delay: 1.3 }}
          >
            Start OMNI SEO
          </motion.button>
        </header>

        {/* 2) HERO */}
        <section className="pt-14 md:pt-20 text-center">
          <motion.div
            className="inline-flex items-center p-[4px] pr-[11px] gap-[10px] rounded-[8px] bg-[rgba(192,192,192,0.17)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 1.5 }}
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

          <h1 className="max-w-[1050px] mt-5 text-[48px] md:text-[76px] font-medium leading-[1.0] tracking-[-0.035em] text-center mx-auto">
            <div className="md:whitespace-nowrap">
              <AnimatedWords
                text="AI that ranks & converts search traffic"
                delayStart={1.7}
                stagger={0.04}
              />
            </div>
            <div className="mt-1 flex items-center justify-center flex-wrap">
              <AnimatedWords
                text="for your"
                delayStart={1.95}
                stagger={0.04}
              />
              <div className="inline-block w-[76px] h-[76px] md:w-[96px] md:h-[96px] rounded-full overflow-hidden border-2 border-white shadow-md mx-2 align-middle">
                <img
                  src="/images/ai_expert_1_1786114890114.png"
                  alt="AI Search Specialist"
                  className="w-full h-full object-cover"
                />
              </div>
              <AnimatedWords
                text="modern brand"
                className="text-foreground/25"
                delayStart={2.10}
                stagger={0.04}
              />
            </div>
          </h1>

          <motion.p
            className="mt-6 max-w-[760px] text-[17px] md:text-[18px] leading-[1.5] text-muted-foreground text-center mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 2.5 }}
          >
            Built for how customers actually search. They Google. They compare. They convert.
            <br className="hidden md:inline" />
            OMNI SEO unifies all 5 search tools — AI Agent, Rank Tracking, Content Engine, Schema &amp; SERP Analytics — to dominate page 1.
          </motion.p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={onStart}
              className="rounded-full border border-border bg-white px-6 py-3 text-[15px] font-semibold text-foreground shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-neutral-100 transition-colors cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'backOut', delay: 2.7 }}
            >
              Start OMNI SEO
            </motion.button>

            <motion.button
              type="button"
              onClick={onStart}
              className="rounded-full px-6 py-3 text-[15px] font-semibold text-white bg-black hover:bg-neutral-800 hover:scale-[1.02] transition-transform cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'backOut', delay: 2.8 }}
            >
              Let’s Talk ↗
            </motion.button>
          </div>
        </section>

        {/* 3) SHOWCASE CARD */}
        <motion.div
          className="mt-14 w-full rounded-[28px] overflow-hidden p-3 md:p-4 bg-[#0a0a0a] text-white shadow-2xl"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.25, 1, 0.5, 1], delay: 3.0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-4 items-start">
            {/* LEFT INNER CARD — warm mesh gradient */}
            <motion.div
              className="mesh-showcase min-h-[300px] md:min-h-[380px] rounded-[22px] p-6 md:p-8 text-white relative flex flex-col justify-between overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 3.2 }}
            >
              <div>
                <motion.div
                  className="w-[36px] h-[22px] rounded-[6px] bg-white text-black text-[12px] font-bold flex items-center justify-center mb-5"
                  initial={{ scale: 2.4, opacity: 0.2 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.25, 1, 0.5, 1],
                    delay: 3.45,
                  }}
                >
                  Pro
                </motion.div>

                <h3 className="text-[26px] md:text-[30px] font-medium leading-[1.15] tracking-tight text-white">
                  <div>
                    <AnimatedWords text="All-in-One" delayStart={3.6} />
                  </div>
                  <div>
                    <AnimatedWords text="AI Search Platform" delayStart={3.75} />
                  </div>
                </h3>

                <p className="text-[14px] font-normal text-white/50 leading-relaxed mt-4 max-w-[260px]">
                  From keyword intelligence to automated SERP ranking, all 5 AI tools powered by OMNI SEO.
                </p>
              </div>

              {/* Soft abstract graphic, bottom-right */}
              <div
                className="hidden md:block absolute -bottom-10 -right-10 w-[240px] h-[240px] rounded-full opacity-70 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 35% 35%, rgba(191, 219, 254, 0.55), rgba(147, 197, 253, 0.15) 55%, transparent 75%)',
                  filter: 'blur(2px)',
                }}
              />
              <div className="hidden md:block absolute bottom-8 right-10 w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" />
            </motion.div>

            {/* RIGHT INNER CARD — white testimonial, shorter than left */}
            <motion.div
              className="rounded-[22px] bg-white p-6 text-neutral-900 relative flex flex-col gap-5"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 3.3 }}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/ai_expert_2_1786114910389.png"
                  alt="Customer"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <span className="text-[14px] font-medium text-foreground">What our customers say</span>
              </div>

              <blockquote className="text-[18px] font-medium leading-[1.35] tracking-tight text-foreground">
                <AnimatedWords text="They converted 40% more leads" delayStart={3.6} />
                {' '}
                <AnimatedWords
                  text="than our old SEO agency — and never missed a follow-up."
                  className="text-muted-foreground"
                  delayStart={3.75}
                  stagger={0.04}
                />
              </blockquote>

              <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Nutanix Tech</h4>
                  <p className="text-xs text-muted-foreground">Growth Team</p>
                </div>

                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <StarIcon key={i} className="star" />
                  ))}
                  <StarIcon half className="star" />
                </div>
              </div>
            </motion.div>
          </div>

          <TrustedByStrip />
        </motion.div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('ishaangupta011205@gmail.com')
  const [userDomain, setUserDomain] = useState('acme.com')
  const [inStudio, setInStudio] = useState(false)

  function handleStartFlow() {
    setModalOpen(true)
  }

  function handleFlowComplete(domain: string, email: string) {
    setUserDomain(domain || 'acme.com')
    setUserEmail(email || 'ishaan@gmail.com')
    setModalOpen(false)
    setInStudio(true)
  }

  if (inStudio) {
    return (
      <StudioLayout
        userEmail={userEmail}
        initialDomain={userDomain}
        onLogout={() => setInStudio(false)}
      />
    )
  }

  return (
    <div className="w-full bg-background min-h-screen">
      {/* UNIFIED AUTH & ONBOARDING MODAL */}
      <AuthFlowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={handleFlowComplete}
      />

      {/* 1) HERO SECTION */}
      <HeroSection onStart={handleStartFlow} />

      {/* 2) TRUSTED BY SECTION */}
      <TrustedBy />

      {/* 3) CRAFT EXPERIENCES SECTION */}
      <CraftExperiences />

      {/* 4) TESTIMONIALS SECTION */}
      <Testimonials />

      {/* 5) TEAM SECTION (with TeamCarousel & 126px hover puck) */}
      <TeamSection />

      {/* 6) BENEFITS SECTION (3-card grid with custom interior gradient divider lines) */}
      <BenefitsSection />

      {/* 7) CONSULTANTS BENTO SECTION */}
      <ConsultantsSection />

      {/* 8) ARCHITECTURE BENTO SECTION */}
      <DeFiArchitectureSection />

      {/* 9) FAQ & FOOTER SECTION */}
      <FAQFooterSection />
    </div>
  )
}
