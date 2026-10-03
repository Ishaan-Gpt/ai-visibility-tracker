'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Logomark } from '@/components/tools/shared/icons/Logomark'
import { ButtonLink, Container, Section, SectionHeading } from '@/components/ds/primitives'

const FAQS = [
  {
    q: 'What is OMNI SEO?',
    a: 'A single studio that combines an AI-visibility tracker with schema, sitemap and keyword-density tools, so you do not need a separate tool for each job.',
  },
  {
    q: 'Which AI engines do you track?',
    a: 'Today the tracker checks Gemini. ChatGPT and Perplexity are next on the roadmap, and we will say clearly which engines each result came from.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. The free tier includes the SEO tools and one tracked brand with 3 prompts, refreshed weekly. Pro raises the limits and refreshes daily.',
  },
  {
    q: 'Can I replace my current SEO subscription?',
    a: 'For schema, sitemaps, content checks and AI-visibility tracking, yes. We do not yet offer backlink data or full keyword research, which is why those are marked Soon.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No. Every tool is a guided form and the output is ready to paste into your site or submit to Search Console.',
  },
]

export function FAQFooterSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <>
      <Section className="bg-ds-surface" id="faq">
        <Container className="max-w-[760px]">
          <SectionHeading title="Common questions" />
          <div className="mt-10 divide-y divide-ds-line border-y border-ds-line">
            {FAQS.map((f, i) => {
              const isOpen = open === i
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-[16px] font-medium text-ds-ink"
                  >
                    {f.q}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-ds-ink-2 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && <p className="pb-5 text-[16px] leading-6 text-ds-ink-2">{f.a}</p>}
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="text-center">
          <h2 className="mx-auto max-w-[620px] text-[28px] font-normal leading-8 tracking-[-0.02em] text-ds-ink md:text-[36px] md:leading-10">
            See how AI search sees your brand
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-[18px] leading-7 text-ds-ink-2">
            Create a free account and run your first check in a few minutes.
          </p>
          <ButtonLink href="/tools/ai-visibility-tracker/signup" size="lg" className="mt-8">
            Get started free
          </ButtonLink>
        </Container>
      </Section>

      <footer className="border-t border-ds-line">
        <Container className="flex flex-col items-center justify-between gap-4 py-8 text-[14px] text-ds-ink-2 sm:flex-row">
          <div className="flex items-center gap-2 text-ds-ink">
            <Logomark className="h-5 w-5 text-ds-accent" />
            <span className="font-medium">OMNI SEO</span>
            <span className="text-ds-ink-2">© 2026</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#products" className="hover:text-ds-ink">Products</Link>
            <Link href="#pricing" className="hover:text-ds-ink">Pricing</Link>
            <Link href="#faq" className="hover:text-ds-ink">FAQ</Link>
            <Link href="/tools/ai-visibility-tracker/login" className="hover:text-ds-ink">Sign in</Link>
          </nav>
        </Container>
      </footer>
    </>
  )
}
