'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function TeamSection() {
  const team = [
    {
      name: 'Alex Rivera',
      role: 'Head of AI Search Strategy',
      img: '/images/ai_expert_1_1786114890114.png',
    },
    {
      name: 'Elena Rostova',
      role: 'Lead Schema & Technical Architect',
      img: '/images/ai_expert_2_1786114910389.png',
    },
    {
      name: 'Marcus Chen',
      role: 'Founding Search Engineer',
      img: '/images/ai_expert_3_1786114929317.png',
    },
  ]

  return (
    <section className="py-24 bg-white px-6 md:px-12 border-b border-black/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
            AI Search Experts
          </span>
          <h2
            className="text-4xl md:text-5xl font-medium leading-tight text-neutral-900 mt-4"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Built by engineers who live in the SERPs
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Our team combines 15+ years of SEO algorithms with cutting-edge LLM answer engine optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <motion.div
              key={member.name}
              whileHover={{ y: -5 }}
              className="rounded-[24px] bg-[#FAF9F6] border border-black/8 overflow-hidden p-6 text-center shadow-sm"
            >
              <div className="w-40 h-40 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white shadow-md">
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">{member.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {member.role}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
