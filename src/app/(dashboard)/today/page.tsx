"use client";

import { useState } from "react";

const EMPTY_HOURS = ["6am", "8am", "11am", "1pm", "3pm", "4pm", "5pm", "7pm", "8pm", "9pm"];

const BLOCKS = [
  {
    time: "7am", label: "7:00 – 8:00 AM · 1 hour", title: "🌅 Morning Routine", tag: "Personal", tagClass: "tag-personal",
    status: "done", statusLabel: "✓ Done",
    todos: [
      { text: "Wake up and stretch", done: true },
      { text: "Brush teeth and freshen up", done: true },
      { text: "Drink 2 glasses of water", done: true },
    ],
  },
  {
    time: "9am", label: "9:00 – 11:00 AM · 2 hours", title: "📚 Study Time – Next.js", tag: "Study", tagClass: "tag-study",
    status: "partial", statusLabel: null,
    todos: [
      { text: "Read Chapter 5: Server Components", done: true },
      { text: "Complete practice exercises", done: false, incomplete: true },
      { text: "Watch lecture on API routes", done: false },
    ],
  },
  {
    time: "12pm", label: "12:00 – 1:00 PM", title: "🍽 Lunch Break", tag: "Meal", tagClass: "tag-meal",
    status: "plan", statusLabel: null,
    todos: [
      { text: "Cook or order lunch", done: false },
      { text: "Take a short walk after", done: false },
    ],
  },
  {
    time: "2pm", label: "2:00 – 4:00 PM", title: "💻 Project Work", tag: "Work", tagClass: "tag-work",
    status: "plan", statusLabel: null,
    todos: [
      { text: "Set up Next.js project", done: false },
      { text: "Create Prisma schema", done: false },
      { text: "Build auth pages", done: false },
    ],
  },
  {
    time: "6pm", label: "6:00 – 7:00 PM", title: "🏃 Exercise", tag: "Health", tagClass: "tag-health",
    status: "plan", statusLabel: null,
    todos: [
      { text: "30 min jogging", done: false },
      { text: "Stretching", done: false },
    ],
  },
  {
    time: "10pm", label: "10:00 – 11:00 PM", title: "🌙 Sleep Prep", tag: "Sleep", tagClass: "tag-sleep",
    status: "plan", statusLabel: null,
    todos: [
      { text: "Read for 20 mins", done: false },
      { text: "Sleep by 11pm", done: false },
    ],
  },
];

export default function TodayPage() {
  const [dateLabel] = useState("Mon, 2 Jun 2026 · Today");

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A2E]">Today&apos;s Log</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <button className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-[#EEEEFF] transition-colors flex-shrink-0">
              <i className="fa-solid fa-chevron-left text-[#6B7280]" style={{ fontSize: "9px" }}></i>
            </button>
            <span className="text-xs sm:text-sm font-semibold text-[#1A1A2E]">{dateLabel}</span>
            <button className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-[#EEEEFF] transition-colors flex-shrink-0">
              <i className="fa-solid fa-chevron-right text-[#6B7280]" style={{ fontSize: "9px" }}></i>
            </button>
            <input type="date" defaultValue="2026-06-02" className="inp text-xs text-[#6C6FDF] font-semibold cursor-pointer" style={{ width: "auto", padding: "4px 8px", fontSize: "11px", borderColor: "#EEEEFF", background: "#EEEEFF", color: "#6C6FDF" }} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn btn-outline text-xs py-2" style={{ fontSize: "12px" }}>
            <i className="fa-solid fa-layer-group"></i> Apply Template
          </button>
          <button className="btn btn-primary text-xs py-2" style={{ fontSize: "12px" }}>
            <i className="fa-solid fa-plus"></i> Add Block
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="lg:col-span-2 card p-5">
          <div className="relative" style={{ paddingBottom: "20px" }}>
            {/* Build timeline rows */}
            {renderTimeline()}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Todos Progress */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-[#1A1A2E] mb-3">Todos Progress</h3>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-[#6B7280]">Completed</span><span className="font-bold text-[#15803D]">7 / 12</span></div>
                <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: "58%", background: "#22C55E" }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-[#6B7280]">Incomplete</span><span className="font-bold text-[#F59E0B]">3 / 12</span></div>
                <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: "25%", background: "#F59E0B" }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-[#6B7280]">Pending</span><span className="font-bold text-[#9CA3AF]">2 / 12</span></div>
                <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: "17%", background: "#D1D5DB" }} /></div>
              </div>
            </div>
          </div>

          {/* Overlap warning */}
          <div className="card p-4 border border-[#FEE2E2]" style={{ borderRadius: "16px", background: "#FFF5F5" }}>
            <div className="flex items-start gap-2.5">
              <i className="fa-solid fa-triangle-exclamation text-[#DC2626] text-sm mt-0.5"></i>
              <div>
                <div className="text-xs font-bold text-[#DC2626]">Block overlap detected</div>
                <div className="text-[10px] text-[#6B7280] mt-0.5">Your 2pm block overlaps with 3pm–4pm slot.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderTimeline() {
  const rows: React.ReactNode[] = [];
  const allHours = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm"];

  allHours.forEach((hour, idx) => {
    const block = BLOCKS.find((b) => b.time === hour);

    // Now indicator after 1pm
    if (hour === "1pm") {
      rows.push(
        <div key="now" className="flex items-center gap-2 my-1">
          <span className="text-[10px] font-bold text-[#6C6FDF] w-[52px] text-right pr-2 flex-shrink-0">Now</span>
          <div className="now-indicator flex-1"></div>
        </div>
      );
    }

    if (block) {
      rows.push(<BlockRow key={hour} block={block} />);
    } else if (EMPTY_HOURS.includes(hour)) {
      rows.push(<EmptyRow key={hour} hour={hour} />);
    }
  });

  return rows;
}

