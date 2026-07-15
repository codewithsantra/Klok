// Rendering: SSG. Public terms of service.
import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Klok.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      updated="17 June 2026"
      intro="By using Klok you agree to these terms. We've kept them as plain as we can."
    >
      <LegalSection heading="1. Acceptance of terms">
        <p>
          By creating an account or using Klok (&ldquo;the service&rdquo;), you agree to be bound by
          these Terms of Service and our{" "}
          <a href="/privacy" style={{ color: "#6C6FDF", fontWeight: 600 }}>Privacy Policy</a>. If you
          do not agree, please do not use the service.
        </p>
      </LegalSection>

      <LegalSection heading="2. Your account">
        <p>
          You are responsible for keeping your login credentials secure and for all activity under
          your account. You must provide accurate information and be at least 13 years old to use Klok.
        </p>
      </LegalSection>

      <LegalSection heading="3. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Use the service for any unlawful purpose.</li>
          <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the service.</li>
          <li>Abuse, automate, or overload the service in a way that degrades it for others.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Your content">
        <p>
          You retain ownership of the content you create in Klok. You grant us the limited permission
          needed to store and display that content back to you as part of operating the service.
        </p>
      </LegalSection>

      <LegalSection heading="5. Beta service">
        <p>
          Klok is currently in beta. Features may change, break, or be removed, and the service is
          provided &ldquo;as is&rdquo; without warranties of any kind. We work hard to protect your
          data, but we recommend keeping your own records of anything critical.
        </p>
      </LegalSection>

      <LegalSection heading="6. Pricing & plans">
        <p>
          During beta, all features are free. If we introduce paid plans, we will give clear notice
          before any charge applies, and early users will receive the benefits described at sign-up.
        </p>
      </LegalSection>

      <LegalSection heading="7. Termination">
        <p>
          You may delete your account at any time from Settings. We may suspend or terminate accounts
          that violate these terms. On termination, your data is deleted as described in our Privacy
          Policy.
        </p>
      </LegalSection>

      <LegalSection heading="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Klok shall not be liable for any indirect,
          incidental, or consequential damages arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Klok is in public beta. A contact address for questions about these
          terms will be published here as we exit beta.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
