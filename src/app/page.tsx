// Rendering: SSG (Static Site Generation).
// This is a marketing landing page with no per-request data. Next.js
// statically generates the HTML at build time and serves it as a static
// asset on every request. Fastest possible page load.

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#ECECF8] overflow-y-auto">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#6C6FDF] rounded-xl flex items-center justify-center shadow-md shadow-[#6C6FDF]/40">
            <i className="fa-solid fa-calendar-check text-white text-sm"></i>
          </div>
          <span className="text-xl font-extrabold text-[#1A1A2E]">DayLog</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn btn-ghost px-5">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="btn btn-primary shadow-md shadow-[#6C6FDF]/30"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-12 md:pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-[#EEEEFF] px-4 py-2 rounded-full text-sm font-semibold text-[#6C6FDF] shadow-sm mb-8">
          <i className="fa-solid fa-fire text-xs"></i>
          Plan. Track. Improve. Every Single Day.
        </div>

        {/* Hero illustration — uses next/image for automatic optimization */}
        <div className="flex justify-center mb-8">
          <Image
            src="/illustrations/hero.svg"
            alt="A calendar showing a day's planned blocks with some completed and some upcoming"
            width={420}
            height={280}
            priority
            className="max-w-full h-auto"
          />
        </div>

        <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.12] text-[#1A1A2E] mb-6">
          Plan Your Day.
          <br />
          <span className="grad-text">Own Your Reality.</span>
        </h1>
        <p className="text-base lg:text-lg text-[#6B7280] max-w-xl mx-auto mb-10 leading-relaxed">
          The only daily tracker that&apos;s honest about the gap between what
          you planned and what actually happened — and helps you close it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/sign-up"
            className="btn btn-primary rounded-2xl shadow-lg shadow-[#6C6FDF]/30"
            style={{ fontSize: "15px", padding: "14px 32px" }}
          >
            Get Started Free <i className="fa-solid fa-arrow-right"></i>
          </Link>
          <Link
            href="/sign-in"
            className="btn btn-outline rounded-2xl"
            style={{ fontSize: "15px", padding: "14px 32px" }}
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="landing-stats flex items-center justify-center gap-8 lg:gap-12 mt-12 lg:mt-16 flex-wrap">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#1A1A2E]">🔥</div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              Build Streaks
            </div>
          </div>
          <div className="stat-divider w-px h-10 bg-[#E5E7EB]"></div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#6C6FDF]">⚡</div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              Honest Score
            </div>
          </div>
          <div className="stat-divider w-px h-10 bg-[#E5E7EB]"></div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#1A1A2E]">📊</div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              Daily Insights
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
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
