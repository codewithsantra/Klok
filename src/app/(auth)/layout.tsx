import Link from "next/link";

const VALUE_PROPS = [
  { icon: "fa-calendar-day", text: "Plan your day as honest, time-boxed tasks" },
  { icon: "fa-stopwatch", text: "Run focus timers against real goals" },
  { icon: "fa-chart-simple", text: "See plan vs reality — and actually improve" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* ── Brand panel (desktop only) ─────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[44%] max-w-[560px] p-12 xl:p-16 flex-shrink-0"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.16)", borderRadius: 8 }}
          >
            <i className="fa-solid fa-calendar-check text-white text-sm"></i>
          </div>
          <span className="font-display text-xl font-extrabold">Klok</span>
        </Link>

        <div>
          <h2 className="font-display text-3xl xl:text-4xl font-extrabold leading-tight mb-8">
            Plan honestly.
            <br />
            Live intentionally.
          </h2>
          <ul className="space-y-4">
            {VALUE_PROPS.map((v) => (
              <li key={v.text} className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.16)" }}
                >
                  <i className={`fa-solid ${v.icon} text-sm`}></i>
                </span>
                <span className="text-[15px]" style={{ color: "rgba(255,255,255,0.92)" }}>
                  {v.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <figure
          className="rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}
        >
          <blockquote className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
            “I finally stopped feeling like a failure for not finishing my list. Klok changed how I plan.”
          </blockquote>
          <figcaption className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>
              S
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
              Sana K. · Designer
            </span>
          </figcaption>
        </figure>
      </aside>

      {/* ── Form column ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md my-8">
          {/* Logo (mobile / small screens) */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 cursor-pointer">
              <div
                className="w-9 h-9 flex items-center justify-center"
                style={{ background: "var(--accent)", borderRadius: 8 }}
              >
                <i className="fa-solid fa-calendar-check text-sm text-white"></i>
              </div>
              <span className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                Klok
              </span>
            </Link>
          </div>

          {children}

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-3)" }}>
            By continuing you agree to our{" "}
            <Link href="/terms" className="hover:underline" style={{ color: "var(--text-2)" }}>Terms</Link>{" "}
            &amp;{" "}
            <Link href="/privacy" className="hover:underline" style={{ color: "var(--text-2)" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
