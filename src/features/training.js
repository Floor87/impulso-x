export function upsertRoutine(state, routine) {
  const exists = state.routines.some((item) => item.id === routine.id);
  state.routines = exists
    ? state.routines.map((item) => (item.id === routine.id ? routine : item))
    : [...state.routines, routine];
}

export function removeRoutine(state, id) {
  state.routines = state.routines.filter((routine) => routine.id !== id);
}

export function toggleRoutine(day, id) {
  day.routinesDone[id] = !day.routinesDone[id];
  return day.routinesDone[id];
}
