import { defineConfig, devices } from "@playwright/test";

// En local reutiliza el servidor de desarrollo (Next no permite dos `next dev` en la misma carpeta).
const PORT = process.env.CI ? 3100 : 3001;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // En local usa el Chrome instalado; en CI, el Chromium que instala Playwright.
    ...devices["Desktop Chrome"],
    channel: process.env.CI ? undefined : "chrome",
    locale: "es-CL",
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI ? `npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
