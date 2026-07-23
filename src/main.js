import "./styles.css";

import { createAuthService } from "./auth/create-auth-service.js";
import { createAuthUi } from "./auth/auth-ui.js";
import { getUserLabel } from "./auth/supabase-auth-service.js";
import { LocalDataRepository } from "./data/local-data-repository.js";
import { SupabaseDataRepository } from "./data/supabase-data-repository.js";
import { createDefaultState, createId, normalizeDay, normalizeState } from "./data/state.js";
import { getDateKeyFromDate, getLocalDateKey } from "./domain/date.js";
import {
  getCalendarLevel,
  getDayStats,
  getHabitStreak,
  getPerfectDayStreak,
  getWeeklyGoals,
  getWeeklySummary,
} from "./domain/progress.js";
import { createDayPlan, normalizeHabitDays, normalizeTime } from "./domain/schedule.js";
import { addMeal, removeMeal } from "./features/food.js";
import { removeHabit, toggleHabit as toggleHabitState, upsertHabit } from "./features/habits.js";
import {
  removeRoutine,
  toggleRoutine as toggleRoutineState,
  upsertRoutine,
} from "./features/training.js";
import { changeWater, updateWaterGoal } from "./features/water.js";
import { activateTab, bindTabNavigation } from "./ui/navigation.js";

const preferenceRepository = new LocalDataRepository();
let repository = null;
let authService = null;
let currentUserId = null;
let enteringUserId = null;
let enteringUserPromise = null;
let authGeneration = 0;
let currentDayKey = getLocalDateKey();
let startupPersistenceError = null;
let state = null;

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
const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");
const sectionTitle = document.querySelector("#sectionTitle");
const currentDate = document.querySelector("#currentDate");
const resetTodayButton = document.querySelector("#resetTodayButton");
const installButton = document.querySelector("#installButton");
const appShell = document.querySelector(".app-shell");
const accountName = document.querySelector("#accountName");
const signOutButton = document.querySelector("#signOutButton");

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
const backupActions = document.querySelector(".backup-actions");

let selectedHistoryDate = currentDayKey;
let statusTimer = null;
let statusAction = null;
let pendingStartupNotice = null;
const appStatus = createAppStatus();
const restoreDataButton = createRestoreDataButton();
const authUi = createAuthUi({
  root: introScreen,
  onSignIn: signIn,
  onSignUp: signUp,
  onResetRequest: requestPasswordReset,
  onPasswordUpdate: updatePassword,
});

appShell.inert = true;
appShell.setAttribute("aria-hidden", "true");
introScreen.setAttribute("role", "dialog");
introScreen.setAttribute("aria-modal", "true");
applyTheme(loadTheme());
createIntroParticles();

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

async function bootstrapAuthentication() {
  try {
    authService = await createAuthService();
    if (!authService) {
      authUi.showConfigurationError();
      return;
    }

    authService.onAuthStateChange((event, session) => {
      window.setTimeout(() => handleAuthEvent(event, session), 0);
    });
    const session = await authService.getSession();
    if (session) {
      await enterAuthenticatedApp(session);
    } else {
      lockApp();
    }
  } catch {
    authUi.showConfigurationError(
      "No pudimos conectar el acceso seguro. Intentá nuevamente más tarde.",
    );
  }
}

async function handleAuthEvent(event, session) {
  if (event === "PASSWORD_RECOVERY") {
    lockApp({ preserveMode: true });
    authUi.setMode("update");
    return;
  }
  if (event === "SIGNED_OUT") {
    lockApp();
    return;
  }
  if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
    await enterAuthenticatedApp(session);
  }
}

async function signIn(credentials) {
  const session = await authService.signIn(credentials);
  if (session) await enterAuthenticatedApp(session);
}

async function signUp(credentials) {
  const data = await authService.signUp({
    ...credentials,
    redirectTo: getAuthRedirectUrl(),
  });
  if (data.session) {
    await enterAuthenticatedApp(data.session);
    return null;
  }
  return {
    message: "Cuenta creada. Revisá tu correo para confirmarla antes de ingresar.",
    nextMode: "login",
  };
}

async function requestPasswordReset(email) {
  await authService.requestPasswordReset(email, getAuthRedirectUrl());
  return {
    message: "Si el correo está registrado, vas a recibir un enlace para cambiar la clave.",
    nextMode: "login",
  };
}

