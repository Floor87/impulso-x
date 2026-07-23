import { getDateKeyFromDate, getRecentDateKeys } from "./date.js";
import { createDayPlan, isHabitScheduledForDate } from "./schedule.js";

export function getDayStats(day) {
  const plan = day.plan || { habits: [], routines: [], waterGoal: 2000 };
  const totalHabits = plan.habits.length;
  const completedHabits = plan.habits.filter((habit) => day.habitsDone[habit.id]).length;
  const completedRoutines = plan.routines.filter((routine) => day.routinesDone[routine.id]).length;
  const waterPercent = Math.min(
    Math.round(((day.water || 0) / Math.max(plan.waterGoal, 1)) * 100),
    100,
  );
  const habitPercent = totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const categoryScores = [waterPercent, day.meals.length > 0 ? 100 : 0];

  if (totalHabits > 0) categoryScores.push(habitPercent);
  if (plan.routines.length > 0) {
    categoryScores.push(Math.round((completedRoutines / plan.routines.length) * 100));
  }

  return {
    totalHabits,
    completedHabits,
    completedRoutines,
    waterPercent,
    score: Math.round(
      categoryScores.reduce((sum, categoryScore) => sum + categoryScore, 0) / categoryScores.length,
    ),
  };
}

export function getWeeklySummary(state, now = new Date()) {
  const dateKeys = getRecentDateKeys(7, now);
  const scores = dateKeys.map((key) => (state.days[key] ? getDayStats(state.days[key]).score : 0));
  const totalWater = dateKeys.reduce((sum, key) => sum + (state.days[key]?.water || 0), 0);
  const totalTraining = dateKeys.reduce(
    (sum, key) => sum + (state.days[key] ? getDayStats(state.days[key]).completedRoutines : 0),
    0,
  );

  return {
    averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / dateKeys.length),
    averageWater: Math.round(totalWater / dateKeys.length),
    totalTraining,
  };
}

export function getWeeklyGoals(state, now = new Date()) {
  const dateKeys = getRecentDateKeys(7, now);

  return dateKeys.reduce(
    (goals, key) => {
      const day = state.days[key];
      const plan = day?.plan || createDayPlan(state, key);

      goals.habitTarget += plan.habits.length;
      goals.completedHabits += plan.habits.filter((habit) => day?.habitsDone?.[habit.id]).length;
      goals.waterDays += day && (day.water || 0) >= plan.waterGoal ? 1 : 0;
      goals.trainingTarget += plan.routines.length;
      goals.trainingCount += plan.routines.filter(
        (routine) => day?.routinesDone?.[routine.id],
      ).length;
      goals.foodDays += day?.meals?.length > 0 ? 1 : 0;
      return goals;
    },
    {
      dayTarget: dateKeys.length,
      habitTarget: 0,
      completedHabits: 0,
      waterDays: 0,
      trainingTarget: 0,
      trainingCount: 0,
      foodDays: 0,
    },
  );
}

export function getHabitStreak(state, habitId, todayKey) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return 0;

  let streak = 0;
  const date = dateFromKey(todayKey);
  const earliestDayKey = Object.keys(state.days).sort()[0] || todayKey;

  while (true) {
    const key = getDateKeyFromDate(date);
    if (key < earliestDayKey) break;

    const day = state.days[key];
    const scheduled = day?.plan
      ? day.plan.habits.some((plannedHabit) => plannedHabit.id === habitId)
      : isHabitScheduledForDate(habit, key);

    if (scheduled) {
      if (day?.habitsDone?.[habitId]) {
        streak += 1;
      } else if (key !== todayKey) {
        break;
      }
    }

    date.setDate(date.getDate() - 1);
  }

  return streak;
}

export function getPerfectDayStreak(state, todayKey) {
  let streak = 0;
  const date = dateFromKey(todayKey);
  const today = state.days[todayKey];

  if (!today || getDayStats(today).score < 100) date.setDate(date.getDate() - 1);

  while (true) {
    const key = getDateKeyFromDate(date);
    const day = state.days[key];
    if (!day || getDayStats(day).score < 100) break;
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

export function getCalendarLevel(stats) {
  if (!stats) return "empty";
  if (stats.score >= 80) return "high";
  if (stats.score >= 45) return "medium";
  if (stats.score > 0) return "low";
  return "empty";
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}
