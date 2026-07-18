let currentDayKey = getLocalDateKey();
const storageKey = "impulsox-state";
const legacyStorageKey = "ritmo-diario-state";

const defaultState = {
  version: 2,
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
let editingHabitId = null;
let editingRoutineId = null;

const weekdayLabels = {
  1: "Lun",
  2: "Mar",
  3: "Mie",
  4: "Jue",
  5: "Vie",
  6: "Sab",
  7: "Dom",
};

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
const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");
const sectionTitle = document.querySelector("#sectionTitle");
const currentDate = document.querySelector("#currentDate");
const resetTodayButton = document.querySelector("#resetTodayButton");
const installButton = document.querySelector("#installButton");

const habitForm = document.querySelector("#habitForm");
const habitName = document.querySelector("#habitName");
const habitFrequency = document.querySelector("#habitFrequency");
const habitTime = document.querySelector("#habitTime");
const habitDaysField = document.querySelector("#habitDaysField");
const habitDayInputs = document.querySelectorAll('input[name="habitDay"]');
const habitDaysStatus = document.querySelector("#habitDaysStatus");
const habitFormTitle = document.querySelector("#habitFormTitle");
const habitSubmitButton = document.querySelector("#habitSubmitButton");
const habitCancelButton = document.querySelector("#habitCancelButton");
const habitList = document.querySelector("#habitList");
const todayChecklist = document.querySelector("#todayChecklist");

const trainingForm = document.querySelector("#trainingForm");
const trainingName = document.querySelector("#trainingName");
const trainingDay = document.querySelector("#trainingDay");
const trainingExercises = document.querySelector("#trainingExercises");
const trainingFormTitle = document.querySelector("#trainingFormTitle");
const trainingSubmitButton = document.querySelector("#trainingSubmitButton");
const trainingCancelButton = document.querySelector("#trainingCancelButton");
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
const waterMeter = document.querySelector(".water-meter");
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
const calendarMonthLabel = document.querySelector("#calendarMonthLabel");
const monthlyCalendar = document.querySelector("#monthlyCalendar");
const weeklyGoalList = document.querySelector("#weeklyGoalList");
const exportDataButton = document.querySelector("#exportDataButton");
const importDataInput = document.querySelector("#importDataInput");
const backupStatus = document.querySelector("#backupStatus");

let selectedHistoryDate = currentDayKey;

applyTheme(loadTheme());
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

function loadTheme() {
  return localStorage.getItem("impulsox-theme") || "light";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  themeToggle.checked = nextTheme === "dark";
  themeLabel.textContent = nextTheme === "dark" ? "Oscuro" : "Claro";
  localStorage.setItem("impulsox-theme", nextTheme);
}

function loadState() {
  const saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey);
  if (!saved) return normalizeState(structuredClone(defaultState));

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return normalizeState(structuredClone(defaultState));
  }
}

