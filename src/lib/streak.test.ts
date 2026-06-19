import { describe, it, expect } from "vitest";
import { computeStreak, computeLongestStreak } from "./streak";
import { parseISODate } from "./dates";

const d = (iso: string) => ({ date: parseISODate(iso)! });
const today = parseISODate("2026-06-17")!;

describe("computeStreak (current streak)", () => {
  it("is 0 when there are no blocks", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak([d("2026-06-15"), d("2026-06-16"), d("2026-06-17")], today)).toBe(3);
  });

  it("counts from yesterday when today has no block", () => {
    expect(computeStreak([d("2026-06-15"), d("2026-06-16")], today)).toBe(2);
  });

  it("breaks on a gap — isolated today counts as 1", () => {
    // san@gmail.com's real data: today is isolated, earlier days have a gap.
    const dates = [d("2026-06-05"), d("2026-06-06"), d("2026-06-08"), d("2026-06-09"), d("2026-06-17")];
    expect(computeStreak(dates, today)).toBe(1);
  });

  it("is 0 when the most recent block is older than yesterday", () => {
    expect(computeStreak([d("2026-06-10")], today)).toBe(0);
  });

  it("ignores duplicate dates", () => {
    expect(computeStreak([d("2026-06-17"), d("2026-06-17"), d("2026-06-16")], today)).toBe(2);
  });
});

describe("computeLongestStreak (all-time best)", () => {
  it("is 0 with no blocks", () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it("finds the longest consecutive run regardless of order", () => {
    const dates = [d("2026-06-09"), d("2026-06-05"), d("2026-06-17"), d("2026-06-06"), d("2026-06-08")];
    // runs: 05-06 (2), 08-09 (2), 17 (1) -> best 2
    expect(computeLongestStreak(dates)).toBe(2);
  });

  it("counts a single day as 1", () => {
    expect(computeLongestStreak([d("2026-06-17")])).toBe(1);
  });

  it("handles a long unbroken run across a month boundary", () => {
    const dates = [d("2026-06-29"), d("2026-06-30"), d("2026-07-01"), d("2026-07-02")];
    expect(computeLongestStreak(dates)).toBe(4);
  });
});
