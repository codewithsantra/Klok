"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { DEFAULT_TAGS } from "@/lib/constants";
import { saveOnboardingTagsAction } from "@/actions/onboarding";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [isPending, startTransition] = useTransition();

  const toggleTag = (index: number) => {
    setTags((prev) =>
      prev.map((t, i) => (i === index ? { ...t, on: !t.on } : t)),
    );
  };

  // Save tag toggles, then advance to step 2
  const handleStep1Continue = () => {
    const selections = tags.map((t) => ({ name: t.name, emoji: t.emoji, on: t.on }));
    startTransition(async () => {
      await saveOnboardingTagsAction(selections);
      setStep(2);
    });
  };

  return (
    <>
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
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

      {/* Step 1: Pick tags */}
      {step === 1 && (
        <div className="card p-8 animate-fade-in">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">🏷️</div>
            <h1 className="text-xl font-extrabold text-[#1A1A2E]">
              Pick your activity tags
            </h1>
            <p className="text-sm text-[#6B7280] mt-2">
              Select the ones you want to track. You can change them later in
              Settings.
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
            <Link
              href="/dashboard"
              className="btn btn-ghost border border-[#E5E7EB] text-xs"
            >
              Skip →
            </Link>
            <button
              onClick={handleStep1Continue}
              disabled={isPending}
              className="btn btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Continue"}{" "}
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: All set */}
      {step === 2 && (
        <div className="card p-8 animate-fade-in text-center">
          <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-check text-[#16a34a] text-2xl"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">
            You&apos;re all set!
          </h1>
          <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
            Your Klok is ready. Start by planning today&apos;s tasks — or
            kick off a focus session.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6 text-left">
            <div className="bg-[#EEEEFF] rounded-2xl p-4">
              <i className="fa-solid fa-calendar-day text-[#6C6FDF] mb-2 block"></i>
              <div className="text-xs font-bold text-[#1A1A2E]">Daily Tasks</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                Plan time-boxed tasks
              </div>
            </div>
            <div className="bg-[#DCFCE7] rounded-2xl p-4">
              <i className="fa-solid fa-stopwatch text-[#15803D] mb-2 block"></i>
              <div className="text-xs font-bold text-[#1A1A2E]">Focus Timer</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                Time your deep work
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
              href="/timer"
              className="btn btn-outline flex-1 justify-center py-3"
            >
              <i className="fa-solid fa-stopwatch"></i> Start Focus
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
