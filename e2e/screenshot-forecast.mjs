import { chromium } from "@playwright/test";

const SCREENSHOT_DIR = "./e2e/tmp/screenshots";

const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desktop.goto("http://localhost:5173/forecast");
await desktop.waitForLoadState("networkidle");
await desktop.waitForTimeout(500);
await desktop.screenshot({ path: `${SCREENSHOT_DIR}/forecast-desktop.png`, fullPage: true });

// Expanded schedule on desktop
await desktop.locator('[title="Expand schedule"]').first().click();
await desktop.waitForTimeout(300);
await desktop.screenshot({
  path: `${SCREENSHOT_DIR}/forecast-desktop-expanded.png`,
  fullPage: true,
});

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:5173/forecast");
await mobile.waitForLoadState("networkidle");
await mobile.waitForTimeout(500);
await mobile.screenshot({ path: `${SCREENSHOT_DIR}/forecast-mobile.png`, fullPage: true });

// Expanded schedule on mobile
await mobile.locator('[title="Expand schedule"]').first().click();
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: `${SCREENSHOT_DIR}/forecast-mobile-expanded.png`, fullPage: true });
await mobile.locator('[title="Collapse schedule"]').first().click();

// Editor panel on mobile
await mobile
  .getByRole("button", { name: /^edit /i })
  .first()
  .click();
await mobile.waitForTimeout(500);
await mobile.screenshot({
  path: `${SCREENSHOT_DIR}/forecast-mobile-editor.png`,
  fullPage: true,
});

await browser.close();
