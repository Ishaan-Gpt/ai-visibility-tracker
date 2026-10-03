import { Container } from '@/components/ds/primitives'

const SURFACES = ['Google Search', 'Gemini', 'ChatGPT (soon)', 'Perplexity (soon)', 'Schema.org', 'Search Console']

/** "Built around" strip — names only platforms the product actually targets; no customer logos until real ones exist. */
export function WorksWith() {
  return (
    <Container className="py-10">
      <p className="text-center text-[14px] text-ds-ink-2">Built around the surfaces your customers search on</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {SURFACES.map((s) => (
          <span key={s} className="text-[16px] font-medium tracking-[-0.01em] text-ds-ink-3">
            {s}
          </span>
        ))}
      </div>
    </Container>
  )
}
