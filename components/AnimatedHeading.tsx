'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ComponentProps {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: React.ElementType
}

const MOTION_TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  p: motion.p,
  div: motion.div,
  span: motion.span,
} as const

export function AnimatedHeading({ children, className = '', delay = 0, as: As = 'h2' }: ComponentProps) {
  const MotionTag = (MOTION_TAGS[As as keyof typeof MOTION_TAGS] ?? motion.h2) as React.ElementType
  return (
    <MotionTag
      initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}

export function AnimatedText({ children, className = '', delay = 0.15 }: ComponentProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.p>
  )
}

interface MaskedImageProps {
  src: string
  alt: string
  className?: string
  delay?: number
}

export function MaskedImage({ src, alt, className = '', delay = 0 }: MaskedImageProps) {
  return (
    <motion.div
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`overflow-hidden ${className}`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </motion.div>
  )
}
