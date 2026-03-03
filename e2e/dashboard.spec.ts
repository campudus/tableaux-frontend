import { test, expect } from "@playwright/test";
import { showCursor } from "./utils/cursor";

test("can load dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("id=dashboard-view")).toBeVisible();
});

test("can navigate to table", async ({ page }) => {
  await showCursor(page);
  await page.goto("/");

  const menu = page.locator("id=burger");

  await expect(menu).toBeVisible();

  await menu.hover();
  await menu.click();

  const link = page.getByRole("link", { name: "Tabellen" });

  await expect(link).toBeVisible();

  await link.hover();
  await link.click();

  await page.waitForURL("/de-DE/tables/1", { waitUntil: "domcontentloaded" });

  const tableWrapper = page.locator("id=table-wrapper");
  const firstCell = page.locator("div.cell").first();

  await expect(tableWrapper).toBeVisible();
  await expect(firstCell).toBeVisible();
});
