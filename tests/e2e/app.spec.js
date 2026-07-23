import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const testEmail = process.env.E2E_AUTH_EMAIL || "florencia@example.com";
const testPassword = process.env.E2E_AUTH_PASSWORD || "impulsox-test-2026";
const canAuthenticate =
  !externalBaseURL || Boolean(process.env.E2E_AUTH_EMAIL && process.env.E2E_AUTH_PASSWORD);

async function signIn(page, email = testEmail) {
  await page.locator("#introLoginButton").click();
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Clave", { exact: true }).fill(testPassword);
  await page.locator("#authSubmitButton").click();
  await expect(page.locator(".app-shell")).not.toHaveAttribute("inert", "");
}

async function signOut(page) {
  await page.locator("#profileButton").click();
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
}

function navigationTab(page, name) {
  return page.locator(".tabs").getByRole("tab", { name, exact: true });
}

test("shows a clean welcome before asking for account details", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".app-shell")).toHaveAttribute("inert", "");
  await expect(page.getByRole("tab", { name: "Hoy", exact: true })).toHaveCount(0);
  await expect(page.locator(".intro-logo")).toBeVisible();
  await expect(page.getByText("no importa el ritmo, ya le gané a mi yo del pasado")).toBeVisible();
  await expect(page.locator("#introLoginButton")).toBeVisible();
  await expect(page.locator("#introSignupButton")).toBeVisible();
  await expect(page.locator("#authPanel")).toBeHidden();
  await expect(page.getByLabel("Correo")).toBeHidden();
  await expect(page.getByLabel("Clave", { exact: true })).toBeHidden();

  const dimensions = await page.evaluate(() => {
    const content = document.querySelector(".intro-content").getBoundingClientRect();

    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      contentCenterRatio:
        (content.top + content.height / 2) / document.documentElement.clientHeight,
    };
  });
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  expect(dimensions.contentCenterRatio).toBeGreaterThan(0.4);
  expect(dimensions.contentCenterRatio).toBeLessThan(0.6);
});

