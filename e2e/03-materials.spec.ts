import { test, expect } from "@playwright/test";

test("materials: upload a file and see it listed", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E test notes ${stamp}`;

  await page.goto("/unilag/csc-101?tab=papers");

  await page.getByText("Upload a past exam or notes").click();
  await page.getByPlaceholder("Title (e.g. 2023 Final Exam)").fill(title);

  // Unique content per run — the app SHA256-dedupes file content within a
  // course, so re-uploading the same static fixture on every run would be
  // rejected as a duplicate from the second run onward.
  await page.locator('input[type="file"]').setInputFiles({
    name: "test-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(`CSC 101 e2e test upload — unique marker ${stamp}\n`),
  });

  await page.getByRole("button", { name: /Upload \(\+10 karma\)/ }).click();

  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
});
