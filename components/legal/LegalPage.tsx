import type { ReactNode } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Container } from "@/components/ds/primitives";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <div className="min-h-screen bg-ds-canvas font-sans text-ds-ink">
      <SiteNav />
      <main>
        <Container className="max-w-[760px] py-12 md:py-20">
          <h1 className="text-[36px] font-normal leading-10 tracking-[-0.02em] md:text-[44px] md:leading-[48px]">{title}</h1>
          <p className="mt-3 text-[14px] text-ds-ink-2">Last updated {updated}</p>
          <div className="mt-10 space-y-8 text-[16px] leading-7 text-ds-ink-2 [&_h2]:mb-3 [&_h2]:text-[20px] [&_h2]:font-medium [&_h2]:text-ds-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:space-y-1">
            {children}
            {contact && (
              <section>
                <h2>Contact</h2>
                <p>
                  Questions about this page? Email <a className="text-ds-accent underline" href={`mailto:${contact}`}>{contact}</a>.
                </p>
              </section>
            )}
          </div>
          <p className="mt-12 text-[14px]">
            <Link href="/" className="text-ds-ink-2 hover:text-ds-ink">← Back to home</Link>
          </p>
        </Container>
      </main>
    </div>
  );
}
