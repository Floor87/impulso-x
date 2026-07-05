let currentDayKey = getLocalDateKey();
const storageKey = "impulsox-state";
const legacyStorageKey = "ritmo-diario-state";

const defaultState = {
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

let state = loadState();
let activeTab = "today";

const sectionTitles = {
  today: "Tu dia de hoy",
  habits: "Habitos",
  training: "Entrenamiento",
  food: "Alimentacion diaria",
  water: "Agua",
  progress: "Tu progreso",
};

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const introScreen = document.querySelector("#introScreen");
const particleField = document.querySelector("#particleField");
const startAppButton = document.querySelector("#startAppButton");
const sectionTitle = document.querySelector("#sectionTitle");
const currentDate = document.querySelector("#currentDate");
const resetTodayButton = document.querySelector("#resetTodayButton");
const installButton = document.querySelector("#installButton");

const habitForm = document.querySelector("#habitForm");
const habitName = document.querySelector("#habitName");
const habitFrequency = document.querySelector("#habitFrequency");
const habitTime = document.querySelector("#habitTime");
const habitList = document.querySelector("#habitList");
const todayChecklist = document.querySelector("#todayChecklist");

const trainingForm = document.querySelector("#trainingForm");
const trainingName = document.querySelector("#trainingName");
const trainingDay = document.querySelector("#trainingDay");
const trainingExercises = document.querySelector("#trainingExercises");
const trainingList = document.querySelector("#trainingList");

const foodForm = document.querySelector("#foodForm");
const mealType = document.querySelector("#mealType");
const mealText = document.querySelector("#mealText");
const mealFeeling = document.querySelector("#mealFeeling");
const foodList = document.querySelector("#foodList");

const dailyNote = document.querySelector("#dailyNote");
const waterAmount = document.querySelector("#waterAmount");
const waterGoalText = document.querySelector("#waterGoalText");
const waterFill = document.querySelector("#waterFill");
const waterGoalForm = document.querySelector("#waterGoalForm");
const waterGoalInput = document.querySelector("#waterGoalInput");

const habitSummary = document.querySelector("#habitSummary");
const waterSummary = document.querySelector("#waterSummary");
const waterSummaryText = document.querySelector("#waterSummaryText");
const trainingSummary = document.querySelector("#trainingSummary");
const foodSummary = document.querySelector("#foodSummary");
const historyList = document.querySelector("#historyList");
const historyDetail = document.querySelector("#historyDetail");
const historyDetailDate = document.querySelector("#historyDetailDate");
const weeklyScoreSummary = document.querySelector("#weeklyScoreSummary");
const weeklyWaterSummary = document.querySelector("#weeklyWaterSummary");
const weeklyTrainingSummary = document.querySelector("#weeklyTrainingSummary");
const bestStreakSummary = document.querySelector("#bestStreakSummary");
const exportDataButton = document.querySelector("#exportDataButton");
const importDataInput = document.querySelector("#importDataInput");
const backupStatus = document.querySelector("#backupStatus");

let selectedHistoryDate = currentDayKey;

createIntroParticles();

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createIntroParticles() {
  const particleCount = 42;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const golden = index % 3 !== 0;
    particle.style.setProperty("--x", `${Math.round(Math.random() * 100)}%`);
    particle.style.setProperty("--size", `${Math.random() * 4 + 2}px`);
    particle.style.setProperty("--duration", `${Math.random() * 6 + 7}s`);
    particle.style.setProperty("--delay", `${Math.random() * -11}s`);
    particle.style.setProperty("--drift", `${Math.random() * 90 - 45}px`);
    particle.style.setProperty("--opacity", `${Math.random() * 0.38 + 0.26}`);
    particle.style.setProperty(
      "--particle-color",
      golden ? "rgba(255, 205, 35, 0.92)" : "rgba(255, 255, 255, 0.82)",
    );
    particle.style.setProperty(
      "--particle-glow",
      golden ? "rgba(255, 205, 35, 0.7)" : "rgba(255, 255, 255, 0.45)",
    );
    fragment.append(particle);
  }

  particleField.append(fragment);
}

function loadState() {
  const saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey);
  if (!saved) return structuredClone(defaultState);

  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function getLocalDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getDay() {
  if (!state.days[currentDayKey]) {
    state.days[currentDayKey] = {
      habitsDone: {},
      routinesDone: {},
      meals: [],
      water: 0,
      note: "",
    };
  }

  return state.days[currentDayKey];
}

