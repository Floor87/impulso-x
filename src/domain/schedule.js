import { getIsoWeekdayFromKey } from "./date.js";

const ROUTINE_DAYS = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
  Domingo: 7,
};

export function normalizeHabitDays(frequency, days) {
  if (frequency === "Diario") return [1, 2, 3, 4, 5, 6, 7];
  if (frequency === "Lunes a viernes") return [1, 2, 3, 4, 5];

  const normalized = Array.isArray(days)
    ? [...new Set(days.map(Number).filter((day) => day >= 1 && day <= 7))].sort()
    : [];

  if (frequency === "3 veces por semana") {
    return normalized.length === 3 ? normalized : [1, 3, 5];
  }
  return normalized.length === 1 ? normalized : [1];
}

export function isHabitScheduledForDate(habit, key) {
  return normalizeHabitDays(habit.frequency, habit.days).includes(getIsoWeekdayFromKey(key));
}

export function isRoutineScheduledForDate(routine, key) {
  return ROUTINE_DAYS[routine.day] === getIsoWeekdayFromKey(key);
}

export function createDayPlan(state, key) {
  return {
    habits: state.habits
      .filter((habit) => isHabitScheduledForDate(habit, key))
      .map((habit) => structuredClone(habit)),
    routines: state.routines
      .filter((routine) => isRoutineScheduledForDate(routine, key))
      .map((routine) => structuredClone(routine)),
    waterGoal: state.waterGoal,
  };
}

export function normalizeTime(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";

  const compact = trimmed
    .replaceAll(".", "")
    .replace(/\s+/g, " ")
    .replace("a m", "am")
    .replace("p m", "pm");
  const match = compact.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?$/);
  if (!match) return trimmed;

  let hour = Number(match[1]);
  const minute = match[2] || "00";
  const period = match[3];

  if (period) {
    if (hour < 1 || hour > 12) return trimmed;
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return trimmed;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}
