'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

/** Explee-style "paste your website" command bar. Carries the domain through signup into onboarding. */
export function HeroCommandBar() {
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
    <div className="mt-8 flex flex-col items-center">
      <form
        onSubmit={submit}
        className="flex w-full max-w-[600px] items-center gap-1 rounded-ds-lg border border-ds-line bg-ds-surface p-1 pl-5 focus-within:ring-2 focus-within:ring-ds-ink"
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
    </div>
  )
}
