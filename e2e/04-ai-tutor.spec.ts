import { test, expect } from "@playwright/test";

test("ai tutor: ask a question and get a streamed reply", async ({ page }) => {
  const question = `What is a bit, in one sentence? (e2e ${Date.now()})`;

  await page.goto("/unilag/csc-101?tab=ai");

  const input = page.getByPlaceholder("Ask about this course…");
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(question);
  await page.getByRole("button", { name: "Ask" }).click();

  // Question echoes into the thread immediately
  await expect(page.getByText(question)).toBeVisible({ timeout: 5_000 });

  // Real LLM + RAG call — the button reads "…" while streaming and reverts to
  // "Ask" once finished, so waiting for that exact name is the completion signal.
  await expect(page.getByRole("button", { name: "Ask" })).toBeVisible({ timeout: 30_000 });
});
