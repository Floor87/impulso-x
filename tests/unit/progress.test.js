import { describe, expect, it } from "vitest";

import { getCalendarLevel, getDayStats } from "../../src/domain/progress.js";

describe("progress domain", () => {
  it("calculates category progress without rewriting history", () => {
    const day = {
      habitsDone: { h1: true },
      routinesDone: { r1: true },
      meals: [{ id: "m1" }],
      water: 2000,
      plan: {
        habits: [{ id: "h1" }, { id: "h2" }],
        routines: [{ id: "r1" }],
        waterGoal: 2000,
      },
    };

    expect(getDayStats(day)).toEqual({
      totalHabits: 2,
      completedHabits: 1,
      completedRoutines: 1,
      waterPercent: 100,
      score: 88,
    });
  });

  it("maps scores to calendar levels", () => {
    expect(getCalendarLevel(null)).toBe("empty");
    expect(getCalendarLevel({ score: 20 })).toBe("low");
    expect(getCalendarLevel({ score: 60 })).toBe("medium");
    expect(getCalendarLevel({ score: 90 })).toBe("high");
  });
});