function EmptyRow({ hour }: { hour: string }) {
  return (
    <div className="tl-row group">
      <div className="tl-label">{hour}</div>
      <div className="tl-content flex items-center gap-2">
        <div className="flex-1 h-px bg-[#F3F4F6]"></div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#6C6FDF] font-bold bg-[#EEEEFF] px-2 py-0.5 rounded-lg flex-shrink-0">+ Add</button>
      </div>
    </div>
  );
}

function BlockRow({ block }: { block: typeof BLOCKS[0] }) {
  const borderClass = block.status === "done" ? "block-done" : block.status === "partial" ? "block-partial" : "block-plan";
  const bgStyle = block.status === "done" ? { background: "#F0FFF4", border: "1px solid #DCFCE7" } : block.status === "partial" ? { background: "#FAFAFF", border: "1px solid #EEEEFF" } : { background: "white", border: "1px solid #F3F4F6" };

  return (
    <div className="tl-row" style={{ minHeight: "80px" }}>
      <div className="tl-label">{block.time}</div>
      <div className="tl-content pt-1">
        <div className={`${borderClass} rounded-xl p-3.5 mb-2`} style={bgStyle}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#1A1A2E]">{block.title}</span>
                <span className={`tag ${block.tagClass}`}>{block.tag}</span>
              </div>
              <div className="text-xs text-[#9CA3AF] mt-0.5">{block.label}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {block.statusLabel && (
                <span className="text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-1 rounded-lg">{block.statusLabel}</span>
              )}
              <button className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center hover:bg-[#EEEEFF] transition-colors">
                <i className="fa-solid fa-pen text-[#9CA3AF] text-xs"></i>
              </button>
              <button className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center hover:bg-[#FEE2E2] transition-colors">
                <i className="fa-solid fa-trash text-[#9CA3AF] text-xs"></i>
              </button>
            </div>
          </div>
          {/* Todos */}
          <div className="space-y-2">
            {block.todos.map((todo, i) => (
              <TodoItem key={i} todo={todo} />
            ))}
          </div>
          <button className="mt-2.5 text-xs text-[#6C6FDF] font-semibold flex items-center gap-1 hover:underline">
            <i className="fa-solid fa-plus text-[10px]"></i> Add todo
          </button>
        </div>
      </div>
    </div>
  );
}

function TodoItem({ todo }: { todo: { text: string; done: boolean; incomplete?: boolean; comment?: string } }) {
  if (todo.done) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="cb cb-done"><i className="fa-solid fa-check text-white" style={{ fontSize: "9px" }}></i></div>
        <span className="text-xs text-[#6B7280] line-through">{todo.text}</span>
      </div>
    );
  }

  if (todo.incomplete) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="cb cb-warn"><i className="fa-solid fa-exclamation text-[#F59E0B]" style={{ fontSize: "8px" }}></i></div>
        <span className="text-xs text-[#1A1A2E]">{todo.text}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="cb"></div>
      <span className="text-xs text-[#1A1A2E] flex-1">{todo.text}</span>
    </div>
  );
}
