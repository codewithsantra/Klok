// Shared marketing chrome (nav + footer) used by the landing page and all
// public marketing/legal pages. Keeping it in one place means footer links,
// branding, and theme stay consistent everywhere.

import Link from "next/link";

// ── Shared marketing palette ──────────────────────────
export const M = {
  BG: "#F7F7FC",
  SURFACE: "#FFFFFF",
  INK: "#15152B",
  INK2: "#5B5B73",
  INK3: "#9494AE",
  BORDER: "rgba(108,111,223,0.13)",
  LAV: "#6C6FDF",
  LAV2: "#9B9EEF",
  TEAL: "#2DD4BF",
  PINK: "#F472B6",
  AMBER: "#F59E0B",
  VIOLET: "#8B6FE0",
  // Solid brand fill — no gradients.
  GRAD: "#6C6FDF",
  GRAD_H: "#5558CC",
};

// rgba tint from a hex, or passthrough for rgba()/rgb() strings
export function tint(color: string, alpha: number): string {
  if (color.startsWith("rgba") || color.startsWith("rgb")) return color;
  const h = color.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function Logo() {
  return (
    <div
      className="w-7 h-7 flex items-center justify-center flex-shrink-0"
      style={{ background: M.GRAD, borderRadius: 7, boxShadow: "0 4px 12px rgba(108,111,223,0.4)" }}
    >
      <i className="fa-solid fa-calendar-check text-white" style={{ fontSize: 12 }}></i>
    </div>
  );
}

export function PrimaryLink({ href, children, big }: { href: string; children: React.ReactNode; big?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl font-bold lift justify-center ${big ? "px-7 py-3.5 text-sm" : "px-4 py-2 text-sm"}`}
      style={{ background: M.GRAD, color: "#fff", minWidth: big ? 170 : undefined, boxShadow: "0 8px 22px rgba(108,111,223,0.4)" }}
    >
      {children}
    </Link>
  );
}

export function MarketingNav() {
  const links = [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ];
  return (
    <nav
      className="sticky top-0 z-30"
      style={{
        background: "rgba(247,247,252,0.78)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${M.BORDER}`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between" style={{ height: 60 }}>
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-lg font-extrabold" style={{ color: M.INK }}>Klok</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ color: M.INK2 }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="px-3 py-2 text-sm font-medium rounded-lg" style={{ color: M.INK2 }}>Sign in</Link>
          <PrimaryLink href="/sign-up">Start free</PrimaryLink>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  const cols = [
    { title: "Product", links: [["Features", "/#features"], ["Pricing", "/#pricing"], ["How it works", "/#how"], ["Sign in", "/sign-in"]] },
    { title: "Company", links: [["About", "/about"], ["Roadmap", "/about#roadmap"], ["Contact", "/contact"]] },
    { title: "Resources", links: [["FAQ", "/#faq"], ["Get started", "/sign-up"]] },
    { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"]] },
  ];
  return (
    <footer style={{ borderTop: `1px solid ${M.BORDER}`, background: M.SURFACE }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Logo />
              <span className="font-display text-lg font-extrabold" style={{ color: M.INK }}>Klok</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4" style={{ color: M.INK2, maxWidth: 260 }}>
              The honest daily tracker. Plan in blocks, track reality, reflect without guilt.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: M.INK3, letterSpacing: "0.06em" }}>{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: M.INK2 }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8" style={{ borderTop: `1px solid ${M.BORDER}` }}>
          <p className="text-xs" style={{ color: M.INK3 }}>© {new Date().getFullYear()} Klok. All rights reserved.</p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: M.INK3 }}>
            Made with <i className="fa-solid fa-heart" style={{ color: M.PINK, fontSize: 10 }}></i> for people who plan honestly.
          </p>
        </div>
      </div>
    </footer>
  );
}
