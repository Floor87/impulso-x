import { describe, expect, it } from "vitest";

import {
  createDayPlan,
  isHabitScheduledForDate,
  isRoutineScheduledForDate,
  normalizeHabitDays,
  normalizeTime,
} from "../../src/domain/schedule.js";

describe("schedule domain", () => {
  it("normalizes weekly frequencies", () => {
    expect(normalizeHabitDays("Diario", [])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(normalizeHabitDays("Lunes a viernes", [])).toEqual([1, 2, 3, 4, 5]);
    expect(normalizeHabitDays("3 veces por semana", [5, 1, 3])).toEqual([1, 3, 5]);
    expect(normalizeHabitDays("Semanal", [4])).toEqual([4]);
  });

  it("accepts 24-hour and meridiem times", () => {
    expect(normalizeTime("08:15")).toBe("08:15");
    expect(normalizeTime("11:00 p.m.")).toBe("23:00");
    expect(normalizeTime("12 am")).toBe("00:00");
    expect(normalizeTime("25:00")).toBe("25:00");
  });

  it("builds a stable day plan from scheduled items", () => {
    const habit = { id: "h1", name: "Leer", frequency: "Semanal", days: [1], time: "" };
    const routine = { id: "r1", name: "Piernas", day: "Lunes", exercises: "Sentadillas" };
    const state = { habits: [habit], routines: [routine], waterGoal: 2500 };

    expect(isHabitScheduledForDate(habit, "2026-07-20")).toBe(true);
    expect(isRoutineScheduledForDate(routine, "2026-07-20")).toBe(true);
    expect(createDayPlan(state, "2026-07-20")).toEqual({
      habits: [habit],
      routines: [routine],
      waterGoal: 2500,
    });
  });
});
