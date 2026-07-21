import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
});

test("navigates through every daily area", async ({ page }) => {
  const sections = [
    ["Hoy", "Tu dia de hoy"],
    ["Habitos", "Habitos"],
    ["Entrenamiento", "Entrenamiento"],
    ["Alimentacion", "Alimentacion diaria"],
    ["Agua", "Agua"],
    ["Progreso", "Tu progreso"],
  ];

  for (const [tab, heading] of sections) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await expect(page.locator("#sectionTitle")).toHaveText(heading);
  }
});

test("keeps the app inaccessible until the intro is completed", async ({ page }) => {
  await page.reload();

  await expect(page.locator(".app-shell")).toHaveAttribute("inert", "");
  await expect(page.getByRole("tab")).toHaveCount(0);
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();

  await expect(page.locator(".app-shell")).not.toHaveAttribute("inert", "");
  await expect(page.locator("#sectionTitle")).toBeFocused();
  await expect(page.getByRole("tab")).toHaveCount(6);
});

test("persists theme and user data after reload", async ({ page }) => {
  await page.locator(".theme-switch").click();
  await expect(page.locator("#themeToggle")).toBeChecked();
  await page.getByRole("tab", { name: "Habitos", exact: true }).click();
  await page.locator("#habitName").fill("Dormir ocho horas");
  await page.getByRole("button", { name: "Agregar habito" }).click();
  await expect(
    page.locator("#habitsPanel").getByText("Dormir ocho horas", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("tab", { name: "Habitos", exact: true }).click();
  await expect(
    page.locator("#habitsPanel").getByText("Dormir ocho horas", { exact: true }),
  ).toBeVisible();
});

test("celebrates the water goal and records history", async ({ page }) => {
  await page.getByRole("tab", { name: "Agua", exact: true }).click();
  await page.locator("#waterGoalInput").fill("250");
  await page.getByRole("button", { name: "Actualizar objetivo" }).click();
  await page.getByRole("button", { name: "+250 ml", exact: true }).click();

  await expect(page.locator(".water-meter")).toHaveClass(/goal-celebrating/);
  await expect(page.locator("#waterAmount")).toHaveText("250 ml");
  await page.getByRole("tab", { name: "Progreso", exact: true }).click();
  await expect(page.locator("#historyList .history-day").first()).toBeVisible();
});

test("counts the complete seven-day window in weekly goals", async ({ page }) => {
  await page.getByRole("tab", { name: "Progreso", exact: true }).click();

  const waterGoal = page.locator(".goal-card").filter({ hasText: "Agua" });
  const foodGoal = page.locator(".goal-card").filter({ hasText: "Alimentacion" });
  await expect(waterGoal.locator("strong")).toHaveText("0/7");
  await expect(foodGoal.locator("strong")).toHaveText("0/7");
});

test("offers undo after resetting today's data", async ({ page }) => {
  await page.locator("#dailyNote").fill("Hoy tuve mucha energia");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reiniciar dia", exact: true }).click();

  await expect(page.locator("#dailyNote")).toHaveValue("");
  await expect(page.locator(".app-status")).toContainText("El dia fue reiniciado.");
  await page.getByRole("button", { name: "Deshacer", exact: true }).click();

  await expect(page.locator("#dailyNote")).toHaveValue("Hoy tuve mucha energia");
  await expect(page.locator(".app-status")).toContainText("Recuperamos todos los datos del dia.");
  await page.getByRole("tab", { name: "Progreso", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recuperar ultimo cambio", exact: true }),
  ).toBeVisible();
});

test("isolates corrupt local data and explains the recovery", async ({ page }) => {
  await page.evaluate(() => globalThis.localStorage.setItem("impulsox-state", "{broken"));
  await page.reload();
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();

  await expect(page.locator(".app-status")).toContainText("Aislamos datos danados");
  const corruptCopy = await page.evaluate(() =>
    globalThis.localStorage.getItem("impulsox-corrupt-state"),
  );
  expect(corruptCopy).toContain("{broken");
});

test("has no horizontal page overflow", async ({ page }) => {
  for (const name of ["Hoy", "Habitos", "Entrenamiento", "Alimentacion", "Agua", "Progreso"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test("serves a valid installable manifest", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe("IMPULSOX");
  expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
});
