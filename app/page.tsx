import { SiteNav } from '@/components/SiteNav'
import { HeroSection } from '@/components/HeroSection'
import { TrustedBy } from '@/components/TrustedBy'
import { ConsultantsSection } from '@/components/ConsultantsSection'
import { CraftExperiences } from '@/components/CraftExperiences'
import { Testimonials } from '@/components/Testimonials'
import { BenefitsSection } from '@/components/BenefitsSection'
import { TeamSection } from '@/components/TeamSection'
import { DeFiArchitectureSection } from '@/components/DeFiArchitectureSection'
import { FAQFooterSection } from '@/components/FAQFooterSection'

/** Landing page — composed from design-system primitives (see DESIGN-SYSTEM.md). */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ds-canvas font-sans text-ds-ink">
      <SiteNav />
      <main>
        <HeroSection />
        <TrustedBy />
        <ConsultantsSection />
        <CraftExperiences />
        <Testimonials />
        <BenefitsSection />
        <TeamSection />
        <DeFiArchitectureSection />
        <FAQFooterSection />
      </main>
    </div>
  )
}
