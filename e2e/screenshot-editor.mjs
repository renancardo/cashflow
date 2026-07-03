import { chromium } from "@playwright/test";

const SCREENSHOT_DIR = "./e2e/tmp/screenshots";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:5173/accounts");
await page.waitForLoadState("networkidle");

// Edit an existing account if one exists, otherwise open the create panel
const editButton = page.getByRole("button", { name: /edit/i }).first();
if (await editButton.count()) {
  await editButton.click();
} else {
  await page
    .getByRole("button", { name: /add account/i })
    .first()
    .click();
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCREENSHOT_DIR}/editor-desktop.png` });

// If the panel is for a non-credit-card account, switch type to credit card to see full form
const typeSelect = page.locator("#account-type");
if (await typeSelect.count()) {
  await typeSelect.selectOption("credit_card");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/editor-credit.png` });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${SCREENSHOT_DIR}/editor-mobile.png` });

await browser.close();
