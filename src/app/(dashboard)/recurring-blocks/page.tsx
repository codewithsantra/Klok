// Rendering: SSG (no per-request data).
// This is a placeholder page — the feature is on the v2 roadmap. The
// schema already supports `Block.recurrence` and `recurrenceEndDate`,
// but the engine that materializes future occurrences hasn't been built.
// Documented in README under "Assumptions and Limitations."

import Link from "next/link";

export default function RecurringBlocksPage() {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-extrabold text-[#1A1A2E]">
          Recurring Blocks
        </h1>
      </div>
      <p className="text-sm text-[#9CA3AF] mb-5">
        Schedule a block to repeat daily, weekly, or on custom days.
      </p>

      <div className="card p-8 md:p-12 text-center">
        <div className="w-16 h-16 bg-[#EEEEFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-rotate text-[#6C6FDF] text-2xl"></i>
        </div>
        <p className="text-base font-bold text-[#1A1A2E]">Coming in v2</p>
        <p className="text-sm text-[#9CA3AF] mt-2 mb-6 max-w-lg mx-auto leading-relaxed">
          The recurrence engine — generating future occurrences based on a
          rule like &quot;every weekday until December 31&quot; — is on the
          v2 roadmap. The data model already supports it
          (<code className="text-[10px] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
            Block.recurrence
          </code>{" "}
          and{" "}
          <code className="text-[10px] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
            recurrenceEndDate
          </code>
          ), but the background job that materializes occurrences hasn&apos;t
          been built.
        </p>

        <div
          className="max-w-md mx-auto p-4 rounded-2xl text-left"
          style={{ background: "#F9F9FF", border: "1px solid #EEEEFF" }}
        >
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-lightbulb text-[#6C6FDF] mt-0.5"></i>
            <div>
              <div className="text-xs font-bold text-[#1A1A2E] mb-1">
                In the meantime — use Templates
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Save your typical day&apos;s blocks as a template, then apply
                it to any future date with one click. Same outcome with one
                more step.
              </p>
            </div>
          </div>
          <Link
            href="/templates"
            className="btn btn-primary text-xs py-2 mt-3 w-full justify-center"
            style={{ fontSize: "12px" }}
          >
            <i className="fa-solid fa-layer-group"></i> Go to Templates
          </Link>
        </div>
      </div>
    </div>
  );
}
