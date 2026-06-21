import { defineConfig, devices } from "@playwright/test";

// Playwright doesn't auto-load .env.local the way Next.js does — load it
// explicitly so E2E_TEST_SECRET (and anything else) reaches the test process.
try {
  process.loadEnvFile(".env.local");
} catch {
  // missing .env.local — fine if everything needed is already in the environment
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share live DB state (courses, groups) — avoid cross-test races
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000, // AI tutor / embedding calls can be slow
  reporter: [["list"]],

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
    stdout: "pipe",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
