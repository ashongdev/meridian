import { test, expect } from "@playwright/test";

test("study groups: create a group, chat, and run the pomodoro timer", async ({ page }) => {
  const groupName = `E2E group ${Date.now()}`;
  const message   = `Hello from e2e ${Date.now()}`;

  await page.goto("/unilag/csc-101?tab=groups");

  await page.getByText("Start a study group…").click();
  await page.getByPlaceholder("Group name").fill(groupName);
  await page.getByRole("button", { name: "Create group" }).click();

  const groupCard = page.locator("article", { hasText: groupName });
  await expect(groupCard).toBeVisible({ timeout: 10_000 });

  // Creator is auto-joined, so "Open" is available immediately
  await groupCard.getByRole("button", { name: "Open" }).click();

  // Chat input only exists once the live panel has mounted (unambiguous,
  // unlike the group name which also appears on the card behind it).
  const chatInput = page.getByPlaceholder("Message the group… (try @AI to ask the tutor)");
  await expect(chatInput).toBeVisible({ timeout: 10_000 });
  await chatInput.fill(message);
  await page.getByTitle("Send").click();
  await expect(page.getByText(message)).toBeVisible({ timeout: 10_000 });

  // Pomodoro — starting flips the control from "Start" to "Pause". exact:true
  // avoids matching the sidebar's "Start a study group…" button, still visible
  // alongside the panel in the two-pane layout.
  // Pomodoro state isn't applied optimistically — the control POSTs, then the
  // UI updates only once the next SSE poll tick (~2.5s cadence) reflects it.
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible({ timeout: 10_000 });
});
