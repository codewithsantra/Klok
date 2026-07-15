// Shared shell for legal / simple content pages (Privacy, Terms, Cookies).
// Wraps content in the marketing nav + footer with a consistent header and
// readable prose column.

import { MarketingNav, MarketingFooter, M } from "./MarketingChrome";

export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: M.BG, color: M.INK, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-24">
        <header className="mb-10 pb-8" style={{ borderBottom: `1px solid ${M.BORDER}` }}>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-3" style={{ color: M.INK }}>{title}</h1>
          {updated && (
            <p className="text-sm" style={{ color: M.INK3 }}>Last updated {updated}</p>
          )}
          {intro && (
            <p className="text-base md:text-lg mt-5 leading-relaxed" style={{ color: M.INK2 }}>{intro}</p>
          )}
        </header>
        <div className="prose-legal">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="font-display text-xl font-bold mb-3" style={{ color: M.INK }}>{heading}</h2>
      <div className="space-y-3 text-sm md:text-[15px] leading-relaxed" style={{ color: M.INK2 }}>{children}</div>
    </section>
  );
}
