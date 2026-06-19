import { describe, it, expect, vi, afterEach } from "vitest";
import {
  startOfUTCDay,
  todayUTC,
  todayInZone,
  nowHHMMInZone,
  parseISODate,
  toISODate,
  addDays,
  isSameUTCDay,
} from "./dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("parseISODate / toISODate", () => {
  it("round-trips a valid ISO date at UTC midnight", () => {
    const d = parseISODate("2026-06-17");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2026-06-17T00:00:00.000Z");
    expect(toISODate(d!)).toBe("2026-06-17");
  });

  it("rejects malformed strings", () => {
    expect(parseISODate("2026-6-7")).toBeNull();
    expect(parseISODate("not-a-date")).toBeNull();
    expect(parseISODate("")).toBeNull();
  });
});

describe("addDays / isSameUTCDay / startOfUTCDay", () => {
  it("adds and subtracts days across month boundaries", () => {
    const d = parseISODate("2026-06-30")!;
    expect(toISODate(addDays(d, 1))).toBe("2026-07-01");
    expect(toISODate(addDays(d, -30))).toBe("2026-05-31");
  });

  it("isSameUTCDay ignores time of day", () => {
    const a = new Date("2026-06-17T23:59:00Z");
    const b = new Date("2026-06-17T00:00:00Z");
    expect(isSameUTCDay(a, b)).toBe(true);
    expect(isSameUTCDay(a, new Date("2026-06-18T00:00:00Z"))).toBe(false);
  });

  it("startOfUTCDay zeroes the time", () => {
    expect(startOfUTCDay(new Date("2026-06-17T15:30:00Z")).toISOString()).toBe(
      "2026-06-17T00:00:00.000Z",
    );
  });
});

describe("todayInZone (the timezone fix)", () => {
  it("returns a different logical day for east/west zones near the UTC boundary", () => {
    // 18:30 UTC: still the 17th in UTC, already the 18th in India (UTC+5:30).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T18:30:00Z"));

    expect(toISODate(todayInZone("UTC"))).toBe("2026-06-17");
    expect(toISODate(todayInZone("Asia/Kolkata"))).toBe("2026-06-18");
    expect(toISODate(todayInZone("America/Los_Angeles"))).toBe("2026-06-17");
  });

  it("handles the western side of midnight", () => {
    // 02:00 UTC on the 18th = still 19:00 on the 17th in Los Angeles.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T02:00:00Z"));

    expect(toISODate(todayInZone("UTC"))).toBe("2026-06-18");
    expect(toISODate(todayInZone("America/Los_Angeles"))).toBe("2026-06-17");
  });

  it("falls back to UTC for missing or invalid timezones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T10:00:00Z"));
    expect(toISODate(todayInZone(undefined))).toBe(toISODate(todayUTC()));
    expect(toISODate(todayInZone(""))).toBe("2026-06-17");
    expect(toISODate(todayInZone("Not/AZone"))).toBe("2026-06-17");
  });
});

describe("nowHHMMInZone", () => {
  it("formats wall-clock time per zone in 24h", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T18:30:00Z"));
    expect(nowHHMMInZone("UTC")).toBe("18:30");
    expect(nowHHMMInZone("Asia/Kolkata")).toBe("00:00"); // +5:30
  });

  it("falls back to UTC time on an invalid zone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T09:05:00Z"));
    expect(nowHHMMInZone("Not/AZone")).toBe("09:05");
  });
});
