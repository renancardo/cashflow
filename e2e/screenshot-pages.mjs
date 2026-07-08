import { chromium } from "@playwright/test";

const SCREENSHOT_DIR = "./e2e/tmp/screenshots";
const BASE = "http://localhost:5173";

const pages = [
  { name: "year", path: "/year" },
  { name: "year-day", path: "/year?day=2026-03-13" },
  { name: "month", path: "/month/2026-07" },
  { name: "month-day", path: "/month/2026-07?day=2026-07-01" },
  { name: "transactions", path: "/transactions" },
  { name: "transactions-new", path: "/transactions?new" },
  { name: "transactions-edit", path: "/transactions?edit=tx-grocery" },
  { name: "accounts", path: "/accounts" },
  { name: "accounts-new", path: "/accounts?new" },
  { name: "accounts-edit", path: "/accounts?edit=acct-cora-checking" },
  { name: "categories", path: "/categories" },
  { name: "categories-new", path: "/categories?new" },
  { name: "categories-edit", path: "/categories?edit=cat-housing" },
  { name: "forecast", path: "/forecast" },
  { name: "forecast-new-planned", path: "/forecast?new=planned" },
  { name: "forecast-new-installment", path: "/forecast?new=installment" },
  { name: "forecast-edit-planned", path: "/forecast?planned=plan-rent" },
  { name: "forecast-edit-installment", path: "/forecast?installment=plan-ipanema" },
  { name: "settings", path: "/settings" },
];

const browser = await chromium.launch();

const bootstrap = await browser.newPage();
await bootstrap.goto(`${BASE}/forecast`);
await bootstrap.waitForLoadState("networkidle");

const statementEdit = bootstrap
  .locator("h3")
  .filter({ hasText: /credit card statements/i })
  .locator("..")
  .getByRole("button", { name: /^edit$/i })
  .first();

if (await statementEdit.count()) {
  await statementEdit.click();
  await bootstrap.waitForTimeout(300);
  const statementId = new URL(bootstrap.url()).searchParams.get("statement");
  if (statementId) {
    pages.push({
      name: "forecast-edit-statement",
      path: `/forecast?statement=${statementId}`,
    });
  }
}
await bootstrap.close();

for (const { name, path } of pages) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}-mobile.png`, fullPage: true });
  await page.close();
}

for (const { name, path } of pages) {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto(`${BASE}${path}`);
  await desktop.waitForLoadState("networkidle");
  await desktop.waitForTimeout(500);
  await desktop.screenshot({ path: `${SCREENSHOT_DIR}/${name}-desktop.png`, fullPage: true });
  await desktop.close();
}

await browser.close();
