import { Card, Container, Section, SectionHeading, StatTile } from '@/components/ds/primitives'
import { Reveal } from '@/components/ds/motion'

/** Real product facts in the Explee "result card" format. Swap for customer results once there are real ones. */
const CARDS = [
  {
    title: 'Schema Generator',
    body: 'Structured data that Google can use for rich results, scored as you build it.',
    stats: [
      { value: '21', label: 'schema types' },
      { value: 'Live', label: 'completeness score' },
    ],
  },
  {
    title: 'Sitemap Generators',
    body: 'XML for crawlers and HTML for people, from a pasted list. No crawl, no URL cap.',
    stats: [
      { value: '50k', label: 'URLs per file' },
      { value: 'Auto', label: 'index splitting' },
    ],
  },
  {
    title: 'AI Visibility Tracker',
    body: 'Mention and citation checks on your prompts, with one competitor side by side.',
    stats: [
      { value: '3 → 10', label: 'prompts, free → pro' },
      { value: '7d → 1d', label: 'refresh, free → pro' },
    ],
  },
]

export function ResultCards() {
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading title="What you get out of it" />
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} className="h-full">
            <Card className="flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ds-ink/20">
              <h3 className="text-[18px] font-medium text-ds-ink">{c.title}</h3>
              <p className="mt-2 flex-1 text-[16px] leading-6 text-ds-ink-2">{c.body}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {c.stats.map((s) => (
                  <StatTile key={s.label} value={s.value} label={s.label} />
                ))}
              </div>
            </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
