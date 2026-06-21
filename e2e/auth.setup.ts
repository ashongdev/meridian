import { test as setup, expect } from "@playwright/test";

const TEST_EMAIL = "e2e-test@meridian.test";

setup("authenticate", async ({ request }) => {
  const secret = process.env.E2E_TEST_SECRET;
  if (!secret) {
    throw new Error(
      "E2E_TEST_SECRET is not set. Add it to .env.local (dev only — never set in production) " +
      "and run tests with: npm run test:e2e",
    );
  }

  const res = await request.post("/api/test/login", {
    data: { secret, email: TEST_EMAIL, name: "E2E Test User" },
  });
  expect(res.ok(), `Test login failed: ${res.status()} ${await res.text()}`).toBeTruthy();

  await request.storageState({ path: "e2e/.auth/user.json" });
});
