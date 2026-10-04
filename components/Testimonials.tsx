'use client'

import React from 'react'
import { motion } from 'framer-motion'

function LightningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

export function Testimonials() {
  const quoteText =
    'OMNI SEO completely changed how I approached ranking our product. Instead of feeling overwhelmed with choices, it felt like having a search engineer by my side 24/7.'

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section id="testimonials" className="bg-white border-b border-ds-line">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ staggerChildren: 0.18 }}
          className="flex flex-col lg:flex-row justify-between items-stretch gap-8 lg:gap-[25px]"
        >
          {/* Left Column Wrapper */}
          <div className="flex flex-col lg:flex-row gap-[25px] items-stretch">
            {/* Block A */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row lg:flex-col justify-between lg:h-full lg:min-h-[447px] gap-4 lg:gap-8 items-start sm:items-center lg:items-start p-6 rounded-ds-lg bg-[#FAF9F6] border border-ds-line"
            >
              <div className="flex flex-col gap-6 flex-1 lg:flex-none">
                <h3
                  className="text-3xl text-black leading-tight max-w-[260px] font-medium"
                >
                  OMNI SEO{' '}
                  <span className="text-ds-accent">
                    changed my approach
                  </span>
                </h3>

                {/* Desktop Dot Indicator */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="w-8 h-2 bg-black rounded-full" />
                  <div className="w-2 h-2 bg-stone-300 rounded-full" />
                  <div className="w-2 h-2 bg-stone-300 rounded-full" />
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className="self-start bg-black text-white px-7 py-3 rounded-ds-lg text-xl font-medium hover:bg-neutral-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Read Case Study
              </motion.button>
            </motion.div>

            {/* Block B */}
            <div className="flex flex-col gap-3 w-full lg:w-[282px]">
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full h-[280px] lg:h-[351px] rounded-ds-lg overflow-hidden"
              >
                <img
                  src="/images/ai_expert_1_1786114890114.png"
                  alt="Sophia Martinez"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.55, ease: 'easeOut' }}
                className="w-full h-24 rounded-ds-lg flex items-center justify-center gap-3 bg-[#F1F0EF]"
              >
                <div className="w-8 h-8 rounded-full bg-ds-accent text-black font-bold flex items-center justify-center">
                  <LightningIcon />
                </div>
                <span
                  className="text-2xl font-bold text-black"
                >
                  Nutanix Tech
                </span>
              </motion.div>
            </div>
          </div>

          {/* Right Column Quote Card */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-[748px] flex-1 p-8 md:p-10 rounded-ds-lg flex flex-col justify-between gap-10 bg-[#7D756E1C] border border-ds-line"
          >
            <p
              className="text-2xl md:text-3xl leading-relaxed text-black font-medium"
            >
              {quoteText.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: 0.4 + i * 0.04,
                    ease: 'easeOut',
                  }}
                  className="inline-block mr-[0.25em]"
                >
                  {word}
                </motion.span>
              ))}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col gap-1 border-t border-black/10 pt-6"
            >
              <span className="text-xl font-medium text-ds-ink">
                Sophia Martinez,
              </span>
              <span className="text-sm md:text-base text-black/60 font-sans">
                VP of Growth &amp; Organic Search, Nutanix
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
