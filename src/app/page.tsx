// Rendering: SSG (Static Site Generation).
// This is a marketing landing page with no per-request data. Next.js
// statically generates the HTML at build time and serves it as a static
// asset on every request. Fastest possible page load.

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#ECECF8] overflow-y-auto">
      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className="sticky top-0 z-30 backdrop-blur-md bg-[#ECECF8]/80 border-b border-[#E5E7EB]/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#6C6FDF] rounded-xl flex items-center justify-center shadow-md shadow-[#6C6FDF]/40">
              <i className="fa-solid fa-calendar-check text-white text-sm"></i>
            </div>
            <span className="text-xl font-extrabold text-[#1A1A2E]">Klok</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="#features"
              className="btn btn-ghost px-4 hidden md:inline-flex"
            >
              Features
            </Link>
            <Link
              href="#how"
              className="btn btn-ghost px-4 hidden md:inline-flex"
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="btn btn-ghost px-4 hidden sm:inline-flex"
            >
              About
            </Link>
            <Link href="/sign-in" className="btn btn-ghost px-4">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="btn btn-primary shadow-md shadow-[#6C6FDF]/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-[#EEEEFF] px-4 py-2 rounded-full text-sm font-semibold text-[#6C6FDF] shadow-sm mb-8">
          <i className="fa-solid fa-sparkles text-xs"></i>
          The honest daily tracker
        </div>

        <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-[#1A1A2E] mb-6">
          Plan Your Day.
          <br />
          <span className="grad-text">Own Your Reality.</span>
        </h1>

        <p className="text-base md:text-lg text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed">
          The daily tracker built around the truth — you plan, you execute,
          you miss things, you adjust. Klok helps you build a real rhythm
          without judgement.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
          <Link
            href="/sign-up"
            className="btn btn-primary rounded-2xl shadow-lg shadow-[#6C6FDF]/30"
            style={{ fontSize: "15px", padding: "14px 32px" }}
          >
            Start Tracking — Free <i className="fa-solid fa-arrow-right"></i>
          </Link>
          <Link
            href="/about"
            className="btn btn-outline rounded-2xl"
            style={{ fontSize: "15px", padding: "14px 32px" }}
          >
            Learn More
          </Link>
        </div>

        {/* Hero illustration */}
        <div className="flex justify-center">
          <Image
            src="/illustrations/hero.svg"
            alt="A calendar showing a day's planned blocks with completed and upcoming tasks"
            width={520}
            height={350}
            priority
            className="max-w-full h-auto drop-shadow-xl"
          />
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────── */}
      <section className="bg-white border-y border-[#E5E7EB]/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
          <p className="text-center text-xs uppercase tracking-widest text-[#9CA3AF] font-semibold mb-6">
            What you get with Klok
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
            <TrustItem
              icon="fa-clock"
              value="24h"
              label="Hourly time blocks"
            />
            <TrustItem
              icon="fa-list-check"
              value="Unlimited"
              label="Nested todos"
            />
            <TrustItem
              icon="fa-layer-group"
              value="Templates"
              label="Save & apply days"
            />
            <TrustItem
              icon="fa-fire"
              value="Streaks"
              label="Build a habit"
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="how" className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-[#6C6FDF] font-semibold mb-2">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A2E] mb-3">
            Three steps. That&apos;s it.
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            No bloated onboarding, no premium tiers, no AI nudging you.
            Just plan, track, and reflect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Step
            number={1}
            icon="fa-pen-to-square"
            title="Plan your day"
            description="Add time blocks for what you want to do — Morning Routine, Study, Lunch, whatever. Nest todos inside each block."
          />
          <Step
            number={2}
            icon="fa-check-double"
            title="Track as you go"
            description="Tick off todos as you finish them. Block status auto-updates. Or mark a whole block done in one click."
          />
          <Step
            number={3}
            icon="fa-chart-line"
            title="Reflect & repeat"
            description="See your patterns in the weekly and monthly views. Save your best days as templates and apply them again."
          />
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────── */}
      <section
        id="features"
        className="bg-white border-y border-[#E5E7EB]/50"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-[#6C6FDF] font-semibold mb-2">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A2E] mb-3">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <FeatureCard
              icon="fa-clock"
              iconBg="bg-[#EEEEFF]"
              iconColor="text-[#6C6FDF]"
              title="Hourly Time Blocks"
              description="Plan your day in blocks with nested todos. See exactly where every hour goes."
            />
            <FeatureCard
              icon="fa-list-check"
              iconBg="bg-[#DCFCE7]"
              iconColor="text-[#15803D]"
              title="Nested Todos"
              description="Each block has its own checklist. Status updates from your todos automatically."
            />
            <FeatureCard
              icon="fa-layer-group"
              iconBg="bg-[#F3E8FF]"
              iconColor="text-[#7E22CE]"
              title="Day Templates"
              description='Save today as a template. Apply "My Typical Monday" to any future date.'
            />
            <FeatureCard
              icon="fa-fire"
              iconBg="bg-[#FEF3C7]"
              iconColor="text-[#F59E0B]"
              title="Streak Tracking"
              description="Log consistently and watch your streak grow. Missing a day breaks the chain."
            />
            <FeatureCard
              icon="fa-tag"
              iconBg="bg-[#DBEAFE]"
              iconColor="text-[#1D4ED8]"
              title="Activity Tags"
              description="9 default tags plus custom ones. Color-code your day and group blocks by activity."
            />
            <FeatureCard
              icon="fa-chart-bar"
              iconBg="bg-[#DCFCE7]"
              iconColor="text-[#15803D]"
              title="Weekly Insights"
              description="Week, month, and year views — see when you're winning and where you slip."
            />
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6C6FDF] font-semibold mb-2">
              Why Klok
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A2E] mb-4 leading-tight">
              Built for honest <span className="grad-text">reflection.</span>
            </h2>
            <p className="text-[#6B7280] leading-relaxed mb-4">
              Most productivity apps make you feel guilty when you miss things.
              Klok assumes you will — and helps you adjust without judgment.
            </p>
            <p className="text-[#6B7280] leading-relaxed mb-6">
              Plan your day in blocks. Some you&apos;ll smash. Some you&apos;ll
              miss. Both are data. Both teach you what works for you.
            </p>
            <Link
              href="/about"
              className="text-[#6C6FDF] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Read more about our approach{" "}
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
          </div>

          <div className="card p-6 md:p-8" style={{ borderRadius: "24px" }}>
            <div className="space-y-3">
              <BlockExample
                emoji="🌅"
                title="Morning Routine"
                time="7:00 – 8:00"
                state="done"
                stateLabel="Done ✓"
              />
              <BlockExample
                emoji="📚"
                title="Study Time"
                time="9:00 – 11:00"
                state="partial"
                stateLabel="2 of 3"
              />
              <BlockExample
                emoji="💻"
                title="Project Work"
                time="14:00 – 16:00"
                state="missed"
                stateLabel="Missed"
              />
              <BlockExample
                emoji="🏃"
                title="Exercise"
                time="18:00 – 19:00"
                state="planned"
                stateLabel="Upcoming"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div
          className="rounded-3xl p-8 md:p-12 text-center shadow-xl"
          style={{
            background: "linear-gradient(135deg, #6C6FDF 0%, #9B9EEF 100%)",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Start tracking today.
          </h2>
          <p className="text-white/90 text-base md:text-lg max-w-xl mx-auto mb-8">
            Free. No credit card. No bullshit. Just a real daily tracker built
            for real people.
          </p>
          <Link
            href="/sign-up"
            className="btn rounded-2xl bg-white text-[#6C6FDF] hover:opacity-90 shadow-lg inline-flex font-bold"
            style={{ fontSize: "15px", padding: "14px 32px" }}
          >
            Get Started Free <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-white border-t border-[#E5E7EB]/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-[#6C6FDF] rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-calendar-check text-white text-xs"></i>
                </div>
                <span className="text-lg font-extrabold text-[#1A1A2E]">
                  Klok
                </span>
              </Link>
              <p className="text-sm text-[#6B7280] max-w-xs leading-relaxed">
                The honest daily tracker. Plan, execute, reflect — without
                judgment.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-widest mb-3">
                Product
              </h3>
              <div className="space-y-2">
                <Link
                  href="#features"
                  className="block text-sm text-[#6B7280] hover:text-[#6C6FDF]"
                >
                  Features
                </Link>
                <Link
                  href="#how"
                  className="block text-sm text-[#6B7280] hover:text-[#6C6FDF]"
                >
                  How it works
                </Link>
                <Link
                  href="/about"
                  className="block text-sm text-[#6B7280] hover:text-[#6C6FDF]"
                >
                  About
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-widest mb-3">
                Account
              </h3>
              <div className="space-y-2">
                <Link
                  href="/sign-in"
                  className="block text-sm text-[#6B7280] hover:text-[#6C6FDF]"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block text-sm text-[#6B7280] hover:text-[#6C6FDF]"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#9CA3AF]">
              © {new Date().getFullYear()} Klok. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/about"
                className="text-xs text-[#9CA3AF] hover:text-[#6C6FDF]"
              >
                About
              </Link>
              <Link
                href="/sign-in"
                className="text-xs text-[#9CA3AF] hover:text-[#6C6FDF]"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ──

function TrustItem({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-center w-12 h-12 bg-[#EEEEFF] rounded-2xl mx-auto mb-3">
        <i className={`fa-solid ${icon} text-[#6C6FDF]`}></i>
      </div>
      <div className="text-lg font-extrabold text-[#1A1A2E]">{value}</div>
      <div className="text-xs text-[#6B7280] mt-0.5">{label}</div>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 relative">
      <div className="absolute -top-3 -left-3 w-9 h-9 bg-[#6C6FDF] rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-[#6C6FDF]/30">
        {number}
      </div>
      <div className="w-12 h-12 bg-[#EEEEFF] rounded-2xl flex items-center justify-center mb-4">
        <i className={`fa-solid ${icon} text-[#6C6FDF] text-lg`}></i>
      </div>
      <h3 className="font-bold text-[#1A1A2E] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card">
      <div
        className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-4`}
      >
        <i className={`fa-solid ${icon} ${iconColor} text-lg`}></i>
      </div>
      <h3 className="font-bold text-[#1A1A2E] mb-2 text-sm">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
    </div>
  );
}

function BlockExample({
  emoji,
  title,
  time,
  state,
  stateLabel,
}: {
  emoji: string;
  title: string;
  time: string;
  state: "done" | "partial" | "missed" | "planned";
  stateLabel: string;
}) {
  const bgMap = {
    done: { card: "#F0FFF4", border: "#DCFCE7" },
    partial: { card: "#FAFAFF", border: "#EEEEFF" },
    missed: { card: "#FFF5F5", border: "#FEE2E2" },
    planned: { card: "white", border: "#F3F4F6" },
  };
  const badgeMap = {
    done: { color: "#15803D", bg: "#DCFCE7" },
    partial: { color: "#6C6FDF", bg: "#EEEEFF" },
    missed: { color: "#DC2626", bg: "#FEE2E2" },
    planned: { color: "#9CA3AF", bg: "#F3F4F6" },
  };

  return (
    <div
      className="rounded-xl p-3 flex items-center justify-between"
      style={{
        background: bgMap[state].card,
        border: `1px solid ${bgMap[state].border}`,
      }}
    >
      <div>
        <div className="font-bold text-sm text-[#1A1A2E]">
          {emoji} {title}
        </div>
        <div className="text-xs text-[#9CA3AF] mt-0.5">{time}</div>
      </div>
      <span
        className="text-xs font-bold px-2 py-1 rounded-lg"
        style={{
          color: badgeMap[state].color,
          background: badgeMap[state].bg,
        }}
      >
        {stateLabel}
      </span>
    </div>
  );
}
