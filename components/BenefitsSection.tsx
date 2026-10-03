import { Card, Container, Section, SectionHeading } from '@/components/ds/primitives'

const BENEFITS = [
  {
    title: 'One login, every tool',
    body: 'Your workspaces, exports and tracked brands live in a single dashboard instead of five tabs and five subscriptions.',
  },
  {
    title: 'Built for AI search',
    body: 'Classic SEO tools stop at Google rankings. We also measure whether AI assistants mention and cite you.',
  },
  {
    title: 'Honest numbers',
    body: 'No invented “ideal density” targets and no vanity scores. Every metric shows how it was calculated.',
  },
]

export function BenefitsSection() {
  return (
    <Section>
      <Container>
        <SectionHeading title="Three things nobody else bundles" />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Card key={b.title}>
              <span className="font-mono text-[13px] text-ds-ink-3">0{i + 1}</span>
              <h3 className="mt-4 text-[20px] font-medium leading-7 tracking-[-0.01em] text-ds-ink">{b.title}</h3>
              <p className="mt-2 text-[16px] leading-6 text-ds-ink-2">{b.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