function setActiveTab(tabName) {
  activeTab = tabName;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tabName));
  sectionTitle.textContent = sectionTitles[tabName];
}

function render() {
  const day = getDay();
  const dateFormatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  currentDate.textContent = dateFormatter.format(new Date());
  dailyNote.value = day.note;
  waterGoalInput.value = state.waterGoal;

  renderHabits(day);
  renderTraining(day);
  renderMeals(day);
  renderWater(day);
  renderSummary(day);
  renderHistory();
  renderProgressSummary();
  saveState();
}

function renderSummary(day) {
  const completedHabits = state.habits.filter((habit) => day.habitsDone[habit.id]).length;
  const completedRoutines = state.routines.filter((routine) => day.routinesDone[routine.id]).length;
  const waterPercent = Math.min(Math.round((day.water / state.waterGoal) * 100), 100);

  habitSummary.textContent = `${completedHabits}/${state.habits.length}`;
  waterSummary.textContent = `${waterPercent}%`;
  waterSummaryText.textContent = `${day.water} ml de ${state.waterGoal} ml`;
  trainingSummary.textContent = completedRoutines;
  foodSummary.textContent = day.meals.length;
}

function renderHabits(day) {
  habitList.innerHTML = "";
  todayChecklist.innerHTML = "";

  if (!state.habits.length) {
    habitList.append(emptyState("Todavia no agregaste habitos."));
    todayChecklist.append(emptyState("Agrega habitos para ver tu checklist."));
    return;
  }

  state.habits.forEach((habit) => {
    const done = Boolean(day.habitsDone[habit.id]);
    const streak = getHabitStreak(habit.id);
    habitList.append(
      itemElement({
        title: habit.name,
        meta: `${habit.frequency}${habit.time ? ` · ${habit.time}` : ""} · Racha ${streak}`,
        done,
        onToggle: () => toggleHabit(habit.id),
        onDelete: () => deleteHabit(habit.id),
      }),
    );

    todayChecklist.append(
      itemElement({
        title: habit.name,
        meta: `Habito · ${habit.frequency} · Racha ${streak}`,
        done,
        onToggle: () => toggleHabit(habit.id),
      }),
    );
  });
}

function renderTraining(day) {
  trainingList.innerHTML = "";

  if (!state.routines.length) {
    trainingList.append(emptyState("Agrega tu primera rutina de entrenamiento."));
    return;
  }

  state.routines.forEach((routine) => {
    const done = Boolean(day.routinesDone[routine.id]);
    trainingList.append(
      itemElement({
        title: `${routine.day} · ${routine.name}`,
        meta: routine.exercises.replaceAll("\n", " · "),
        done,
        onToggle: () => toggleRoutine(routine.id),
        onDelete: () => deleteRoutine(routine.id),
      }),
    );
  });
}

function renderMeals(day) {
  foodList.innerHTML = "";

  if (!day.meals.length) {
    foodList.append(emptyState("Todavia no registraste comidas hoy."));
    return;
  }

  day.meals.forEach((meal) => {
    const meta = [meal.text, meal.feeling ? `Te sentiste: ${meal.feeling}` : ""]
      .filter(Boolean)
      .join(" · ");
    foodList.append(
      itemElement({
        title: meal.type,
        meta,
        done: true,
        onToggle: null,
        onDelete: () => deleteMeal(meal.id),
      }),
    );
  });
}

function renderWater(day) {
  const waterPercent = Math.min(Math.round((day.water / state.waterGoal) * 100), 100);
  waterAmount.textContent = `${day.water} ml`;
  waterGoalText.textContent = `de ${state.waterGoal} ml`;
  waterFill.style.width = `${waterPercent}%`;
}

