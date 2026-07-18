export function upsertHabit(state, habit) {
  const exists = state.habits.some((item) => item.id === habit.id);
  state.habits = exists
    ? state.habits.map((item) => (item.id === habit.id ? habit : item))
    : [...state.habits, habit];
}

export function removeHabit(state, id) {
  state.habits = state.habits.filter((habit) => habit.id !== id);
}

export function toggleHabit(day, id) {
  day.habitsDone[id] = !day.habitsDone[id];
  return day.habitsDone[id];
}
