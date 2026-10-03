'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Gift, Layers } from 'lucide-react'
import { Accent, Container, Pill } from '@/components/ds/primitives'

export function HeroSection() {
  const router = useRouter()
  const [domain, setDomain] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const next = clean
      ? `/tools/ai-visibility-tracker/onboarding?domain=${encodeURIComponent(clean)}`
      : '/tools/ai-visibility-tracker/onboarding'
    router.push(`/tools/ai-visibility-tracker/signup?next=${encodeURIComponent(next)}`)
  }

  return (
    <Container className="flex flex-col items-center pb-8 pt-16 text-center md:pt-24">
      <Pill className="bg-ds-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span className="h-1.5 w-1.5 rounded-full bg-ds-success" />
        <span className="font-medium">4 free SEO tools live</span>
        <span className="text-ds-ink-2">· AI tracker in beta</span>
      </Pill>

      <h1 className="mt-6 max-w-[820px] text-balance text-[40px] font-normal leading-[42px] tracking-[-0.03em] text-ds-ink sm:text-[52px] sm:leading-[54px] md:text-[60px] md:leading-[60px]">
        Every SEO tool you need, <Accent>one dashboard</Accent>
      </h1>

      <p className="mt-6 max-w-[560px] text-[18px] leading-7 text-ds-ink-2">
        Schema, sitemaps, keyword analysis and AI-search visibility tracking in one clean studio. Free to
        start, no SEO suite subscription.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Pill>No credit card</Pill>
        <Pill>
          <Gift className="h-4 w-4 text-ds-ink-2" />
          Free tier forever
        </Pill>
        <Pill>
          <Layers className="h-4 w-4 text-ds-ink-2" />
          All tools, one login
        </Pill>
      </div>

      <form
        onSubmit={submit}
        className="mt-10 flex w-full max-w-[600px] items-center gap-1 rounded-ds-lg border border-ds-line bg-ds-surface p-1 pl-5 focus-within:ring-2 focus-within:ring-ds-ink"
      >
        <label htmlFor="hero-domain" className="sr-only">
          Your website
        </label>
        <input
          id="hero-domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Paste your website, e.g. acme.com"
          className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ds-ink outline-none placeholder:text-ds-ink-3"
          autoComplete="url"
        />
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-ds-md bg-ds-btn px-5 text-[16px] font-medium text-[#f7f7f7] transition-colors hover:bg-black"
        >
          <span className="hidden sm:inline">Check my AI visibility</span>
          <span className="sm:hidden">Start</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <Link href="/tools/schema-generator" className="mt-4 text-[14px] text-ds-ink-2 hover:text-ds-ink">
        or try a free tool first
      </Link>
    </Container>
  )
}
