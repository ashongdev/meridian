import { test, expect } from "@playwright/test";

// Runs first (numeric prefix controls file order under workers:1) — every
// later spec assumes this test user is enrolled in unilag/csc-101.
test("onboarding: pick a university and join a course", async ({ page }) => {
  await page.goto("/onboarding");

  // If a previous run already finished onboarding for this test user, the
  // middleware redirects straight past it — that's success too.
  if (page.url().includes("/onboarding")) {
    await expect(page.getByText("University of Lagos")).toBeVisible({ timeout: 10_000 });
    await page.getByText("University of Lagos").click();

    await expect(page.getByText("CSC 101")).toBeVisible({ timeout: 10_000 });
    await page.getByText("Introduction to Computer Science").click();

    await page.getByRole("button", { name: /Join \d+ course|Continue/ }).click();
    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15_000 });
  }

  // Regardless of path taken, we should now be able to reach the course hub.
  await page.goto("/unilag/csc-101");
  await expect(page.getByText("Introduction to Computer Science")).toBeVisible({ timeout: 10_000 });
});