function renderHistory() {
  historyList.innerHTML = "";
  historyDetail.innerHTML = "";

  const dayKeys = Object.keys(state.days).sort((a, b) => b.localeCompare(a));
  if (!dayKeys.length) {
    historyList.append(emptyState("Todavia no hay dias guardados."));
    historyDetail.append(emptyState("Cuando completes tu dia, vas a verlo aca."));
    historyDetailDate.textContent = "Sin datos todavia.";
    return;
  }

  if (!dayKeys.includes(selectedHistoryDate)) selectedHistoryDate = dayKeys[0];

  dayKeys.forEach((key) => {
    const day = state.days[key];
    const stats = getDayStats(day);
    const button = document.createElement("button");
    button.className = `history-day${key === selectedHistoryDate ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>${formatDateKey(key)}</span>
      <strong>${stats.score}%</strong>
      <small>${stats.completedHabits}/${stats.totalHabits} habitos · ${stats.waterPercent}% agua</small>
    `;
    button.addEventListener("click", () => {
      selectedHistoryDate = key;
      renderHistory();
    });
    historyList.append(button);
  });

  const selectedDay = state.days[selectedHistoryDate];
  const selectedStats = getDayStats(selectedDay);
  historyDetailDate.textContent = formatDateKey(selectedHistoryDate);

  const details = document.createElement("div");
  details.className = "history-detail-grid";
  details.append(
    statPill("Habitos", `${selectedStats.completedHabits}/${selectedStats.totalHabits}`),
    statPill("Agua", `${selectedDay.water || 0} ml`),
    statPill("Entreno", selectedStats.completedRoutines),
    statPill("Comidas", selectedDay.meals.length),
  );

  const meals = selectedDay.meals.length
    ? selectedDay.meals.map((meal) => `${meal.type}: ${meal.text}`).join(" · ")
    : "Sin comidas registradas.";
  const note = selectedDay.note || "Sin nota diaria.";

  const text = document.createElement("div");
  text.className = "history-notes";
  text.innerHTML = `
    <p><strong>Alimentacion:</strong> ${escapeHtml(meals)}</p>
    <p><strong>Nota:</strong> ${escapeHtml(note)}</p>
  `;

  historyDetail.append(details, text);
}

function renderProgressSummary() {
  const lastSevenKeys = getRecentDateKeys(7);
  const existingDays = lastSevenKeys.map((key) => state.days[key]).filter(Boolean);
  const scores = existingDays.map((day) => getDayStats(day).score);
  const totalWater = existingDays.reduce((sum, day) => sum + (day.water || 0), 0);
  const totalTraining = existingDays.reduce(
    (sum, day) => sum + getDayStats(day).completedRoutines,
    0,
  );
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const averageWater = existingDays.length ? Math.round(totalWater / existingDays.length) : 0;

  weeklyScoreSummary.textContent = `${averageScore}%`;
  weeklyWaterSummary.textContent = `${averageWater} ml`;
  weeklyTrainingSummary.textContent = totalTraining;
  bestStreakSummary.textContent = getPerfectDayStreak();
}

function getDayStats(day) {
  const totalHabits = state.habits.length;
  const completedHabits = state.habits.filter((habit) => day.habitsDone[habit.id]).length;
  const completedRoutines = state.routines.filter((routine) => day.routinesDone[routine.id]).length;
  const waterPercent = Math.min(Math.round(((day.water || 0) / state.waterGoal) * 100), 100);
  const habitPercent = totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const trainingScore = completedRoutines > 0 ? 100 : 0;
  const foodScore = day.meals.length > 0 ? 100 : 0;
  const score = Math.round((habitPercent + waterPercent + trainingScore + foodScore) / 4);

  return {
    totalHabits,
    completedHabits,
    completedRoutines,
    waterPercent,
    score,
  };
}

function getRecentDateKeys(amount) {
  const keys = [];
  const date = new Date();
  for (let index = 0; index < amount; index += 1) {
    const copy = new Date(date);
    copy.setDate(date.getDate() - index);
    const year = copy.getFullYear();
    const month = String(copy.getMonth() + 1).padStart(2, "0");
    const day = String(copy.getDate()).padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
  }
  return keys;
}

