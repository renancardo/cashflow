import { expect, test } from "@playwright/test";

test.describe("app shell", () => {
  test("loads year calendar with header metrics and grid", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Cashflow")).toBeVisible();
    await expect(page.getByRole("navigation")).toContainText("Year");
    await expect(page.getByText("Working balance")).toBeVisible();
    await expect(page.getByText("Next below buffer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Month view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Jump to today" })).toBeVisible();
    await expect(page.getByText("Jan").first()).toBeVisible();
  });

  test("opens day detail panel with quick add card", async ({ page }) => {
    await page.goto("/");

    const dayButton = page.locator("button[data-date]").first();
    await dayButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Quick add")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add transaction" })).toBeVisible();
  });
});
