import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "How OMNI SEO collects, uses and protects your data." };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="4 October 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account data: your email address and sign-in identifiers, handled by Firebase Authentication (including Google sign-in if you use it).</li>
          <li>Workspace data you enter: brand name, domain, competitors, tracked prompts, saved keyword lists, and the inputs you provide to our tools.</li>
          <li>Results we generate for you: AI-visibility check results, rollups and audit outputs.</li>
          <li>Usage counters (for example, tool runs per day) to enforce plan limits and prevent abuse.</li>
          <li>If you subscribe to our newsletter, your email address.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          To provide and improve the service, enforce limits, keep it secure, process payments and, if you opted in,
          send product updates. We do not sell your personal data.
        </p>
      </section>
      <section>
        <h2>Service providers</h2>
        <p>We share only what is needed with the providers that run the service:</p>
        <ul>
          <li>Google Firebase and Google Cloud: authentication and database hosting.</li>
          <li>Google Gemini API: your tracked prompts are sent to generate AI-visibility results.</li>
          <li>DataForSEO (when enabled): keywords you research are sent to retrieve search volume data.</li>
          <li>Razorpay (when enabled): payment processing. We do not store your card details.</li>
          <li>Vercel: application hosting and request logs.</li>
        </ul>
      </section>
      <section>
        <h2>Pages you ask us to analyse</h2>
        <p>
          When you run Page Audit or AI Crawler Check, our servers fetch the public URL you enter, identifying
          as OMNI-SEO-Bot. We do not fetch private or internal addresses.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>We use a single essential session cookie to keep you signed in. We do not use advertising cookies.</p>
      </section>
      <section>
        <h2>Retention and your rights</h2>
        <p>
          We keep your data while your account is active. You can ask us to access, correct or delete your data at any
          time, and you can unsubscribe from emails using the link in any message.
        </p>
      </section>
    </LegalPage>
  );
}