async function updatePassword(password) {
  await authService.updatePassword(password);
  const session = await authService.getSession();
  if (session) await enterAuthenticatedApp(session);
  return { message: "La clave fue actualizada." };
}

function getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function enterAuthenticatedApp(session) {
  const user = session?.user;
  if (!user?.id || (currentUserId === user.id && state)) return;

  if (enteringUserId === user.id && enteringUserPromise) {
    await enteringUserPromise;
    return;
  }

  enteringUserId = user.id;
  const entryGeneration = ++authGeneration;
  enteringUserPromise = initializeAuthenticatedApp(user, entryGeneration);
  try {
    await enteringUserPromise;
  } finally {
    if (enteringUserId === user.id) {
      enteringUserId = null;
      enteringUserPromise = null;
    }
  }
}

async function initializeAuthenticatedApp(user, entryGeneration) {
  const dataClient = authService.getDataClient?.();
  const userRepository = dataClient
    ? new SupabaseDataRepository(dataClient, {
        storage: globalThis.localStorage,
        userId: user.id,
        onSyncError: showPersistenceError,
      })
    : new LocalDataRepository(globalThis.localStorage, { userId: user.id });
  let userState;
  let persistenceError = null;
  try {
    userState = await userRepository.load();
  } catch (error) {
    persistenceError = error;
    userState = normalizeState(createDefaultState());
  }

  if (entryGeneration !== authGeneration) return;

  currentUserId = user.id;
  repository = userRepository;
  state = userState;

  currentDayKey = getLocalDateKey();
  selectedHistoryDate = currentDayKey;
  accountName.textContent = getUserLabel(user);
  render();
  syncRecoveryAvailability();

  const repositoryNotice = repository.consumeNotice();
  if (persistenceError) {
    pendingStartupNotice = { message: persistenceError.message, tone: "error" };
  } else if (repositoryNotice) {
    pendingStartupNotice = { message: repositoryNotice.message, tone: "warning" };
  }
  unlockApp();
}

function unlockApp() {
  introScreen.classList.add("hidden");
  introScreen.setAttribute("aria-hidden", "true");
  document.body.classList.remove("intro-active");
  appShell.inert = false;
  appShell.removeAttribute("aria-hidden");
  sectionTitle.tabIndex = -1;
  sectionTitle.focus();
  if (pendingStartupNotice) {
    showAppStatus(pendingStartupNotice.message, {
      tone: pendingStartupNotice.tone,
      persistent: true,
    });
    pendingStartupNotice = null;
  }
}

function lockApp({ preserveMode = false } = {}) {
  authGeneration += 1;
  currentUserId = null;
  enteringUserId = null;
  enteringUserPromise = null;
  state = null;
  repository = null;
  hideAppStatus();
  appShell.inert = true;
  appShell.setAttribute("aria-hidden", "true");
  document.body.classList.add("intro-active");
  introScreen.classList.remove("hidden");
  introScreen.removeAttribute("aria-hidden");
  accountName.textContent = "Usuario";
  if (!preserveMode) authUi.showWelcome();
}

function loadTheme() {
  try {
    return preferenceRepository.getPreference("theme", "light");
  } catch (error) {
    startupPersistenceError ||= error;
    return "light";
  }
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  themeToggle.checked = nextTheme === "dark";
  themeLabel.textContent = nextTheme === "dark" ? "Oscuro" : "Claro";
  try {
    preferenceRepository.setPreference("theme", nextTheme);
  } catch (error) {
    showPersistenceError(error);
  }
}

function saveState() {
  if (!repository || !state) return false;
  try {
    state = repository.save(state);
    return true;
  } catch (error) {
    showPersistenceError(error);
    return false;
  }
}

function createAppStatus() {
  const element = document.createElement("div");
  element.className = "app-status";
  element.hidden = true;
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.innerHTML = `
    <p></p>
    <div class="app-status-actions">
      <button class="app-status-action" type="button" hidden></button>
      <button class="app-status-close" type="button" aria-label="Cerrar aviso">×</button>
    </div>
  `;
  document.body.append(element);

  const actionButton = element.querySelector(".app-status-action");
  const closeButton = element.querySelector(".app-status-close");
  actionButton.addEventListener("click", () => {
    const action = statusAction;
    hideAppStatus();
    action?.();
  });
  closeButton.addEventListener("click", hideAppStatus);

  return {
    element,
    message: element.querySelector("p"),
    actionButton,
  };
}

