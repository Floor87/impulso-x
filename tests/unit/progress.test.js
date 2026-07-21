import { describe, expect, it } from "vitest";

import {
  getCalendarLevel,
  getDayStats,
  getHabitStreak,
  getWeeklyGoals,
  getWeeklySummary,
} from "../../src/domain/progress.js";

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

  it("counts missing calendar days as zero in the seven-day summary", () => {
    const state = {
      habits: [],
      routines: [],
      waterGoal: 2000,
      days: {
        "2026-07-20": {
          habitsDone: {},
          routinesDone: {},
          meals: [{ id: "m1" }],
          water: 2000,
          plan: { habits: [], routines: [], waterGoal: 2000 },
        },
      },
    };

    expect(getWeeklySummary(state, new Date(2026, 6, 20))).toEqual({
      averageScore: 14,
      averageWater: 286,
      totalTraining: 0,
    });
  });

  it("builds weekly targets from all seven calendar days", () => {
    const habit = {
      id: "h1",
      name: "Leer",
      frequency: "Diario",
      days: [1, 2, 3, 4, 5, 6, 7],
      time: "",
    };
    const state = {
      habits: [habit],
      routines: [],
      waterGoal: 2000,
      days: {
        "2026-07-20": {
          habitsDone: { h1: true },
          routinesDone: {},
          meals: [{ id: "m1" }],
          water: 2000,
          plan: { habits: [habit], routines: [], waterGoal: 2000 },
        },
      },
    };

    expect(getWeeklyGoals(state, new Date(2026, 6, 20))).toEqual({
      dayTarget: 7,
      habitTarget: 7,
      completedHabits: 1,
      waterDays: 1,
      trainingTarget: 0,
      trainingCount: 0,
      foodDays: 1,
    });
  });

  it("breaks a daily habit streak when a scheduled day has no record", () => {
    const habit = {
      id: "h1",
      name: "Leer",
      frequency: "Diario",
      days: [1, 2, 3, 4, 5, 6, 7],
      time: "",
    };
    const state = {
      habits: [habit],
      routines: [],
      waterGoal: 2000,
      days: {
        "2026-07-18": {
          habitsDone: { h1: true },
          routinesDone: {},
          meals: [],
          water: 0,
          plan: { habits: [habit], routines: [], waterGoal: 2000 },
        },
        "2026-07-20": {
          habitsDone: { h1: true },
          routinesDone: {},
          meals: [],
          water: 0,
          plan: { habits: [habit], routines: [], waterGoal: 2000 },
        },
      },
    };

    expect(getHabitStreak(state, "h1", "2026-07-20")).toBe(1);
  });

  it("keeps yesterday's streak while today's habit is still pending", () => {
    const habit = {
      id: "h1",
      name: "Leer",
      frequency: "Diario",
      days: [1, 2, 3, 4, 5, 6, 7],
      time: "",
    };
    const state = {
      habits: [habit],
      routines: [],
      waterGoal: 2000,
      days: {
        "2026-07-19": {
          habitsDone: { h1: true },
          routinesDone: {},
          meals: [],
          water: 0,
          plan: { habits: [habit], routines: [], waterGoal: 2000 },
        },
        "2026-07-20": {
          habitsDone: {},
          routinesDone: {},
          meals: [],
          water: 0,
          plan: { habits: [habit], routines: [], waterGoal: 2000 },
        },
      },
    };

    expect(getHabitStreak(state, "h1", "2026-07-20")).toBe(1);
  });
});
