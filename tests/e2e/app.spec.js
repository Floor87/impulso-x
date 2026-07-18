import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar" }).click();
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

test("persists theme and user data after reload", async ({ page }) => {
  await page.getByLabel("Claro").check();
  await page.getByRole("tab", { name: "Habitos", exact: true }).click();
  await page.locator("#habitName").fill("Dormir ocho horas");
  await page.getByRole("button", { name: "Agregar habito" }).click();
  await expect(page.getByText("Dormir ocho horas", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("tab", { name: "Habitos", exact: true }).click();
  await expect(page.getByText("Dormir ocho horas", { exact: true })).toBeVisible();
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
