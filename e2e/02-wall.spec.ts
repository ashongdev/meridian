import { test, expect } from "@playwright/test";

test("wall: create a post and toggle an upvote", async ({ page }) => {
  const content = `E2E test post ${Date.now()}`;

  await page.goto("/unilag/csc-101?tab=wall");
  await page.waitForLoadState("networkidle"); // absorbs dev-server cold-compile delay on first hit

  await page.getByText("Share something with your classmates…").click();
  await page.getByPlaceholder("What's on your mind?").fill(content);
  await page.getByRole("button", { name: "Post" }).click();

  const post = page.locator("article", { hasText: content });
  await expect(post).toBeVisible({ timeout: 10_000 });

  const voteButton = post.getByRole("button").first();
  const countBefore = await voteButton.locator("span").nth(1).innerText();

  await voteButton.click();
  await expect(voteButton.locator("span").nth(1)).not.toHaveText(countBefore);

  // Toggle back off — should return to the original count
  await voteButton.click();
  await expect(voteButton.locator("span").nth(1)).toHaveText(countBefore);
});