function showAppStatus(
  message,
  { tone = "info", actionLabel = "", onAction = null, persistent = false } = {},
) {
  window.clearTimeout(statusTimer);
  statusAction = onAction;
  appStatus.message.textContent = message;
  appStatus.element.dataset.tone = tone;
  appStatus.element.setAttribute("role", tone === "error" ? "alert" : "status");
  appStatus.actionButton.textContent = actionLabel;
  appStatus.actionButton.hidden = !actionLabel || !onAction;
  appStatus.element.hidden = false;

  if (!persistent) statusTimer = window.setTimeout(hideAppStatus, 7000);
}

function hideAppStatus() {
  window.clearTimeout(statusTimer);
  statusAction = null;
  appStatus.element.hidden = true;
}

function showPersistenceError(error) {
  const message =
    error?.message ||
    "No pudimos guardar los cambios. Tus datos siguen visibles en esta sesion, pero necesitan un respaldo.";
  if (document.body.classList.contains("intro-active")) {
    pendingStartupNotice = { message, tone: "error" };
    return;
  }
  showAppStatus(message, { tone: "error", persistent: true });
}

function createRecoveryPoint(reason) {
  try {
    repository.createRecoveryPoint(state, reason);
    restoreDataButton.hidden = false;
    return true;
  } catch (error) {
    showPersistenceError(error);
    return false;
  }
}

function createRestoreDataButton() {
  const button = document.createElement("button");
  button.className = "secondary-button";
  button.type = "button";
  button.textContent = "Recuperar ultimo cambio";
  button.hidden = true;
  button.addEventListener("click", () => {
    if (!window.confirm("Recuperar la copia anterior al ultimo reinicio o importacion?")) return;
    restoreLastRecovery("Recuperamos la ultima copia automatica disponible.");
  });
  backupActions.append(button);
  return button;
}

function syncRecoveryAvailability() {
  try {
    const recovery = repository.getRecoveryInfo();
    restoreDataButton.hidden = !recovery;
    if (recovery) {
      backupStatus.textContent = "Hay una copia automatica disponible para recuperar.";
    }
  } catch (error) {
    showPersistenceError(error);
  }
}

function restoreLastRecovery(successMessage) {
  try {
    state = repository.restoreRecoveryPoint();
    selectedHistoryDate = currentDayKey;
    render();
    showAppStatus(successMessage, { tone: "success" });
  } catch (error) {
    showPersistenceError(error);
  }
}

function getDay() {
  if (!state.days[currentDayKey]) {
    state.days[currentDayKey] = normalizeDay(
      {
        habitsDone: {},
        routinesDone: {},
        meals: [],
        water: 0,
        note: "",
      },
      state,
      currentDayKey,
    );
  }

  return state.days[currentDayKey];
}

function syncCurrentDayPlan(day) {
  day.plan = createDayPlan(state, currentDayKey);
}

function setActiveTab(tabName) {
  activeTab = tabName;
  activateTab({ tabName, tabs, panels });
  sectionTitle.textContent = sectionTitles[tabName];
}

