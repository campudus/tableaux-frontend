import { test, expect } from "@playwright/test";
import { showCursor } from "./utils/cursor";

test.beforeEach(async ({ page }) => {
  // disable transitions and animations for tests
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  });
});

test("can load dashboard", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const dashboardView = page.locator("id=dashboard-view");
  await expect(dashboardView).toBeVisible();
});

test("can load tables", async ({ page }) => {
  await page.goto("/tables", { waitUntil: "domcontentloaded" });
  const tableWrapper = page.locator("id=table-wrapper");
  const idHeaderCell = page
    .locator("role=grid")
    .first()
    .locator("role=gridcell")
    .first();

  await expect(tableWrapper).toBeVisible();
  await expect(idHeaderCell).toBeVisible();
});
