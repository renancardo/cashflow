import { expect, test } from "@playwright/test";

test.describe("app shell", () => {
  test("loads year calendar with projection summary", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Cashflow")).toBeVisible();
    await expect(page.getByRole("navigation")).toContainText("Year");
    await expect(page.getByRole("heading", { name: "Year Calendar" })).toBeVisible();
    await expect(page.getByText("Working balance today:")).toBeVisible();
    await expect(page.getByText("Horizon:")).toBeVisible();
  });
});
