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
          When you create a Klok account we collect your <strong>email address</strong> and a
          securely hashed password. As you use the product we store the content you create —
          time blocks, todos, tags, templates, and recurring rules — so we can show it back to you.
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
          Your data is stored in a managed PostgreSQL database. Passwords are hashed with bcrypt and
          are never stored in plain text. We use HTTPS for all traffic and httpOnly cookies for
          sessions.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          You can view and edit your data at any time inside the app. From <strong>Settings</strong>
          you can permanently delete your account, which cascade-deletes all of your blocks, todos,
          tags, and templates. Depending on your region you may also have rights to access or export
          your data — contact us and we&apos;ll help.
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

      <LegalSection heading="8. Contact">
        <p>
          Questions about your privacy? Reach us at{" "}
          <a href="mailto:hello@klok.app" style={{ color: "#6C6FDF", fontWeight: 600 }}>hello@klok.app</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
