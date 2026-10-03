import { Check } from 'lucide-react'
import { Card, Container, Section, SectionHeading } from '@/components/ds/primitives'

const STEPS = [
  {
    title: 'Make your site machine-readable',
    body: 'Generate schema markup and sitemaps that search engines and AI crawlers can actually parse, then score them for completeness.',
    points: ['21 schema types, Google rich-result rules', 'Sitemap index splitting at 50,000 URLs', 'Validate existing markup and XML'],
  },
  {
    title: 'Balance your content',
    body: 'Check keyword and topic distribution without the fake “ideal density” gauge. See stuffing risk and gaps instead.',
    points: ['1–3 word phrase analysis', 'Stuffing-risk detection', 'Readability scoring'],
  },
  {
    title: 'Track AI-search visibility',
    body: 'Pick the questions your customers ask. We check whether AI answers mention or cite you, and a named competitor, over time.',
    points: ['Mention and citation detection', 'Competitor comparison', 'Weekly or daily refresh'],
  },
]

export function WorkflowSteps() {
  return (
    <Section className="bg-ds-surface">
      <Container>
        <SectionHeading
          title="From technical SEO to AI answers"
          description="Three steps, one workflow. Start with the basics, then see how AI search sees you."
        />
        <div className="mt-14 space-y-6">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="grid items-center gap-8 rounded-ds-lg border border-ds-line bg-ds-canvas p-6 md:grid-cols-2 md:p-10"
            >
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                <span className="text-[14px] font-medium text-ds-accent">Step {i + 1}</span>
                <h3 className="mt-2 text-[28px] font-normal leading-9 tracking-[-0.02em] text-ds-ink">{s.title}</h3>
                <p className="mt-3 text-[18px] leading-7 text-ds-ink-2">{s.body}</p>
              </div>
              <Card className="space-y-3">
                {s.points.map((pt) => (
                  <div key={pt} className="flex items-center gap-3 rounded-xl bg-ds-muted px-4 py-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ds-success/10">
                      <Check className="h-3 w-3 text-ds-success" strokeWidth={2.5} />
                    </span>
                    <span className="text-[16px] text-ds-ink">{pt}</span>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
