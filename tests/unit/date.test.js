import { describe, expect, it } from "vitest";

import {
  getAdjacentDateKey,
  getDateKeyFromDate,
  getIsoWeekdayFromKey,
  getLocalDateKey,
  getRecentDateKeys,
  isValidDateKey,
} from "../../src/domain/date.js";

describe("date domain", () => {
  it("uses the device local calendar date", () => {
    const beforeMidnight = new Date(2026, 6, 17, 23, 59, 59);
    const afterMidnight = new Date(2026, 6, 18, 0, 0, 0);

    expect(getLocalDateKey(beforeMidnight)).toBe("2026-07-17");
    expect(getLocalDateKey(afterMidnight)).toBe("2026-07-18");
  });

  it("validates real calendar dates", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("18-07-2026")).toBe(false);
  });

  it("returns ISO weekdays and recent keys", () => {
    expect(getIsoWeekdayFromKey("2026-07-20")).toBe(1);
    expect(getRecentDateKeys(3, new Date(2026, 6, 20))).toEqual([
      "2026-07-20",
      "2026-07-19",
      "2026-07-18",
    ]);
    expect(getDateKeyFromDate(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("moves planning dates across month and year boundaries", () => {
    expect(getAdjacentDateKey("2026-07-31", 1)).toBe("2026-08-01");
    expect(getAdjacentDateKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(() => getAdjacentDateKey("fecha-invalida", 1)).toThrow("invalido");
  });
});
