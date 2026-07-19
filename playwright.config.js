import { defineConfig, devices } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:4173";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: externalBaseURL || localBaseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4173",
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
