import { Check } from 'lucide-react'
import { ButtonLink, Card, Container, Section, SectionHeading } from '@/components/ds/primitives'

/** Pricing section. Limits come from PLAN_LIMITS (lib/types.ts); Pro price is intentionally not shown until billing exists. */
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    note: 'forever',
    features: ['All free SEO tools', '1 brand, 3 tracked prompts', '1 competitor', 'Weekly refresh'],
    cta: 'Start free',
    variant: 'primary' as const,
  },
  {
    name: 'Pro',
    price: 'Soon',
    note: 'pricing announced at launch',
    features: ['Everything in Free', '10 tracked prompts', '2 competitors', 'Daily refresh'],
    cta: 'Join the waitlist',
    variant: 'secondary' as const,
  },
]

export function DeFiArchitectureSection() {
  return (
    <Section id="pricing">
      <Container>
        <SectionHeading title="Simple pricing" description="Start free. Upgrade when your tracking needs outgrow it." />
        <div className="mx-auto mt-12 grid max-w-[760px] gap-4 md:grid-cols-2">
          {PLANS.map((p) => (
            <Card key={p.name} className="flex flex-col p-8">
              <h3 className="text-[18px] font-medium text-ds-ink">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[36px] font-normal leading-10 tracking-[-0.02em] text-ds-ink">{p.price}</span>
                <span className="text-[14px] text-ds-ink-2">{p.note}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[16px] text-ds-ink">
                    <Check className="h-4 w-4 shrink-0 text-ds-success" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/tools/ai-visibility-tracker/signup"
                variant={p.variant}
                size="lg"
                className="mt-8 w-full"
              >
                {p.cta}
              </ButtonLink>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
