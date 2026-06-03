import Link from "next/link";

const BLOCKS_PREVIEW = [
  { title: "🌅 Morning Routine", tag: "Personal", tagClass: "tag-personal", time: "7:00 AM – 8:00 AM", status: "Done ✓", statusClass: "text-[#15803D] bg-[#DCFCE7]", blockClass: "block-done bg-[#F9FFF9] border border-[#DCFCE7]", info: "3/3 done" },
  { title: "📚 Study Time – Next.js", tag: "Study", tagClass: "tag-study", time: "9:00 AM – 11:00 AM", status: "In Progress", statusClass: "text-[#6C6FDF] bg-[#EEEEFF]", blockClass: "block-partial bg-[#FAFAFF] border border-[#EEEEFF]", info: "1/3 done" },
  { title: "🍽 Lunch Break", tag: "Meal", tagClass: "tag-meal", time: "12:00 PM – 1:00 PM", status: "Upcoming", statusClass: "text-[#9CA3AF] bg-[#F3F4F6]", blockClass: "block-plan bg-white border border-[#F3F4F6]", info: "Planned" },
  { title: "💻 Project Work", tag: "Work", tagClass: "tag-work", time: "2:00 PM – 4:00 PM", status: "Upcoming", statusClass: "text-[#9CA3AF] bg-[#F3F4F6]", blockClass: "block-plan bg-white border border-[#F3F4F6]", info: "Planned" },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
          Good afternoon, Santra! ☀️
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Monday, 2nd June 2026 · 🔥 6-day streak — keep it going!
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/today" className="card p-5 stat-card flex items-center gap-4 cursor-pointer">
          <div className="w-12 h-12 bg-[#DCFCE7] rounded-2xl flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-check text-[#15803D] text-lg"></i>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-extrabold text-[#1A1A2E]">
              5 <span className="text-base font-medium text-[#9CA3AF]">/ 8</span>
            </div>
            <div className="text-xs font-semibold text-[#6B7280] mt-0.5">Blocks Completed</div>
          </div>
          <i className="fa-solid fa-arrow-right text-[#D1D5DB] text-xs"></i>
        </Link>
        <div className="card p-5 stat-card flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FEF3C7] rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-extrabold text-[#1A1A2E]">
              6 <span className="text-base font-medium text-[#9CA3AF]">days</span>
            </div>
            <div className="text-xs font-semibold text-[#6B7280] mt-0.5">Current Streak</div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's blocks preview */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1A1A2E] text-base">Today&apos;s Blocks</h2>
            <Link href="/today" className="text-xs text-[#6C6FDF] font-semibold hover:underline">
              See All →
            </Link>
          </div>
          <div className="space-y-3">
            {BLOCKS_PREVIEW.map((block) => (
              <div key={block.title} className={`${block.blockClass} rounded-xl p-3.5`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-[#1A1A2E] text-sm">{block.title}</span>
                      <span className={`tag ${block.tagClass}`}>{block.tag}</span>
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{block.time} · {block.info}</div>
                  </div>
                  <span className={`text-xs font-bold ${block.statusClass} px-2.5 py-1 rounded-lg`}>
                    {block.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/today" className="btn btn-primary mt-4 text-xs py-2.5" style={{ fontSize: "12px" }}>
            <i className="fa-solid fa-plus"></i> Add Block
          </Link>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* This Week mini chart placeholder */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#1A1A2E] text-sm">This Week</h2>
            </div>
            {/* Chart will go here - placeholder bars */}
            <div className="flex items-end justify-between gap-1.5 h-16">
              {[82, 65, 90, 45, 78, 55, 74].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${val * 0.6}px`,
                      background: i === 6 ? "#6C6FDF" : "#EEEEFF",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d} className="text-[10px] text-[#9CA3AF]">{d}</span>
              ))}
              <span className="text-[10px] font-bold text-[#6C6FDF]">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
