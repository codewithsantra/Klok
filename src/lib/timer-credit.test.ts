import { describe, expect, it } from "vitest";
import { creditedRunMs } from "./timer-credit";

const MIN = 60_000;
const HOUR = 60 * MIN;

describe("creditedRunMs", () => {
  it("credits a normal run in full when it stays under target", () => {
    // 30m run on a 2h item with nothing banked yet.
    expect(creditedRunMs(30 * MIN, 0, 2 * HOUR)).toBe(30 * MIN);
  });

  it("credits a run that lands exactly on target", () => {
    expect(creditedRunMs(2 * HOUR, 0, 2 * HOUR)).toBe(2 * HOUR);
  });

  it("caps an overnight run at the target — the real bug", () => {
    // Started ~16:22, remembered at ~09:03 the next day: 16.7h on a 2h item.
    expect(creditedRunMs(16.69 * HOUR, 0, 2 * HOUR)).toBe(2 * HOUR);
  });

  it("caps using the remaining target, not the full target", () => {
    // 90m already banked on a 2h item -> only 30m of headroom left.
    expect(creditedRunMs(10 * HOUR, 90 * MIN, 2 * HOUR)).toBe(30 * MIN);
  });

  it("credits nothing once the target is already met", () => {
    // The timer runs only for its allocated time — no overtime.
    expect(creditedRunMs(20 * MIN, 2 * HOUR, 2 * HOUR)).toBe(0);
    expect(creditedRunMs(16 * HOUR, 2 * HOUR, 2 * HOUR)).toBe(0);
  });

  it("treats a zero/absent target as uncapped rather than swallowing the run", () => {
    expect(creditedRunMs(45 * MIN, 0, 0)).toBe(45 * MIN);
  });

  it("ignores non-positive runs", () => {
    expect(creditedRunMs(0, 0, 2 * HOUR)).toBe(0);
    expect(creditedRunMs(-5 * MIN, 0, 2 * HOUR)).toBe(0);
  });
});
