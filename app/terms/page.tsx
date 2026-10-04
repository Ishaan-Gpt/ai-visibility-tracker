import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service", description: "The terms for using OMNI SEO." };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="4 October 2026">
      <section>
        <h2>Using the service</h2>
        <p>
          By creating an account or using OMNI SEO you agree to these terms. You must provide accurate information, keep
          your credentials secure and be responsible for activity on your account.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not use the tools to attack, overload or scan systems you do not own or have permission to test.</li>
          <li>Do not try to bypass plan limits, rate limits or security controls.</li>
          <li>Do not resell or republish the service output as a competing product.</li>
        </ul>
      </section>
      <section>
        <h2>Plans and billing</h2>
        <p>
          The Free plan is provided at no charge with the limits shown in the product. Paid plans renew until cancelled
          and are billed through our payment provider. Limits and prices may change with notice.
        </p>
      </section>
      <section>
        <h2>Accuracy of results</h2>
        <p>
          SEO and AI-search results are estimates based on third-party data and model outputs and can change at any time.
          Intent labels are heuristic. We do not guarantee rankings, traffic, citations or revenue.
        </p>
      </section>
      <section>
        <h2>Availability and liability</h2>
        <p>
          The service is provided &ldquo;as is&rdquo;. To the extent permitted by law, we are not liable for indirect or
          consequential losses, and our total liability is limited to the amount you paid in the previous 12 months.
        </p>
      </section>
      <section>
        <h2>Termination</h2>
        <p>You can stop using the service at any time. We may suspend accounts that break these terms.</p>
      </section>
    </LegalPage>
  );
}
