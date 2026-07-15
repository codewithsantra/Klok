// Rendering: SSG. Public cookie policy.
import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How and why Klok uses cookies.",
};

export default function CookiesPage() {
  return (
    <LegalShell
      title="Cookie Policy"
      updated="17 June 2026"
      intro="Klok uses only the cookies it needs to work. No advertising or cross-site tracking cookies."
    >
      <LegalSection heading="1. What are cookies?">
        <p>
          Cookies are small text files stored in your browser. They let a website remember things
          between visits — like whether you&apos;re signed in.
        </p>
      </LegalSection>

      <LegalSection heading="2. Cookies we use">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Session cookie (essential).</strong> An httpOnly cookie that keeps you securely
            signed in. Without it, you&apos;d have to log in on every page.
          </li>
          <li>
            <strong>Theme preference (functional).</strong> A small value remembering whether you
            chose light or dark mode. This is stored locally in your browser.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. What we don't use">
        <p>
          We do not use third-party advertising cookies, marketing pixels, or cross-site tracking.
          We do not sell data gathered through cookies.
        </p>
      </LegalSection>

      <LegalSection heading="4. Managing cookies">
        <p>
          You can clear or block cookies through your browser settings. Note that blocking the
          essential session cookie will prevent you from staying signed in to Klok.
        </p>
      </LegalSection>

      <LegalSection heading="5. Contact">
        <p>
          Klok is in public beta. A contact address for policy questions will be
          published here as we exit beta.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
