// Rendering: SSG.
// Premium marketing landing — light lavender base, multi-color accents,
// display type, full conversion sections (hero, social proof, features,
// pricing, testimonials, FAQ) and a real footer.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { MarketingNav, MarketingFooter, Logo, PrimaryLink, tint } from "@/components/marketing/MarketingChrome";

// Rendering: ISR — real "by the numbers" stats, refreshed hourly.
export const revalidate = 3600;

// ── Palette ──────────────────────────────────────────
const BG = "#F7F7FC";
const SURFACE = "#FFFFFF";
const INK = "#15152B";
const INK2 = "#5B5B73";
const INK3 = "#9494AE";
const BORDER = "rgba(108,111,223,0.13)";
const LAV = "#6C6FDF";
const TEAL = "#2DD4BF";
const PINK = "#F472B6";
const AMBER = "#F59E0B";
const VIOLET = "#8B6FE0";
const GRAD = "#6C6FDF"; // solid brand fill — no gradients

export default async function LandingPage() {
  const [userCount, taskCount, doneTaskCount] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: "DONE" } }),
  ]);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: BG, color: INK, fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {/* ── ANNOUNCEMENT BAR ─────────────────────────────── */}
      <div
        className="w-full text-center text-xs font-medium py-2 px-4"
        style={{ background: GRAD, color: "#fff" }}
      >
        <i className="fa-solid fa-sparkles mr-1.5" style={{ fontSize: 11 }}></i>
        Klok is in public beta — every feature is free while we build.{" "}
        <Link href="/sign-up" className="underline underline-offset-2 font-semibold">
          Claim your spot →
        </Link>
      </div>

      {/* ── NAV ──────────────────────────────────────────── */}
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative">
        <Glows />
        <div className="relative max-w-5xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-16 text-center" style={{ zIndex: 1 }}>
          <Pill>
            <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: LAV }}></span>
            The honest daily tracker
          </Pill>

          <h1
            className="font-display text-5xl md:text-7xl lg:text-[84px] font-extrabold leading-[1.03] mt-8 mb-7 mx-auto"
            style={{ color: INK, maxWidth: 920 }}
          >
            Plan your day.{" "}
            <span style={{ color: LAV }}>Own your reality.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-[1.55] mb-9" style={{ color: INK2 }}>
            Most planners pretend you&apos;ll do everything. Klok doesn&apos;t. Block out
            your day, track what really happened, and reflect on the gap — guilt-free.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <PrimaryLink href="/sign-up" big>
              Start free <i className="fa-solid fa-arrow-right text-xs"></i>
            </PrimaryLink>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold lift"
              style={{ color: INK, background: SURFACE, border: `1px solid ${BORDER}`, minWidth: 170, justifyContent: "center", boxShadow: "var(--shadow-sm)" }}
            >
              <i className="fa-regular fa-circle-play" style={{ color: LAV }}></i> See how it works
            </a>
          </div>

          {/* micro social proof */}
          <div className="flex items-center justify-center gap-3 text-xs" style={{ color: INK3 }}>
            <div className="flex -space-x-2">
              {[LAV, TEAL, AMBER, PINK].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: c, borderColor: BG }}>
                  {["S", "A", "M", "R"][i]}
                </div>
              ))}
            </div>
            <span>No credit card · Free during beta · Set up in 60 seconds</span>
          </div>
        </div>

        {/* App mockup */}
        <AppMockup />
      </section>

      {/* ── KLOK BY THE NUMBERS ──────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-8" style={{ color: INK3, letterSpacing: "0.12em" }}>
            Klok by the numbers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: userCount.toLocaleString(), label: "People planning", color: LAV },
              { value: taskCount.toLocaleString(), label: "Tasks planned", color: TEAL },
              { value: doneTaskCount.toLocaleString(), label: "Tasks completed", color: AMBER },
              { value: "Free", label: "While in beta", color: PINK },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-extrabold mb-1.5 tabular" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-sm" style={{ color: INK2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (bento) ─────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <SectionHead eyebrow="Features" title="Everything you need. Nothing you don't." sub="Built for honest reflection, not productivity theatre." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* big tile */}
          <BentoCard className="md:col-span-2" color={LAV} icon="fa-calendar-day"
            title="Time-boxed daily tasks"
            body="Plan your day as scheduled tasks — each with a time range, tag, and notes. Mark them done, skipped, or missed, and your day tells its honest story.">
            <MiniBlocks />
          </BentoCard>
          <BentoCard color={TEAL} icon="fa-stopwatch"
            title="Focus timer"
            body="Set a focus goal, break it into sub-items, and run live timers against each. Overtime counts too — no fake numbers." />
          <BentoCard color={AMBER} icon="fa-rotate"
            title="Recurring tasks"
            body="Set a routine once — Klok auto-creates it daily, weekly, or on exactly the days you pick." />
          <BentoCard color={PINK} icon="fa-arrow-right"
            title="Honest carry-forward"
            body="Missed something? Carry it to today with one tap — the miss stays on record, so your history stays true." />
          <BentoCard color={VIOLET} icon="fa-chart-line"
            title="Analytics that teach"
            body="Task completion, time by tag, and focus progress — split by week, month, and year. See the gap, then close it." />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
          <SectionHead eyebrow="How it works" title="Three steps. That's the whole app." sub="No bloated onboarding. No 14-day trial countdown." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: "01", icon: "fa-pen-to-square", color: LAV, title: "Plan your day", body: "Add time-boxed tasks for the day and set a focus goal. Takes a minute." },
              { num: "02", icon: "fa-check-double", color: TEAL, title: "Track as you go", body: "Tick tasks off, run focus timers, mark what slipped. Status updates itself." },
              { num: "03", icon: "fa-chart-simple", color: AMBER, title: "Reflect & repeat", body: "Review your week in Analytics, spot your patterns, and carry what matters forward." },
            ].map((s) => (
              <div key={s.num} className="rounded-2xl p-7 lift" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-display text-sm font-bold px-2.5 py-1 rounded-lg" style={{ background: tint(s.color, 0.1), color: s.color }}>{s.num}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tint(s.color, 0.12) }}>
                    <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 15 }}></i>
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: INK2 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <SectionHead eyebrow="Pricing" title="Free while we're in beta." sub="Every feature is free right now. When paid plans arrive, early users keep a lifetime discount — no card required today." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto items-stretch">
          <PriceCard
            name="Free" price="$0" cadence="forever"
            note="The core planner, always free."
            blurb="Everything you need to plan and track an honest day."
            features={["Unlimited daily tasks", "Week, month & year analytics", "Recurring tasks", "Carry-forward & streaks"]}
            cta="Start free" ctaHref="/sign-up" />
          <PriceCard
            highlight badge="Free in beta" name="Pro" price="$0" cadence="during beta"
            note="Paid later (~$5/mo) — beta users keep a discount."
            blurb="For people who run their whole life in Klok."
            features={["Everything in Free", "Focus timer with sub-items", "Goal tracking & overtime insights", "Data export", "Priority support"]}
            cta="Start free" ctaHref="/sign-up" />
          <PriceCard
            name="Team" price="Coming soon" cadence=""
            note="Shared planning for small teams."
            blurb="Team planning is on the roadmap. Start solo and you'll be first to know."
            features={["Everything in Pro", "Shared templates", "Team analytics", "Admin & billing controls"]}
            cta="Start free" ctaHref="/sign-up" />
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
          <SectionHead eyebrow="Loved by early users" title="People plan honestly with Klok." sub="A few words from the beta." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { q: "I finally stopped feeling like a failure for not finishing my to-do list. Seeing the gap instead of hiding it changed how I plan.", name: "Sana K.", role: "Designer", color: LAV },
              { q: "The analytics genuinely taught me something about myself — the honest gap between what I plan and what I do.", name: "Arjun M.", role: "Founder", color: TEAL },
              { q: "Time-boxed tasks plus the focus timer replaced three apps for me. It's fast and it gets out of the way.", name: "Maya R.", role: "PhD student", color: PINK },
            ].map((t) => (
              <figure key={t.name} className="rounded-2xl p-6 lift" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <div className="flex gap-0.5 mb-4" style={{ color: AMBER }}>
                  {[0, 1, 2, 3, 4].map((i) => <i key={i} className="fa-solid fa-star text-xs"></i>)}
                </div>
                <blockquote className="text-sm leading-relaxed mb-5" style={{ color: INK }}>“{t.q}”</blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: t.color }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: INK }}>{t.name}</div>
                    <div className="text-xs" style={{ color: INK3 }}>{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <SectionHead eyebrow="FAQ" title="Questions, answered." />
        <div className="space-y-3">
          {[
            { q: "Is Klok really free?", a: "Yes — every feature is free while we're in public beta. When we introduce paid plans, early users keep a permanent discount." },
            { q: "Do I need a credit card to start?", a: "No. Sign up with an email or your Google account and you're in. No card, no trial countdown." },
            { q: "What makes Klok different from other planners?", a: "Most apps assume you'll complete everything. Klok is built around the gap between plan and reality, so you can reflect honestly and actually improve — without the guilt." },
            { q: "Can I plan recurring tasks?", a: "Yes. Set a task to repeat once and Klok automatically creates it every day, every week, or on the specific days you pick." },
            { q: "Is my data private?", a: "Your data is yours. It's stored securely and never sold. You can export or permanently delete your account at any time from Settings." },
            { q: "Does it work on mobile?", a: "Klok is fully responsive and works in any mobile browser, with a dedicated bottom navigation. Native apps are on the roadmap." },
          ].map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                {f.q}
                <i className="fa-solid fa-chevron-down faq-chev text-xs"></i>
              </summary>
              <div className="faq-body">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-24">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden text-center px-6 py-20 md:py-24" style={{ background: GRAD }}>
          <div className="relative" style={{ zIndex: 1 }}>
            <h2 className="font-display text-4xl md:text-6xl font-extrabold mb-5 text-white">Plan your first honest day.</h2>
            <p className="text-lg mb-9 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.88)" }}>
              Free during beta. Set up in under a minute.
            </p>
            <Link href="/sign-up" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold lift"
              style={{ background: "#fff", color: LAV, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
              Get started free <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <MarketingFooter />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Subcomponents
// ══════════════════════════════════════════════════════

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "rgba(108,111,223,0.09)", border: "1px solid rgba(108,111,223,0.22)", color: LAV }}>
      {children}
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-14 text-center max-w-2xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: LAV, letterSpacing: "0.12em" }}>{eyebrow}</p>
      <h2 className="font-display text-4xl md:text-5xl font-extrabold" style={{ color: INK }}>{title}</h2>
      {sub && <p className="text-base md:text-lg mt-4" style={{ color: INK2 }}>{sub}</p>}
    </div>
  );
}