function normalizeState(rawState, strict = false) {
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

  const nextState = {
    version: 2,
    habits: normalizeHabits(Array.isArray(rawState.habits) ? rawState.habits : defaultState.habits),
    routines: normalizeRoutines(
      Array.isArray(rawState.routines) ? rawState.routines : defaultState.routines,
    ),
    days: {},
    waterGoal: normalizePositiveNumber(rawState.waterGoal, defaultState.waterGoal),
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

function normalizeHabits(habits) {
  return habits
    .filter((habit) => habit && typeof habit === "object")
    .map((habit) => {
      const frequency = ["Diario", "Lunes a viernes", "3 veces por semana", "Semanal"].includes(
        habit.frequency,
      )
        ? habit.frequency
        : "Diario";
      return {
        id: String(habit.id || createId()),
        name: String(habit.name || "Habito").slice(0, 120),
        frequency,
        time: normalizeTime(String(habit.time || "")),
        days: normalizeHabitDays(frequency, habit.days),
      };
    });
}

function normalizeRoutines(routines) {
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

function normalizeHabitDays(frequency, days) {
  if (frequency === "Diario") return [1, 2, 3, 4, 5, 6, 7];
  if (frequency === "Lunes a viernes") return [1, 2, 3, 4, 5];

  const normalized = Array.isArray(days)
    ? [...new Set(days.map(Number).filter((day) => day >= 1 && day <= 7))].sort()
    : [];
  if (frequency === "3 veces por semana") return normalized.length === 3 ? normalized : [1, 3, 5];
  return normalized.length === 1 ? normalized : [1];
}

function normalizeDay(rawDay, currentState, key, strict = false) {
  if (!rawDay || typeof rawDay !== "object" || Array.isArray(rawDay)) {
    if (strict) throw new Error("Dia invalido en el respaldo");
    rawDay = {};
  }

  const day = {
    habitsDone: normalizeDoneMap(rawDay.habitsDone),
    routinesDone: normalizeDoneMap(rawDay.routinesDone),
    meals: normalizeMeals(rawDay.meals),
    water: normalizeNonNegativeNumber(rawDay.water, 0),
    note: String(rawDay.note || "").slice(0, 5000),
    plan: null,
  };

  day.plan = normalizeDayPlan(rawDay.plan, currentState, key);
  return day;
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

function isValidDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split("-").map(Number);
  return getDateKeyFromDate(new Date(year, month - 1, day)) === key;
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
    state.days[currentDayKey] = normalizeDay({
      habitsDone: {},
      routinesDone: {},
      meals: [],
      water: 0,
      note: "",
    }, state, currentDayKey);
  }

  return state.days[currentDayKey];
}

function createDayPlan(currentState, key) {
  return {
    habits: currentState.habits
      .filter((habit) => isHabitScheduledForDate(habit, key))
      .map((habit) => structuredClone(habit)),
    routines: currentState.routines
      .filter((routine) => isRoutineScheduledForDate(routine, key))
      .map((routine) => structuredClone(routine)),
    waterGoal: currentState.waterGoal,
  };
}

function syncCurrentDayPlan(day) {
  day.plan = createDayPlan(state, currentDayKey);
}

function getIsoWeekdayFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
}

function isHabitScheduledForDate(habit, key) {
  return normalizeHabitDays(habit.frequency, habit.days).includes(getIsoWeekdayFromKey(key));
}

function isRoutineScheduledForDate(routine, key) {
  const routineDays = {
    Lunes: 1,
    Martes: 2,
    Miercoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sabado: 6,
    Domingo: 7,
  };
  return routineDays[routine.day] === getIsoWeekdayFromKey(key);
}

function setActiveTab(tabName) {
  activeTab = tabName;
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
  panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tabName));
  sectionTitle.textContent = sectionTitles[tabName];
}

function render() {
  const day = getDay();
  syncCurrentDayPlan(day);
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
  renderMonthlyCalendar();
  renderWeeklyGoals();
  saveState();
}

function renderSummary(day) {
  const completedHabits = day.plan.habits.filter((habit) => day.habitsDone[habit.id]).length;
  const completedRoutines = day.plan.routines.filter(
    (routine) => day.routinesDone[routine.id],
  ).length;
  const waterPercent = Math.min(Math.round((day.water / day.plan.waterGoal) * 100), 100);

  habitSummary.textContent = `${completedHabits}/${day.plan.habits.length}`;
  waterSummary.textContent = `${waterPercent}%`;
  waterSummaryText.textContent = `${day.water} ml de ${day.plan.waterGoal} ml`;
  trainingSummary.textContent = completedRoutines;
  foodSummary.textContent = day.meals.length;
}