function render() {
  if (!state || !repository) return;
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
      const streak = getHabitStreak(state, habit.id, currentDayKey);
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
    const streak = getHabitStreak(state, habit.id, currentDayKey);
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
  const { averageScore, averageWater, totalTraining } = getWeeklySummary(state);

  weeklyScoreSummary.textContent = `${averageScore}%`;
  weeklyWaterSummary.textContent = `${averageWater} ml`;
  weeklyTrainingSummary.textContent = totalTraining;
  bestStreakSummary.textContent = getPerfectDayStreak(state, currentDayKey);
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
  const {
    completedHabits,
    habitTarget,
    waterDays,
    dayTarget,
    trainingCount,
    trainingTarget,
    foodDays,
  } = getWeeklyGoals(state);

  weeklyGoalList.append(
    goalElement("Habitos", completedHabits, habitTarget, "realizaciones programadas"),
    goalElement("Agua", waterDays, dayTarget, "dias llegando a tu meta"),
    goalElement("Entreno", trainingCount, trainingTarget, "rutinas programadas"),
    goalElement("Alimentacion", foodDays, dayTarget, "dias con comidas registradas"),
  );
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

function toggleHabit(id) {
  const day = getDay();
  toggleHabitState(day, id);
  render();
}

function deleteHabit(id) {
  const habit = state.habits.find((item) => item.id === id);
  if (
    !habit ||
    !window.confirm(`Eliminar el habito "${habit.name}"? El historial anterior se conservara.`)
  ) {
    return;
  }
  removeHabit(state, id);
  if (editingHabitId === id) resetHabitForm();
  render();
}

function toggleRoutine(id) {
  const day = getDay();
  toggleRoutineState(day, id);
  render();
}

function deleteRoutine(id) {
  const routine = state.routines.find((item) => item.id === id);
  if (
    !routine ||
    !window.confirm(`Eliminar la rutina "${routine.name}"? El historial anterior se conservara.`)
  ) {
    return;
  }
  removeRoutine(state, id);
  if (editingRoutineId === id) resetTrainingForm();
  render();
}

function deleteMeal(id) {
  const day = getDay();
  const meal = day.meals.find((item) => item.id === id);
  if (!meal || !window.confirm(`Eliminar el registro de ${meal.type.toLowerCase()}?`)) return;
  removeMeal(day, id);
  render();
}

bindTabNavigation({ tabs, onActivate: setActiveTab });

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

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  try {
    await repository?.flush?.();
    await authService.signOut();
    lockApp();
  } catch {
    showAppStatus("No pudimos cerrar la sesión. Intentá nuevamente.", {
      tone: "error",
      persistent: true,
    });
  } finally {
    signOutButton.disabled = false;
  }
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
  upsertHabit(state, habit);
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
  upsertRoutine(state, routine);
  resetTrainingForm();
  render();
});

foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = mealText.value.trim();
  const feeling = mealFeeling.value.trim();
  if (!text) return;

  const day = getDay();
  addMeal(day, {
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
    const waterChange = Number(button.dataset.water);
    const result = changeWater(day, waterChange);
    render();
    if (!result.wasComplete && waterChange > 0 && result.isComplete) celebrateWaterGoal();
  });
});

waterGoalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const day = getDay();
  const wasComplete = day.water >= day.plan.waterGoal;
  updateWaterGoal(state, waterGoalInput.value);
  render();
  if (!wasComplete && day.water >= day.plan.waterGoal) celebrateWaterGoal();
});

resetTodayButton.addEventListener("click", () => {
  if (!window.confirm("Reiniciar todo lo registrado hoy? Vas a poder deshacerlo.")) return;
  if (!createRecoveryPoint("reset-today")) return;

  state.days[currentDayKey] = normalizeDay(
    {
      habitsDone: {},
      routinesDone: {},
      meals: [],
      water: 0,
      note: "",
    },
    state,
    currentDayKey,
  );
  render();
  showAppStatus("El dia fue reiniciado.", {
    tone: "success",
    actionLabel: "Deshacer",
    onAction: () => restoreLastRecovery("Recuperamos todos los datos del dia."),
  });
});

exportDataButton.addEventListener("click", () => {
  const payload = repository.export(state);
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
    const importedState = repository.validateImport(text);
    if (!window.confirm("Importar este respaldo reemplazara los datos actuales. Continuar?")) {
      backupStatus.textContent = "Importacion cancelada. Tus datos no cambiaron.";
      return;
    }
    if (!createRecoveryPoint("import-backup")) return;

    state = repository.save(importedState);
    selectedHistoryDate = currentDayKey;
    render();
    backupStatus.textContent = "Respaldo importado correctamente.";
    showAppStatus("El respaldo fue importado.", {
      tone: "success",
      actionLabel: "Deshacer",
      onAction: () => restoreLastRecovery("Recuperamos los datos anteriores a la importacion."),
    });
  } catch (error) {
    backupStatus.textContent = error?.message || "No se pudo importar ese archivo.";
    if (error?.code?.startsWith("storage-")) showPersistenceError(error);
  } finally {
    importDataInput.value = "";
  }
});

syncHabitDayPicker(true);
setActiveTab(activeTab);
watchForNewDay();
void bootstrapAuthentication();

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

function watchForNewDay() {
  const checkForNewDay = () => {
    const nextDayKey = getLocalDateKey();
    if (nextDayKey === currentDayKey) return;

    currentDayKey = nextDayKey;
    selectedHistoryDate = currentDayKey;
    if (state) render();
  };

  window.setInterval(checkForNewDay, 60000);
  window.addEventListener("focus", checkForNewDay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkForNewDay();
  });
}
