export function upsertPlannedTask(day, task) {
  const nextTask = {
    id: String(task.id),
    title: String(task.title).trim(),
    time: String(task.time || ""),
    done: Boolean(task.done),
  };
  const index = day.tasks.findIndex((item) => item.id === nextTask.id);
  if (index === -1) {
    day.tasks.push(nextTask);
  } else {
    day.tasks[index] = nextTask;
  }
  return nextTask;
}

export function togglePlannedTask(day, id) {
  const task = day.tasks.find((item) => item.id === id);
  if (!task) return false;
  task.done = !task.done;
  return task.done;
}

export function removePlannedTask(day, id) {
  day.tasks = day.tasks.filter((task) => task.id !== id);
}
