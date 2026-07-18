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

export function getCalendarLevel(stats) {
  if (!stats) return "empty";
  if (stats.score >= 80) return "high";
  if (stats.score >= 45) return "medium";
  if (stats.score > 0) return "low";
  return "empty";
}
