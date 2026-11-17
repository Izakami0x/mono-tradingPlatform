import { test, expect } from '@playwright/test';

async function openWorkspace(page) {
  await page.goto('/');
  await expect(page.locator('.chart-engine').first()).toBeVisible();
  await expect(page.locator('.drawing-overlay').first()).toBeVisible();
  await page.waitForTimeout(700);
}

async function drawTrendLine(page) {
  const chart = page.locator('.drawing-overlay').first();
  const bounds = await chart.boundingBox();
  expect(bounds).not.toBeNull();
  await page.getByRole('button', { name: 'Trend line' }).click();
  await page.mouse.move(bounds.x + bounds.width * 0.34, bounds.y + bounds.height * 0.38);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.67, bounds.y + bounds.height * 0.62, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.object-row').filter({ hasText: 'trend' })).toHaveCount(1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('creates, selects, moves, undoes and redoes a drawing', async ({ page }) => {
  await openWorkspace(page);
  await drawTrendLine(page);

  const row = page.locator('.object-row').filter({ hasText: 'trend' });
  await row.getByRole('button', { name: /trend/i }).click();
  await expect(row).toHaveClass(/object-selected/);

  const chart = page.locator('.drawing-overlay').first();
  const bounds = await chart.boundingBox();
  await page.getByRole('button', { name: 'Cursor' }).click();
  await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.44, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('.object-row')).toHaveCount(1);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.object-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.object-row')).toHaveCount(1);
});

test('persists drawings after a page reload', async ({ page }) => {
  await openWorkspace(page);
  await drawTrendLine(page);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('mono.drawings.BTCUSDT') || '[]').length)).toBe(1);
  await page.reload();
  await expect(page.locator('.object-row').filter({ hasText: 'trend' })).toHaveCount(1);
});

test('keeps secondary chart symbol state independent from the main chart', async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole('button', { name: /Layout 1×/ }).click();
  await expect(page.locator('.secondary-pane')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Chart symbol' }).selectOption('ETHUSDT');
  await expect(page.locator('.secondary-pane').getByRole('combobox', { name: 'Chart symbol' })).toHaveValue('ETHUSDT');
  await expect(page.locator('.instrument-line').first()).toContainText('BTCUSDT');
});

test('locks and hides a drawing through the object tree', async ({ page }) => {
  await openWorkspace(page);
  await drawTrendLine(page);
  const row = page.locator('.object-row').filter({ hasText: 'trend' });
  await row.getByRole('button', { name: 'Lock drawing' }).click();
  await expect(row.getByRole('button', { name: 'Unlock drawing' })).toBeVisible();
  await row.getByRole('button', { name: 'Hide drawing' }).click();
  await expect(row.getByRole('button', { name: 'Show drawing' })).toBeVisible();
});