function BentoCard({ color, icon, title, body, children, className = "" }: { color: string; icon: string; title: string; body: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-7 lift flex flex-col ${className}`} style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "var(--shadow-sm)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: tint(color, 0.12) }}>
        <i className={`fa-solid ${icon}`} style={{ color, fontSize: 17 }}></i>
      </div>
      <h3 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: INK2 }}>{body}</p>
      {children}
    </div>
  );
}

function MiniBlocks() {
  const rows = [
    { e: "☀️", t: "Morning Routine", c: TEAL, s: "Done" },
    { e: "📚", t: "Deep Work", c: LAV, s: "Now" },
    { e: "🏃", t: "Run · 5km", c: PINK, s: "Missed" },
  ];
  return (
    <div className="mt-6 space-y-2">
      {rows.map((r) => (
        <div key={r.t} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${r.c}` }}>
          <span className="text-xs font-semibold" style={{ color: INK }}>{r.e} {r.t}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: tint(r.c, 0.14), color: r.c }}>{r.s}</span>
        </div>
      ))}
    </div>
  );
}

function PriceCard({ name, price, cadence, blurb, features, cta, ctaHref, highlight, badge, note }: { name: string; price: string; cadence: string; blurb: string; features: string[]; cta: string; ctaHref: string; highlight?: boolean; badge?: string; note?: string }) {
  return (
    <div className="rounded-2xl p-7 flex flex-col lift relative"
      style={{ background: highlight ? SURFACE : BG, border: highlight ? `2px solid ${LAV}` : `1px solid ${BORDER}`, boxShadow: highlight ? "var(--shadow-lg)" : "var(--shadow-sm)" }}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full text-white whitespace-nowrap" style={{ background: GRAD }}>
          {badge}
        </span>
      )}
      <div className="font-display text-lg font-bold mb-1" style={{ color: INK }}>{name}</div>
      <p className="text-sm mb-5" style={{ color: INK2 }}>{blurb}</p>
      <div className="flex items-end gap-1 mb-1">
        <span className="font-display text-4xl font-extrabold" style={{ color: INK }}>{price}</span>
        {cadence && <span className="text-sm mb-1.5" style={{ color: INK3 }}>{cadence}</span>}
      </div>
      <p className="text-xs mb-5 min-h-[16px]" style={{ color: INK3 }}>{note ?? ""}</p>
      <ul className="space-y-2.5 mb-7 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: INK2 }}>
            <i className="fa-solid fa-check mt-0.5" style={{ color: TEAL, fontSize: 12 }}></i>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaHref} className="text-center px-4 py-3 rounded-xl text-sm font-bold lift"
        style={highlight ? { background: GRAD, color: "#fff", boxShadow: "0 8px 22px rgba(108,111,223,0.35)" } : { background: SURFACE, color: INK, border: `1px solid ${BORDER}` }}>
        {cta}
      </Link>
    </div>
  );
}

