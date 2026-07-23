import { describe, expect, it } from "vitest";

import { addMeal, removeMeal } from "../../src/features/food.js";
import { removeHabit, toggleHabit, upsertHabit } from "../../src/features/habits.js";
import {
  removePlannedTask,
  togglePlannedTask,
  upsertPlannedTask,
} from "../../src/features/planner.js";
import { removeRoutine, toggleRoutine, upsertRoutine } from "../../src/features/training.js";
import { changeWater, updateWaterGoal } from "../../src/features/water.js";

describe("feature commands", () => {
  it("edits and removes habits and routines", () => {
    const state = { habits: [], routines: [], waterGoal: 2000 };
    upsertHabit(state, { id: "h1", name: "Leer" });
    upsertHabit(state, { id: "h1", name: "Leer 20 minutos" });
    upsertRoutine(state, { id: "r1", name: "Piernas" });

    expect(state.habits[0].name).toBe("Leer 20 minutos");
    removeHabit(state, "h1");
    removeRoutine(state, "r1");
    expect(state.habits).toEqual([]);
    expect(state.routines).toEqual([]);
  });

  it("toggles completions and manages meals", () => {
    const day = { habitsDone: {}, routinesDone: {}, meals: [] };
    expect(toggleHabit(day, "h1")).toBe(true);
    expect(toggleRoutine(day, "r1")).toBe(true);
    addMeal(day, { id: "m1", text: "Fruta" });
    removeMeal(day, "m1");
    expect(day.meals).toEqual([]);
  });

  it("reports the transition into a water goal", () => {
    const state = { waterGoal: 2000 };
    const day = { water: 1750, plan: { waterGoal: 2000 } };
    expect(changeWater(day, 250)).toEqual({ wasComplete: false, isComplete: true });
    expect(day.water).toBe(2000);
    expect(updateWaterGoal(state, 2500)).toBe(2500);
  });

  it("adds, edits, completes and removes planned tasks", () => {
    const day = { tasks: [] };
    upsertPlannedTask(day, {
      id: "t1",
      title: "Preparar la ropa",
      time: "21:00",
      done: false,
    });
    upsertPlannedTask(day, {
      id: "t1",
      title: "Preparar ropa y botella",
      time: "21:30",
      done: false,
    });

    expect(day.tasks).toHaveLength(1);
    expect(day.tasks[0].title).toBe("Preparar ropa y botella");
    expect(togglePlannedTask(day, "t1")).toBe(true);
    removePlannedTask(day, "t1");
    expect(day.tasks).toEqual([]);
  });
});
