"use client";

import Link from "next/link";
import { useState } from "react";

const TIME_OPTIONS = ["5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM"];

const DEFAULT_TAGS = [
  { emoji: "😴", name: "Sleep", on: true },
  { emoji: "📚", name: "Study", on: true },
  { emoji: "💻", name: "Work", on: true },
  { emoji: "🍳", name: "Breakfast", on: true },
  { emoji: "🍽", name: "Lunch", on: true },
  { emoji: "🌙", name: "Dinner", on: true },
  { emoji: "🏃", name: "Exercise", on: true },
  { emoji: "☕", name: "Break", on: true },
  { emoji: "🧘", name: "Personal", on: true },
  { emoji: "🎮", name: "Gaming", on: false },
  { emoji: "📖", name: "Reading", on: false },
  { emoji: "🎵", name: "Music", on: false },
  { emoji: "🚗", name: "Commute", on: false },
  { emoji: "🛁", name: "Self-care", on: false },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState("5 AM");
  const [tags, setTags] = useState(DEFAULT_TAGS);

  const toggleTag = (index: number) => {
    setTags((prev) =>
      prev.map((t, i) => (i === index ? { ...t, on: !t.on } : t))
    );
  };

  return (
    <>
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#6C6FDF] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C6FDF]/30">
            <i className="fa-solid fa-calendar-check text-white text-sm"></i>
          </div>
          <span className="text-xl font-extrabold text-[#1A1A2E]">DayLog</span>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              s === step
                ? "w-8 bg-[#6C6FDF]"
                : s < step
                  ? "w-2 bg-[#6C6FDF]"
                  : "w-2 bg-[#D1D5DB]"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Day start time */}
      {step === 1 && (
        <div className="card p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
              Welcome to DayLog!
            </h1>
            <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">
              One quick question before you start — when does your day usually
              begin?
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-3">
                My day starts at
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`time-chip ${
                      selectedTime === t ? "time-chip-active" : ""
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard"
                className="btn btn-ghost border border-[#E5E7EB] text-xs"
              >
                Skip setup →
              </Link>
              <button
                onClick={() => setStep(2)}
                className="btn btn-primary flex-1 justify-center"
              >
                Continue <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Pick tags */}
      {step === 2 && (
        <div className="card p-8 animate-fade-in">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">🏷️</div>
            <h1 className="text-xl font-extrabold text-[#1A1A2E]">
              Pick your activity tags
            </h1>
            <p className="text-sm text-[#6B7280] mt-2">
              Select the ones you want to track. You can change these later.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag, i) => (
              <button
                key={tag.name}
                onClick={() => toggleTag(i)}
                className={`tag-chip ${tag.on ? "tag-chip-on" : "tag-chip-off"}`}
              >
                {tag.emoji} {tag.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn btn-ghost border border-[#E5E7EB]"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <Link
              href="/dashboard"
              className="btn btn-ghost border border-[#E5E7EB] text-xs"
            >
              Skip →
            </Link>
            <button
              onClick={() => setStep(3)}
              className="btn btn-primary flex-1 justify-center"
            >
              Continue <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: All set */}
      {step === 3 && (
        <div className="card p-8 animate-fade-in text-center">
          <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-check text-[#16a34a] text-2xl"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">
            You&apos;re all set!
          </h1>
          <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
            Your DayLog is ready. Start by planning today&apos;s blocks — or
            apply a template to get going fast.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            <div className="bg-[#EEEEFF] rounded-2xl p-4">
              <i className="fa-solid fa-clock text-[#6C6FDF] mb-2 block"></i>
              <div className="text-xs font-bold text-[#1A1A2E]">
                Time Blocks
              </div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                Plan hour by hour
              </div>
            </div>
            <div className="bg-[#FEF3C7] rounded-2xl p-4">
              <i className="fa-solid fa-fire text-[#A16207] mb-2 block"></i>
              <div className="text-xs font-bold text-[#1A1A2E]">Streaks</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                Log daily to keep it
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/templates"
              className="btn btn-outline flex-1 justify-center py-3"
            >
              <i className="fa-solid fa-layer-group"></i> Apply Template
            </Link>
            <Link
              href="/today"
              className="btn btn-primary flex-1 justify-center py-3 shadow-lg shadow-[#6C6FDF]/25"
            >
              Plan Today <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
