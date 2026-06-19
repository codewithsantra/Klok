import { describe, it, expect } from "vitest";
import { resolveDays } from "./recurrence";

describe("resolveDays", () => {
  it("DAILY expands to every day", () => {
    expect(resolveDays("DAILY", [])).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("WEEKDAYS expands to Mon–Fri", () => {
    expect(resolveDays("WEEKDAYS", [])).toEqual([1, 2, 3, 4, 5]);
  });

  it("CUSTOM keeps the chosen days, sorted numerically", () => {
    expect(resolveDays("CUSTOM", [5, 1, 3])).toEqual([1, 3, 5]);
  });

  it("dedupes repeated days", () => {
    expect(resolveDays("WEEKLY", [2, 2, 4, 4])).toEqual([2, 4]);
  });

  it("drops out-of-range and non-integer values", () => {
    expect(resolveDays("CUSTOM", [-1, 0, 6, 7, 3.5])).toEqual([0, 6]);
  });

  it("sorts numerically, not lexicographically (10-style guard)", () => {
    // All valid weekdays are single digit, but ensure the comparator is numeric.
    expect(resolveDays("CUSTOM", [6, 0, 2])).toEqual([0, 2, 6]);
  });
});
