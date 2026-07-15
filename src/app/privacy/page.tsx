// Rendering: SSG. Public privacy policy.
import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Klok collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="17 June 2026"
      intro="Your data is yours. This policy explains what we collect, why, and the control you have over it."
    >
      <LegalSection heading="1. Information we collect">
        <p>
          Klok accounts are managed by our authentication provider,{" "}
          <strong>Clerk</strong>, which securely handles your sign-in credentials
          (email and password, or Google sign-in) — Klok never sees or stores your
          password. We keep your <strong>email address</strong> and display name to
          identify your account. As you use the product we store the content you
          create — tasks, focus timer sessions, tags, and templates — so we can show
          it back to you.
        </p>
        <p>
          We also collect basic technical data (such as browser type and approximate region from
          your IP address) to keep the service secure and reliable.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use your information">
        <p>We use your information only to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Provide and maintain your account and your daily logs.</li>
          <li>Authenticate you and keep your account secure.</li>
          <li>Improve the product and fix issues.</li>
          <li>Send essential service messages (we do not send marketing email without consent).</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. What we never do">
        <p>
          We do not sell your personal data. We do not share your private logs with third parties
          for advertising. Your planning data is not used to train external models.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data storage & security">
        <p>
          Your planning data is stored in a managed PostgreSQL database. Authentication and
          credential storage are handled by Clerk under their own security practices — Klok
          does not store passwords. We use HTTPS for all traffic.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          You can view and edit your data at any time inside the app. From <strong>Settings</strong>
          you can export all of your data as JSON, or permanently delete your account — which
          removes all of your tasks, timer sessions, tags, and templates, and deletes your
          identity from our authentication provider.
        </p>
      </LegalSection>

      <LegalSection heading="6. Cookies">
        <p>
          We use a small number of essential cookies to keep you signed in and remember your theme.
          See our <a href="/cookies" style={{ color: "#6C6FDF", fontWeight: 600 }}>Cookie Policy</a> for details.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes to this policy">
        <p>
          We may update this policy as the product evolves. Material changes will be reflected in the
          &ldquo;last updated&rdquo; date above and, where appropriate, communicated in-app.
        </p>
      </LegalSection>

      <LegalSection heading="8. Your controls &amp; contact">
        <p>
          You can export or permanently delete all of your data at any time from
          your account Settings — no request needed. Klok is in public beta; a
          dedicated privacy contact will be published here as we exit beta.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
