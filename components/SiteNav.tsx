'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Logomark } from '@/components/tools/shared/icons/Logomark'
import { HUB_TOOLS } from '@/lib/hub/tools'
import { ButtonLink } from '@/components/ds/primitives'

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 bg-ds-canvas/80 backdrop-blur transition-colors ${
        scrolled ? 'border-b border-ds-line' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-ds-ink">
          <Logomark className="h-7 w-7 text-ds-accent" />
          <span className="text-[20px] font-medium tracking-[-0.02em]">OMNI SEO</span>
        </Link>

        <nav className="flex items-center gap-1 text-[16px]">
          <div className="relative hidden sm:block" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex h-10 items-center gap-1.5 rounded-ds-md px-4 text-ds-ink hover:bg-ds-muted"
            >
              Products <ChevronDown className="h-4 w-4 text-ds-ink-2" />
            </button>
            {open && (
              <div className="absolute right-0 top-12 w-[320px] rounded-ds-lg border border-ds-line bg-ds-surface p-2 shadow-[var(--ds-shadow-pop)]">
                {HUB_TOOLS.map((t) => (
                  <Link
                    key={t.slug}
                    href={t.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start justify-between gap-3 rounded-ds-sm px-3 py-2.5 hover:bg-ds-muted"
                  >
                    <span>
                      <span className="block text-[15px] font-medium text-ds-ink">{t.name}</span>
                      <span className="block text-[13px] text-ds-ink-2">{t.tagline}</span>
                    </span>
                    {t.status === 'coming-soon' && (
                      <span className="mt-0.5 rounded-full bg-ds-muted px-2 py-0.5 text-[12px] text-ds-ink-2">Soon</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="#pricing"
            className="hidden h-10 items-center rounded-ds-md px-4 text-ds-ink hover:bg-ds-muted sm:inline-flex"
          >
            Pricing
          </Link>
          <Link
            href="/tools/ai-visibility-tracker/login"
            className="inline-flex h-10 items-center rounded-ds-md px-4 text-ds-ink hover:bg-ds-muted"
          >
            Sign in
          </Link>
          <ButtonLink href="/tools/ai-visibility-tracker/signup" className="ml-1">
            Get started free
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}