function getHabitStreak(habitId) {
  let streak = 0;
  const date = new Date();

  while (true) {
    const key = getDateKeyFromDate(date);
    const day = state.days[key];
    if (!day || !day.habitsDone[habitId]) break;
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function getPerfectDayStreak() {
  let streak = 0;
  const date = new Date();

  while (true) {
    const key = getDateKeyFromDate(date);
    const day = state.days[key];
    if (!day || getDayStats(day).score < 100) break;
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function getDateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function statPill(label, value) {
  const pill = document.createElement("div");
  pill.className = "stat-pill";
  pill.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return pill;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function itemElement({ title, meta, done, onToggle, onDelete }) {
  const item = document.createElement("article");
  item.className = `item${done ? " done" : ""}`;

  const check = document.createElement("button");
  check.className = "check-button";
  check.type = "button";
  check.textContent = "✓";
  check.ariaLabel = done ? "Marcar como pendiente" : "Marcar como realizado";
  check.disabled = !onToggle;
  if (onToggle) check.addEventListener("click", onToggle);

  const content = document.createElement("div");
  const itemTitle = document.createElement("p");
  itemTitle.className = "item-title";
  itemTitle.textContent = title;
  const itemMeta = document.createElement("span");
  itemMeta.className = "item-meta";
  itemMeta.textContent = meta;
  content.append(itemTitle, itemMeta);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.ariaLabel = "Eliminar";
  if (onDelete) deleteButton.addEventListener("click", onDelete);

  item.append(check, content, deleteButton);
  return item;
}

function emptyState(text) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = text;
  return element;
}

function toggleHabit(id) {
  const day = getDay();
  day.habitsDone[id] = !day.habitsDone[id];
  render();
}

function deleteHabit(id) {
  state.habits = state.habits.filter((habit) => habit.id !== id);
  Object.values(state.days).forEach((day) => delete day.habitsDone[id]);
  render();
}

function toggleRoutine(id) {
  const day = getDay();
  day.routinesDone[id] = !day.routinesDone[id];
  render();
}

function deleteRoutine(id) {
  state.routines = state.routines.filter((routine) => routine.id !== id);
  Object.values(state.days).forEach((day) => delete day.routinesDone[id]);
  render();
}

function deleteMeal(id) {
  const day = getDay();
  day.meals = day.meals.filter((meal) => meal.id !== id);
  render();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

startAppButton.addEventListener("click", () => {
  introScreen.classList.add("hidden");
  document.body.classList.remove("intro-active");
  window.setTimeout(() => introScreen.remove(), 380);
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = habitName.value.trim();
  if (!name) return;

  state.habits.push({
    id: createId(),
    name,
    frequency: habitFrequency.value,
    time: habitTime.value,
  });
  habitForm.reset();
  render();
});

trainingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = trainingName.value.trim();
  const exercises = trainingExercises.value.trim();
  if (!name || !exercises) return;

  state.routines.push({
    id: createId(),
    name,
    day: trainingDay.value,
    exercises,
  });
  trainingForm.reset();
  render();
});

foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = mealText.value.trim();
  const feeling = mealFeeling.value.trim();
  if (!text) return;

  const day = getDay();
  day.meals.push({
    id: createId(),
    type: mealType.value,
    text,
    feeling,
  });
  foodForm.reset();
  render();
});

dailyNote.addEventListener("input", () => {
  getDay().note = dailyNote.value;
  saveState();
});

document.querySelectorAll("[data-water]").forEach((button) => {
  button.addEventListener("click", () => {
    const day = getDay();
    day.water = Math.max(0, day.water + Number(button.dataset.water));
    render();
  });
});

waterGoalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.waterGoal = Math.max(250, Number(waterGoalInput.value) || 2000);
  render();
});

resetTodayButton.addEventListener("click", () => {
  state.days[currentDayKey] = {
    habitsDone: {},
    routinesDone: {},
    meals: [],
    water: 0,
    note: "",
  };
  render();
});

exportDataButton.addEventListener("click", () => {
  const payload = {
    app: "IMPULSOX",
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `impulsox-respaldo-${currentDayKey}.json`;
  link.click();
  URL.revokeObjectURL(url);
  backupStatus.textContent = "Respaldo descargado.";
});

importDataInput.addEventListener("change", async () => {
  const file = importDataInput.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    const importedState = backup.state || backup;
    if (!importedState.days || !Array.isArray(importedState.habits)) {
      throw new Error("Formato invalido");
    }

    state = { ...structuredClone(defaultState), ...importedState };
    selectedHistoryDate = currentDayKey;
    saveState();
    render();
    backupStatus.textContent = "Respaldo importado correctamente.";
  } catch {
    backupStatus.textContent = "No se pudo importar ese archivo.";
  } finally {
    importDataInput.value = "";
  }
});

setActiveTab(activeTab);
render();
watchForNewDay();

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function watchForNewDay() {
  const checkForNewDay = () => {
    const nextDayKey = getLocalDateKey();
    if (nextDayKey === currentDayKey) return;

    currentDayKey = nextDayKey;
    selectedHistoryDate = currentDayKey;
    render();
  };

  window.setInterval(checkForNewDay, 60000);
  window.addEventListener("focus", checkForNewDay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkForNewDay();
  });
}
