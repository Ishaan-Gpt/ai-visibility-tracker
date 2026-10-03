import { Building2, Rocket, UserRound } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ds/primitives'

const AUDIENCES = [
  {
    icon: Building2,
    title: 'Agencies',
    body: 'Run technical SEO and AI-visibility reporting for many clients from one place.',
  },
  {
    icon: UserRound,
    title: 'In-house marketers',
    body: 'Ship schema, sitemaps and content checks yourself without waiting on a developer.',
  },
  {
    icon: Rocket,
    title: 'Founders',
    body: 'Get found by Google and by AI assistants from day one, on a free tier.',
  },
]

export function TeamSection() {
  return (
    <Section className="bg-ds-surface">
      <Container>
        <SectionHeading title="Built for people who own their search" />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="text-center md:text-left">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-ds-md bg-ds-muted md:mx-0">
                <a.icon className="h-5 w-5 text-ds-ink" strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 text-[20px] font-medium text-ds-ink">{a.title}</h3>
              <p className="mt-2 text-[16px] leading-6 text-ds-ink-2">{a.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