function renderHabits(day) {
  habitList.innerHTML = "";
  todayChecklist.innerHTML = "";

  if (!state.habits.length) {
    habitList.append(emptyState("Todavia no agregaste habitos."));
  } else {
    state.habits.forEach((habit) => {
      const scheduledToday = day.plan.habits.some((planned) => planned.id === habit.id);
      const done = scheduledToday && Boolean(day.habitsDone[habit.id]);
      const streak = getHabitStreak(habit.id);
      habitList.append(
        itemElement({
          title: habit.name,
          meta: `${formatHabitSchedule(habit)}${habit.time ? ` · ${habit.time}` : ""} · Racha ${streak}${scheduledToday ? "" : " · No corresponde hoy"}`,
          done,
          onToggle: scheduledToday ? () => toggleHabit(habit.id) : null,
          onEdit: () => startEditingHabit(habit.id),
          onDelete: () => deleteHabit(habit.id),
          deleteLabel: `Eliminar ${habit.name}`,
        }),
      );
    });
  }

  if (!day.plan.habits.length) {
    todayChecklist.append(emptyState("No tenes habitos programados para hoy."));
    return;
  }

  day.plan.habits.forEach((habit) => {
    const done = Boolean(day.habitsDone[habit.id]);
    const streak = getHabitStreak(habit.id);
    todayChecklist.append(
      itemElement({
        title: habit.name,
        meta: `Habito · ${formatHabitSchedule(habit)} · Racha ${streak}`,
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
    const scheduledToday = day.plan.routines.some((planned) => planned.id === routine.id);
    const done = scheduledToday && Boolean(day.routinesDone[routine.id]);
    trainingList.append(
      itemElement({
        title: `${routine.day} · ${routine.name}`,
        meta: `${routine.exercises.replaceAll("\n", " · ")}${scheduledToday ? " · Programada hoy" : ""}`,
        done,
        onToggle: scheduledToday ? () => toggleRoutine(routine.id) : null,
        onEdit: () => startEditingRoutine(routine.id),
        onDelete: () => deleteRoutine(routine.id),
        deleteLabel: `Eliminar ${routine.name}`,
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
  const waterPercent = Math.min(Math.round((day.water / day.plan.waterGoal) * 100), 100);
  waterAmount.textContent = `${day.water} ml`;
  waterGoalText.textContent = `de ${day.plan.waterGoal} ml`;
  waterFill.style.width = `${waterPercent}%`;
  waterMeter.classList.toggle("goal-complete", day.water >= day.plan.waterGoal);
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

function renderMonthlyCalendar() {
  monthlyCalendar.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const todayKey = getDateKeyFromDate(today);

  calendarMonthLabel.textContent = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(firstDay);

  for (let index = 0; index < firstWeekday; index += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar-day placeholder";
    monthlyCalendar.append(blank);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const date = new Date(year, month, dayNumber);
    const key = getDateKeyFromDate(date);
    const day = state.days[key];
    const stats = day ? getDayStats(day) : null;
    const button = document.createElement("button");
    const level = getCalendarLevel(stats);

    button.className = `calendar-day ${level}${key === todayKey ? " today" : ""}`;
    button.type = "button";
    button.textContent = dayNumber;
    button.ariaLabel = stats
      ? `${formatDateKey(key)}, avance ${stats.score}%`
      : `${formatDateKey(key)}, sin datos`;
    button.disabled = !day;

    if (day) {
      button.addEventListener("click", () => {
        selectedHistoryDate = key;
        setActiveTab("progress");
        renderHistory();
      });
    }

    monthlyCalendar.append(button);
  }
}

function renderWeeklyGoals() {
  weeklyGoalList.innerHTML = "";

  const lastSevenKeys = getRecentDateKeys(7);
  const recentDays = lastSevenKeys.map((key) => state.days[key]).filter(Boolean);
  const habitTarget = recentDays.reduce((sum, day) => sum + day.plan.habits.length, 0);
  const completedHabits = recentDays.reduce((sum, day) => {
    return sum + day.plan.habits.filter((habit) => day.habitsDone[habit.id]).length;
  }, 0);
  const waterDays = recentDays.filter((day) => (day.water || 0) >= day.plan.waterGoal).length;
  const trainingTarget = recentDays.reduce((sum, day) => sum + day.plan.routines.length, 0);
  const trainingCount = recentDays.reduce((sum, day) => {
    return sum + day.plan.routines.filter((routine) => day.routinesDone[routine.id]).length;
  }, 0);
  const foodDays = lastSevenKeys.filter((key) => (state.days[key]?.meals || []).length > 0).length;

  const recordedDayTarget = Math.max(recentDays.length, 1);
  weeklyGoalList.append(
    goalElement("Habitos", completedHabits, habitTarget, "realizaciones programadas"),
    goalElement("Agua", waterDays, recordedDayTarget, "dias llegando a tu meta"),
    goalElement("Entreno", trainingCount, trainingTarget, "rutinas programadas"),
    goalElement("Alimentacion", foodDays, recordedDayTarget, "dias con comidas registradas"),
  );
}

function getCalendarLevel(stats) {
  if (!stats) return "empty";
  if (stats.score >= 80) return "high";
  if (stats.score >= 45) return "medium";
  if (stats.score > 0) return "low";
  return "empty";
}

function goalElement(label, value, target, meta) {
  const percent = target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;
  const card = document.createElement("article");
  card.className = "goal-card";
  card.innerHTML = `
    <div>
      <span>${label}</span>
      <strong>${value}/${target}</strong>
    </div>
    <div class="goal-bar" aria-hidden="true">
      <span style="width: ${percent}%"></span>
    </div>
    <p>${meta}</p>
  `;
  return card;
}

function getDayStats(day) {
  const totalHabits = day.plan.habits.length;
  const completedHabits = day.plan.habits.filter((habit) => day.habitsDone[habit.id]).length;
  const completedRoutines = day.plan.routines.filter(
    (routine) => day.routinesDone[routine.id],
  ).length;
  const waterPercent = Math.min(
    Math.round(((day.water || 0) / day.plan.waterGoal) * 100),
    100,
  );
  const habitPercent = totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const foodScore = day.meals.length > 0 ? 100 : 0;
  const categoryScores = [waterPercent, foodScore];
  if (totalHabits > 0) categoryScores.push(habitPercent);
  if (day.plan.routines.length > 0) {
    categoryScores.push(Math.round((completedRoutines / day.plan.routines.length) * 100));
  }
  const score = Math.round(
    categoryScores.reduce((sum, categoryScore) => sum + categoryScore, 0) /
      categoryScores.length,
  );

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
  let firstScheduledDay = true;
  const earliestDayKey = Object.keys(state.days).sort()[0] || currentDayKey;

  while (true) {
    const key = getDateKeyFromDate(date);
    if (key < earliestDayKey) break;
    const day = state.days[key];
    const scheduled = day?.plan?.habits.some((habit) => habit.id === habitId);
    if (scheduled) {
      if (day.habitsDone[habitId]) {
        streak += 1;
      } else if (firstScheduledDay && key === currentDayKey) {
        firstScheduledDay = false;
      } else {
        break;
      }
      firstScheduledDay = false;
    }
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function getPerfectDayStreak() {
  let streak = 0;
  const date = new Date();

  const today = state.days[currentDayKey];
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

function itemElement({ title, meta, done, onToggle, onEdit, onDelete, deleteLabel = "Eliminar" }) {
  const item = document.createElement("article");
  item.className = `item${done ? " done" : ""}${onEdit || onDelete ? "" : " no-actions"}`;

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

  item.append(check, content);

  if (onEdit || onDelete) {
    const actions = document.createElement("div");
    actions.className = "item-actions";

    if (onEdit) {
      const editButton = document.createElement("button");
      editButton.className = "edit-button";
      editButton.type = "button";
      editButton.textContent = "Editar";
      editButton.ariaLabel = `Editar ${title}`;
      editButton.addEventListener("click", onEdit);
      actions.append(editButton);
    }

    if (onDelete) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.ariaLabel = deleteLabel;
      deleteButton.addEventListener("click", onDelete);
      actions.append(deleteButton);
    }

    item.append(actions);
  }
  return item;
}

function emptyState(text) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = text;
  return element;
}

function celebrateWaterGoal() {
  if (navigator.vibrate) navigator.vibrate([45, 35, 65]);

  waterMeter.classList.remove("goal-celebrating");
  void waterMeter.offsetWidth;
  waterMeter.classList.add("goal-celebrating");
  window.setTimeout(() => waterMeter.classList.remove("goal-celebrating"), 1800);
}

function getSelectedHabitDays() {
  return [...habitDayInputs].filter((input) => input.checked).map((input) => Number(input.value));
}

function setSelectedHabitDays(days) {
  habitDayInputs.forEach((input) => {
    input.checked = days.includes(Number(input.value));
  });
}

function syncHabitDayPicker(resetSelection = false) {
  const frequency = habitFrequency.value;
  const needsDays = frequency === "3 veces por semana" || frequency === "Semanal";
  habitDaysField.hidden = !needsDays;
  habitDaysStatus.textContent = "";

  if (!needsDays) {
    setSelectedHabitDays(normalizeHabitDays(frequency, []));
  } else if (resetSelection || getSelectedHabitDays().length === 0) {
    setSelectedHabitDays(frequency === "3 veces por semana" ? [1, 3, 5] : [1]);
  }
}

function validateHabitDays() {
  const selectedDays = getSelectedHabitDays();
  const requiredDays = habitFrequency.value === "3 veces por semana" ? 3 : 1;
  if (!habitDaysField.hidden && selectedDays.length !== requiredDays) {
    habitDaysStatus.textContent = `Selecciona ${requiredDays} ${requiredDays === 1 ? "dia" : "dias"}.`;
    return false;
  }
  habitDaysStatus.textContent = "";
  return true;
}

function formatHabitSchedule(habit) {
  if (habit.frequency === "Diario" || habit.frequency === "Lunes a viernes") {
    return habit.frequency;
  }
  const days = normalizeHabitDays(habit.frequency, habit.days)
    .map((day) => weekdayLabels[day])
    .join(", ");
  return `${habit.frequency} · ${days}`;
}

function startEditingHabit(id) {
  const habit = state.habits.find((item) => item.id === id);
  if (!habit) return;
  editingHabitId = id;
  habitName.value = habit.name;
  habitFrequency.value = habit.frequency;
  habitTime.value = habit.time;
  syncHabitDayPicker();
  setSelectedHabitDays(normalizeHabitDays(habit.frequency, habit.days));
  habitFormTitle.textContent = "Editar habito";
  habitSubmitButton.textContent = "Guardar cambios";
  habitCancelButton.hidden = false;
  habitName.focus();
}

function resetHabitForm() {
  editingHabitId = null;
  habitForm.reset();
  habitFormTitle.textContent = "Agregar habito";
  habitSubmitButton.textContent = "Agregar habito";
  habitCancelButton.hidden = true;
  syncHabitDayPicker(true);
}

function startEditingRoutine(id) {
  const routine = state.routines.find((item) => item.id === id);
  if (!routine) return;
  editingRoutineId = id;
  trainingName.value = routine.name;
  trainingDay.value = routine.day;
  trainingExercises.value = routine.exercises;
  trainingFormTitle.textContent = "Editar rutina";
  trainingSubmitButton.textContent = "Guardar cambios";
  trainingCancelButton.hidden = false;
  trainingName.focus();
}

function resetTrainingForm() {
  editingRoutineId = null;
  trainingForm.reset();
  trainingFormTitle.textContent = "Agregar rutina";
  trainingSubmitButton.textContent = "Guardar rutina";
  trainingCancelButton.hidden = true;
}

function normalizeTime(value) {
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

function toggleHabit(id) {
  const day = getDay();
  day.habitsDone[id] = !day.habitsDone[id];
  render();
}

function deleteHabit(id) {
  const habit = state.habits.find((item) => item.id === id);
  if (!habit || !window.confirm(`Eliminar el habito "${habit.name}"? El historial anterior se conservara.`)) {
    return;
  }
  state.habits = state.habits.filter((habit) => habit.id !== id);
  if (editingHabitId === id) resetHabitForm();
  render();
}

function toggleRoutine(id) {
  const day = getDay();
  day.routinesDone[id] = !day.routinesDone[id];
  render();
}

function deleteRoutine(id) {
  const routine = state.routines.find((item) => item.id === id);
  if (!routine || !window.confirm(`Eliminar la rutina "${routine.name}"? El historial anterior se conservara.`)) {
    return;
  }
  state.routines = state.routines.filter((routine) => routine.id !== id);
  if (editingRoutineId === id) resetTrainingForm();
  render();
}

function deleteMeal(id) {
  const day = getDay();
  const meal = day.meals.find((item) => item.id === id);
  if (!meal || !window.confirm(`Eliminar el registro de ${meal.type.toLowerCase()}?`)) return;
  day.meals = day.meals.filter((meal) => meal.id !== id);
  render();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabList = [...tabs];
    const currentIndex = tabList.indexOf(tab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabList.length) % tabList.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabList.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabList.length - 1;
    setActiveTab(tabList[nextIndex].dataset.tab);
    tabList[nextIndex].focus();
  });
});

themeToggle.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "dark" : "light");
});

habitFrequency.addEventListener("change", () => syncHabitDayPicker(true));
habitTime.addEventListener("input", () => habitTime.setCustomValidity(""));
habitDayInputs.forEach((input) => {
  input.addEventListener("change", () => {
    habitDaysStatus.textContent = "";
  });
});
habitCancelButton.addEventListener("click", resetHabitForm);
trainingCancelButton.addEventListener("click", resetTrainingForm);

startAppButton.addEventListener("click", () => {
  introScreen.classList.add("hidden");
  document.body.classList.remove("intro-active");
  window.setTimeout(() => introScreen.remove(), 380);
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = habitName.value.trim();
  const rawTime = habitTime.value.trim();
  const time = normalizeTime(rawTime);
  if (!name || !validateHabitDays()) return;
  if (rawTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    habitTime.setCustomValidity("Ingresa una hora como 08:00 o 11:00 p.m.");
    habitTime.reportValidity();
    return;
  }
  habitTime.setCustomValidity("");

  const habit = {
    id: editingHabitId || createId(),
    name,
    frequency: habitFrequency.value,
    time,
    days: normalizeHabitDays(habitFrequency.value, getSelectedHabitDays()),
  };
  if (editingHabitId) {
    state.habits = state.habits.map((item) => (item.id === editingHabitId ? habit : item));
  } else {
    state.habits.push(habit);
  }
  resetHabitForm();
  render();
});

trainingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = trainingName.value.trim();
  const exercises = trainingExercises.value.trim();
  if (!name || !exercises) return;

  const routine = {
    id: editingRoutineId || createId(),
    name,
    day: trainingDay.value,
    exercises,
  };
  if (editingRoutineId) {
    state.routines = state.routines.map((item) => (item.id === editingRoutineId ? routine : item));
  } else {
    state.routines.push(routine);
  }
  resetTrainingForm();
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
    const wasComplete = day.water >= day.plan.waterGoal;
    const waterChange = Number(button.dataset.water);
    day.water = Math.max(0, day.water + waterChange);
    render();
    if (!wasComplete && waterChange > 0 && day.water >= day.plan.waterGoal) celebrateWaterGoal();
  });
});

waterGoalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const day = getDay();
  const wasComplete = day.water >= day.plan.waterGoal;
  state.waterGoal = Math.max(250, Number(waterGoalInput.value) || 2000);
  render();
  if (!wasComplete && day.water >= day.plan.waterGoal) celebrateWaterGoal();
});

resetTodayButton.addEventListener("click", () => {
  if (!window.confirm("Reiniciar todo lo registrado hoy? Esta accion no se puede deshacer.")) return;
  state.days[currentDayKey] = normalizeDay({
    habitsDone: {},
    routinesDone: {},
    meals: [],
    water: 0,
    note: "",
  }, state, currentDayKey);
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
    const validatedState = normalizeState(importedState, true);
    state = validatedState;
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

syncHabitDayPicker(true);
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
