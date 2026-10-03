import Link from 'next/link'
import { ArrowUpRight, Code2, FileCode2, Gauge, Network, Search, Sparkles } from 'lucide-react'
import { Card, Container, Section, SectionHeading } from '@/components/ds/primitives'

type Product = {
  name: string
  tagline: string
  description: string
  href: string
  icon: typeof Search
  status?: 'Beta' | 'Soon'
}

const PRODUCTS: Product[] = [
  {
    name: 'AI Visibility Tracker',
    tagline: 'Know if AI recommends you',
    description: 'Track whether your brand is mentioned and cited when people ask AI assistants your customers’ questions.',
    href: '/tools/ai-visibility-tracker',
    icon: Sparkles,
    status: 'Beta',
  },
  {
    name: 'Schema Generator',
    tagline: 'Structured data',
    description: 'Google-eligible JSON-LD across 21 schema types, with live completeness scoring.',
    href: '/tools/schema-generator',
    icon: Code2,
  },
  {
    name: 'Sitemap.xml Generator',
    tagline: 'Crawler discovery',
    description: 'Spec-conformant sitemaps with automatic index splitting past 50,000 URLs.',
    href: '/tools/sitemap-xml-generator',
    icon: Network,
  },
  {
    name: 'Sitemap.html Generator',
    tagline: 'Human navigation',
    description: 'A readable, grouped HTML sitemap page for visitors, importable from your XML.',
    href: '/tools/sitemap-html-generator',
    icon: FileCode2,
  },
  {
    name: 'Keyword Density Checker',
    tagline: 'Content balance',
    description: 'Spot over-optimization and topical gaps before search engines do.',
    href: '/tools/keyword-density-checker',
    icon: Gauge,
  },
  {
    name: 'Keyword Research',
    tagline: 'Find what to rank for',
    description: 'Discover keywords, intent and difficulty for your niche.',
    href: '/tools/ai-visibility-tracker/signup',
    icon: Search,
    status: 'Soon',
  },
]

export function ConsultantsSection() {
  return (
    <Section id="products">
      <Container>
        <SectionHeading
          title="One studio, every tool"
          description="Replace a stack of single-purpose tools with one login and one consistent workflow."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link key={p.name} href={p.href} className="group">
              <Card className="flex h-full flex-col transition-colors group-hover:bg-ds-canvas">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-ds-md bg-ds-muted">
                    <p.icon className="h-5 w-5 text-ds-ink" strokeWidth={1.5} />
                  </span>
                  {p.status ? (
                    <span className="rounded-full bg-ds-accent-soft px-2.5 py-0.5 text-[12px] font-medium text-ds-accent">
                      {p.status}
                    </span>
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-ds-ink-3 transition-colors group-hover:text-ds-ink" />
                  )}
                </div>
                <h3 className="mt-6 text-[20px] font-medium leading-7 tracking-[-0.01em] text-ds-ink">{p.name}</h3>
                <p className="mt-1 text-[14px] text-ds-ink-3">{p.tagline}</p>
                <p className="mt-3 text-[16px] leading-6 text-ds-ink-2">{p.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  )
}