test("opens the chosen form and returns to the welcome", async ({ page }) => {
  await page.goto("/");
  await page.locator("#introLoginButton").click();

  await expect(page.getByRole("heading", { name: "Ingresar", exact: true })).toBeVisible();
  await expect(page.getByLabel("Correo")).toBeVisible();
  await page.locator("#authBackButton").click();
  await expect(page.locator("#authPanel")).toBeHidden();
  await expect(page.getByLabel("Correo")).toBeHidden();
  await expect(page.locator("#introLoginButton")).toBeFocused();

  await page.locator("#introSignupButton").click();
  await expect(page.getByRole("heading", { name: "Crear cuenta", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nombre de usuario")).toBeVisible();
  await expect(page.getByLabel("Repetir clave")).toBeVisible();
});

test("serves a valid installable manifest", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe("IMPULSOX");
  expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
});

test.describe("authenticated experience", () => {
  test.skip(!canAuthenticate, "A remote deployment requires E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await signIn(page);
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
      await navigationTab(page, tab).click();
      await expect(page.locator("#sectionTitle")).toHaveText(heading);
    }
  });

  test("restores an authenticated session after reload", async ({ page }) => {
    await page.reload();

    await expect(page.locator(".app-shell")).not.toHaveAttribute("inert", "");
    await expect(page.locator("#sectionTitle")).toBeFocused();
    await expect(page.locator(".tabs").getByRole("tab")).toHaveCount(6);
  });

  test("persists theme and user data after reload", async ({ page }) => {
    await page.locator(".theme-switch").click();
    await expect(page.locator("#themeToggle")).toBeChecked();
    await navigationTab(page, "Habitos").click();
    await page.locator("#habitName").fill("Dormir ocho horas");
    await page.getByRole("button", { name: "Agregar habito" }).click();
    await expect(
      page.locator("#habitsPanel").getByText("Dormir ocho horas", { exact: true }),
    ).toBeVisible();

    await page.reload();
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
    await navigationTab(page, "Habitos").click();
    await expect(
      page.locator("#habitsPanel").getByText("Dormir ocho horas", { exact: true }),
    ).toBeVisible();
  });

  test("celebrates the water goal and records history", async ({ page }) => {
    await navigationTab(page, "Agua").click();
    await page.locator("#waterGoalInput").fill("250");
    await page.getByRole("button", { name: "Actualizar objetivo" }).click();
    await page.getByRole("button", { name: "+250 ml", exact: true }).click();

    await expect(page.locator(".water-meter")).toHaveClass(/goal-celebrating/);
    await expect(page.locator("#waterAmount")).toHaveText("250 ml");
    await navigationTab(page, "Progreso").click();
    await expect(page.locator("#historyList .history-day").first()).toBeVisible();
  });

  test("counts the complete seven-day window in weekly goals", async ({ page }) => {
    await navigationTab(page, "Progreso").click();

    const waterGoal = page.locator(".goal-card").filter({ hasText: "Agua" });
    const foodGoal = page.locator(".goal-card").filter({ hasText: "Alimentacion" });
    await expect(waterGoal.locator("strong")).toHaveText("0/7");
    await expect(foodGoal.locator("strong")).toHaveText("0/7");
  });

  test("plans today and tomorrow without a manual reset", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Reiniciar dia" })).toHaveCount(0);

    await page.locator("#plannerTaskTitle").fill("Revisar agenda");
    await page.locator("#plannerTaskTime").fill("8 am");
    await page.locator("#plannerSubmitButton").click();
    const todayTask = page.locator("#plannerList .item").filter({ hasText: "Revisar agenda" });
    await todayTask.locator(".check-button").click();
    await expect(todayTask).toHaveClass(/done/);

    await page.locator("#plannerTomorrowButton").click();
    await page.locator("#plannerTaskTitle").fill("Preparar ropa de entrenamiento");
    await page.locator("#plannerTaskTime").fill("9 pm");
    await page.locator("#plannerSubmitButton").click();
    const tomorrowTask = page
      .locator("#plannerList .item")
      .filter({ hasText: "Preparar ropa de entrenamiento" });
    await expect(tomorrowTask).toContainText("Hora 21:00");
    await expect(tomorrowTask.locator(".check-button")).toBeDisabled();

    await navigationTab(page, "Progreso").click();
    await expect(page.locator("#historyList .history-day")).toHaveCount(1);
    await navigationTab(page, "Hoy").click();
    await page.reload();
    await page.locator("#plannerTomorrowButton").click();
    await expect(
      page.locator("#plannerList").getByText("Preparar ropa de entrenamiento", { exact: true }),
    ).toBeVisible();
  });

  test("personalizes the profile with a name and photo", async ({ page }) => {
    await page.locator("#profileButton").click();
    await expect(page.locator("#profileDialog")).toBeVisible();
    await page.locator("#profileDisplayName").fill("Flor Inocencio");
    await page.locator("#profilePhotoInput").setInputFiles({
      name: "perfil.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z2S8AAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await expect(page.locator("#profileStatus")).toContainText("Foto lista");
    await page.locator("#profileSaveButton").click();

    await expect(page.locator("#accountName")).toHaveText("Flor Inocencio");
    await expect(page.locator("#profileAvatarImage")).toBeVisible();
    await page.reload();
    await expect(page.locator("#accountName")).toHaveText("Flor Inocencio");
    await expect(page.locator("#profileAvatarImage")).toBeVisible();
  });

  test("isolates corrupt local data and explains the recovery", async ({ page }) => {
    const corruptKey = await page.evaluate(() =>
      Object.keys(globalThis.localStorage).find((key) => key.startsWith("impulsox-state:")),
    );
    expect(corruptKey).toBeTruthy();
    await page.evaluate((key) => globalThis.localStorage.setItem(key, "{broken"), corruptKey);
    await page.reload();

    await expect(page.locator(".app-status")).toContainText("Aislamos datos danados");
    const corruptCopy = await page.evaluate(() => {
      const key = Object.keys(globalThis.localStorage).find((entry) =>
        entry.startsWith("impulsox-corrupt-state:"),
      );
      return key ? globalThis.localStorage.getItem(key) : null;
    });
    expect(corruptCopy).toContain("{broken");
  });

  test("keeps each account's data separate", async ({ page }) => {
    await navigationTab(page, "Habitos").click();
    await page.locator("#habitName").fill("Dato privado de la cuenta A");
    await page.getByRole("button", { name: "Agregar habito" }).click();
    await signOut(page);

    await signIn(page, "otra-persona@example.com");
    await navigationTab(page, "Habitos").click();
    await expect(
      page.locator("#habitsPanel").getByText("Dato privado de la cuenta A", { exact: true }),
    ).toHaveCount(0);

    await signOut(page);
    await signIn(page);
    await navigationTab(page, "Habitos").click();
    await expect(
      page.locator("#habitsPanel").getByText("Dato privado de la cuenta A", { exact: true }),
    ).toBeVisible();
  });

  test("has no horizontal page overflow", async ({ page }) => {
    for (const name of ["Hoy", "Habitos", "Entrenamiento", "Alimentacion", "Agua", "Progreso"]) {
      await navigationTab(page, name).click();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    }
  });
});

test("creates an account without persisting the password in browser storage", async ({ page }) => {
  test.skip(
    Boolean(externalBaseURL),
    "Account creation is verified with the isolated E2E service.",
  );
  await page.goto("/");
  await page.locator("#introSignupButton").click();
  await page.getByLabel("Nombre de usuario").fill("Florencia");
  await page.getByLabel("Correo").fill("nueva@example.com");
  await page.getByLabel("Clave", { exact: true }).fill(testPassword);
  await page.getByLabel("Repetir clave").fill(testPassword);
  await page.locator("#authSubmitButton").click();

  await expect(page.locator(".app-shell")).not.toHaveAttribute("inert", "");
  const localStorageValues = await page.evaluate(() => Object.values(globalThis.localStorage));
  expect(localStorageValues.join(" ")).not.toContain(testPassword);
});
