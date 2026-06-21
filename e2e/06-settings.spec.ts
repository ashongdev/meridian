import { test, expect } from "@playwright/test";

test("settings: redeem a promo code (once) and upgrade to Pro", async ({ page }) => {
  await page.goto("/settings");

  const codeInput = page.getByPlaceholder("Enter a promo code");
  await expect(codeInput).toBeVisible({ timeout: 10_000 });

  // STUDENT50, not MERIDIAN-JUDGE — leave the judge code's limited pool untouched.
  await codeInput.fill("STUDENT50");
  await page.getByRole("button", { name: "Redeem" }).click();

  // First attempt: either it succeeds (fresh test user) or this user already
  // redeemed it in a previous run — both are valid depending on run history.
  await expect(page.getByText(/days of Pro unlocked|already redeemed/)).toBeVisible({ timeout: 10_000 });

  // Redeeming the same code again in this run is always a repeat, regardless
  // of history — this is the one deterministic assertion.
  await codeInput.fill("STUDENT50");
  await page.getByRole("button", { name: "Redeem" }).click();
  await expect(page.getByText("You've already redeemed this code")).toBeVisible({ timeout: 10_000 });

  // Upgrade to Pro (simulated checkout) — only shown while still on the free tier
  const upgradeButton = page.getByRole("button", { name: "Upgrade to Pro" });
  if (await upgradeButton.isVisible().catch(() => false)) {
    await upgradeButton.click();
    await expect(page.getByText("You're on Pro")).toBeVisible({ timeout: 10_000 });
  } else {
    await expect(page.getByText("You're on Pro")).toBeVisible();
  }
});
