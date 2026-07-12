// Rendering: SSG. Public contact page.
import type { Metadata } from "next";
import { LegalShell } from "@/components/marketing/LegalShell";
import { M } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Klok team.",
};

const METHODS = [
  {
    icon: "fa-envelope",
    color: M.LAV,
    title: "Email us",
    body: "The fastest way to reach us. We usually reply within a day.",
    action: "hello@klok.app",
    href: "mailto:hello@klok.app",
  },
  {
    icon: "fa-life-ring",
    color: M.TEAL,
    title: "Support",
    body: "Found a bug or need help with your account?",
    action: "support@klok.app",
    href: "mailto:support@klok.app",
  },
];

export default function ContactPage() {
  return (
    <LegalShell
      title="Get in touch"
      intro="Questions, feedback, or partnership ideas? We'd love to hear from you."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {METHODS.map((m) => (
          <a
            key={m.title}
            href={m.href}
            target={m.href.startsWith("http") ? "_blank" : undefined}
            rel={m.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-2xl p-6 lift block"
            style={{ background: M.SURFACE, border: `1px solid ${M.BORDER}`, boxShadow: "var(--shadow-sm)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${m.color}22` }}>
              <i className={`fa-solid ${m.icon}`} style={{ color: m.color, fontSize: 17 }}></i>
            </div>
            <h2 className="font-display text-base font-bold mb-1" style={{ color: M.INK }}>{m.title}</h2>
            <p className="text-sm mb-3 leading-relaxed" style={{ color: M.INK2 }}>{m.body}</p>
            <span className="text-sm font-semibold" style={{ color: m.color }}>{m.action} →</span>
          </a>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: M.SURFACE, border: `1px solid ${M.BORDER}` }}>
        <p className="text-sm leading-relaxed" style={{ color: M.INK2 }}>
          Looking for quick answers first? Many common questions are covered on our{" "}
          <a href="/#faq" style={{ color: M.LAV, fontWeight: 600 }}>FAQ</a>. For anything about your
          data or account, see our{" "}
          <a href="/privacy" style={{ color: M.LAV, fontWeight: 600 }}>Privacy Policy</a>.
        </p>
      </div>
    </LegalShell>
  );
}
