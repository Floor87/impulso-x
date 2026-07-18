import { isValidDateKey } from "../domain/date.js";
import { createDayPlan, normalizeHabitDays, normalizeTime } from "../domain/schedule.js";

export const STATE_VERSION = 2;

export function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultState() {
  return {
    version: STATE_VERSION,
    habits: [
      {
        id: createId(),
        name: "Tomar agua al despertar",
        frequency: "Diario",
        time: "08:00",
      },
      {
        id: createId(),
        name: "Mover el cuerpo 20 minutos",
        frequency: "Diario",
        time: "18:00",
      },
    ],
    routines: [
      {
        id: createId(),
        name: "Piernas y gluteos",
        day: "Lunes",
        exercises: "Sentadillas 4x12\nHip thrust 4x10\nPeso muerto 3x10",
      },
    ],
    days: {},
    waterGoal: 2000,
  };
}

export function normalizeState(rawState, strict = false) {
  if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
    throw new Error("Estado invalido");
  }

  if (
    strict &&
    (!Array.isArray(rawState.habits) ||
      !Array.isArray(rawState.routines) ||
      !rawState.days ||
      Array.isArray(rawState.days))
  ) {
    throw new Error("Respaldo incompleto");
  }

  const defaults = createDefaultState();
  const nextState = {
    version: STATE_VERSION,
    habits: normalizeHabits(Array.isArray(rawState.habits) ? rawState.habits : defaults.habits),
    routines: normalizeRoutines(
      Array.isArray(rawState.routines) ? rawState.routines : defaults.routines,
    ),
    days: {},
    waterGoal: normalizePositiveNumber(rawState.waterGoal, defaults.waterGoal),
  };

  const rawDays = rawState.days && typeof rawState.days === "object" ? rawState.days : {};
  Object.entries(rawDays).forEach(([key, rawDay]) => {
    if (!isValidDateKey(key)) {
      if (strict) throw new Error("Fecha invalida en el respaldo");
      return;
    }
    nextState.days[key] = normalizeDay(rawDay, nextState, key, strict);
  });

  return nextState;
}

export function normalizeHabits(habits) {
  return habits
    .filter((habit) => habit && typeof habit === "object")
    .map((habit) => {
      const frequencies = ["Diario", "Lunes a viernes", "3 veces por semana", "Semanal"];
      const frequency = frequencies.includes(habit.frequency) ? habit.frequency : "Diario";
      return {
        id: String(habit.id || createId()),
        name: String(habit.name || "Habito").slice(0, 120),
        frequency,
        time: normalizeTime(String(habit.time || "")),
        days: normalizeHabitDays(frequency, habit.days),
      };
    });
}

export function normalizeRoutines(routines) {
  const validDays = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  return routines
    .filter((routine) => routine && typeof routine === "object")
    .map((routine) => ({
      id: String(routine.id || createId()),
      name: String(routine.name || "Rutina").slice(0, 120),
      day: validDays.includes(routine.day) ? routine.day : "Lunes",
      exercises: String(routine.exercises || "").slice(0, 3000),
    }));
}

export function normalizeDay(rawDay, currentState, key, strict = false) {
  let source = rawDay;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    if (strict) throw new Error("Dia invalido en el respaldo");
    source = {};
  }

  return {
    habitsDone: normalizeDoneMap(source.habitsDone),
    routinesDone: normalizeDoneMap(source.routinesDone),
    meals: normalizeMeals(source.meals),
    water: normalizeNonNegativeNumber(source.water, 0),
    note: String(source.note || "").slice(0, 5000),
    plan: normalizeDayPlan(source.plan, currentState, key),
  };
}

function normalizeDoneMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, done]) => Boolean(done))
      .map(([id]) => [String(id), true]),
  );
}

function normalizeMeals(meals) {
  if (!Array.isArray(meals)) return [];
  return meals
    .filter((meal) => meal && typeof meal === "object")
    .map((meal) => ({
      id: String(meal.id || createId()),
      type: String(meal.type || "Comida").slice(0, 40),
      text: String(meal.text || "").slice(0, 1000),
      feeling: String(meal.feeling || "").slice(0, 300),
    }));
}

function normalizeDayPlan(rawPlan, currentState, key) {
  if (!rawPlan || typeof rawPlan !== "object" || Array.isArray(rawPlan)) {
    return createDayPlan(currentState, key);
  }

  return {
    habits: normalizeHabits(Array.isArray(rawPlan.habits) ? rawPlan.habits : []),
    routines: normalizeRoutines(Array.isArray(rawPlan.routines) ? rawPlan.routines : []),
    waterGoal: normalizePositiveNumber(rawPlan.waterGoal, currentState.waterGoal),
  };
}

function normalizePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : fallback;
}

function normalizeNonNegativeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
}