function AppMockup() {
  return (
    <div className="relative max-w-6xl mx-auto px-6 md:px-10 pb-24" style={{ zIndex: 1 }}>
      <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ border: "1px solid rgba(108,111,223,0.2)", background: SURFACE, maxWidth: 1080, boxShadow: "0 50px 100px -28px rgba(108,111,223,0.4), 0 0 80px rgba(108,111,223,0.12)" }}>
        <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "rgba(108,111,223,0.05)", borderBottom: `1px solid ${BORDER}` }}>
          <span className="w-3 h-3 rounded-full" style={{ background: PINK }}></span>
          <span className="w-3 h-3 rounded-full" style={{ background: AMBER }}></span>
          <span className="w-3 h-3 rounded-full" style={{ background: TEAL }}></span>
          <span className="ml-4 text-xs px-4 py-0.5 rounded-md" style={{ background: SURFACE, color: INK3, border: `1px solid ${BORDER}` }}>klok.app/today</span>
        </div>
        <div className="flex" style={{ background: BG, minHeight: 420 }}>
          <div className="w-48 flex-shrink-0 hidden sm:flex flex-col p-3 gap-1" style={{ background: SURFACE, borderRight: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <Logo />
              <span className="font-display text-sm font-bold" style={{ color: INK }}>Klok</span>
            </div>
            {[["Dashboard", false], ["Today's Log", true], ["Analytics", false], ["Templates", false]].map(([label, active]) => (
              <div key={label as string} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs"
                style={{ background: active ? "rgba(108,111,223,0.12)" : "transparent", color: active ? LAV : INK3, fontWeight: active ? 600 : 400 }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: active ? LAV : "rgba(21,21,43,0.12)" }}></div>
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-display text-base font-bold mb-0.5" style={{ color: INK }}>Today&apos;s Log</div>
                <div className="text-xs" style={{ color: INK3 }}>Wednesday, 17 June 2026</div>
              </div>
              <div className="px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ background: GRAD, boxShadow: "0 4px 12px rgba(108,111,223,0.3)" }}>+ Add Task</div>
            </div>
            <div className="space-y-2.5">
              <MockRow emoji="☀️" title="Morning Routine" meta="07:00 – 08:00 · Personal" badge="Done" accent={TEAL} />
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: "rgba(108,111,223,0.08)", border: "1px solid rgba(108,111,223,0.25)", borderLeft: `3px solid ${LAV}` }}>
                <div>
                  <div className="text-xs font-semibold mb-0.5 flex items-center gap-1.5" style={{ color: INK }}>
                    📚 Deep Work
                    <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: LAV }}></span>
                  </div>
                  <div className="text-[10px]" style={{ color: INK3 }}>09:00 – 11:00 · Focus timer running</div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: "rgba(108,111,223,0.16)", color: LAV }}>Now</span>
              </div>
              <MockRow emoji="🏃" title="Workout" meta="11:30 – 12:30 · Exercise" badge="Missed" accent={PINK} />
              <MockRow emoji="🎯" title="Project Review" meta="14:00 – 16:00 · Work" accent="rgba(21,21,43,0.25)" badge="Upcoming" muted />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockRow({ emoji, title, meta, badge, accent, muted }: { emoji: string; title: string; meta: string; badge: string; accent: string; muted?: boolean }) {
  return (
    <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${accent}` }}>
      <div>
        <div className="text-xs font-semibold mb-0.5" style={{ color: INK }}>{emoji} {title}</div>
        <div className="text-[10px]" style={{ color: INK3 }}>{meta}</div>
      </div>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: muted ? "rgba(21,21,43,0.05)" : tint(accent, 0.14), color: accent }}>{badge}</span>
    </div>
  );
}

function Glows() {
  // No gradients — kept as a no-op so the hero markup stays stable.
  return null;
}
