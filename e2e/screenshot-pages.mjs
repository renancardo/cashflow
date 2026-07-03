import { chromium } from "@playwright/test";

const SCREENSHOT_DIR = "./e2e/tmp/screenshots";

const browser = await chromium.launch();
const pages = ["transactions", "accounts", "categories", "forecast"];

for (const name of pages) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://localhost:5173/${name}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}-mobile.png`, fullPage: true });
  await page.close();
}

for (const name of pages) {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto(`http://localhost:5173/${name}`);
  await desktop.waitForLoadState("networkidle");
  await desktop.waitForTimeout(500);
  await desktop.screenshot({ path: `${SCREENSHOT_DIR}/${name}-desktop.png`, fullPage: true });
  await desktop.close();
}

await browser.close();
