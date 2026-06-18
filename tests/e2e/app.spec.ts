import { expect, test } from '@playwright/test';

test('starts WebGL prototype and enters the farm', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(canvas).toBeVisible();
});

test('changes between farm and forest without scene lifecycle errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(canvas).toBeVisible();

  await page.keyboard.press('Tab');
  await page.waitForTimeout(120);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(120);

  expect(pageErrors).toEqual([]);
  await expect(canvas).toBeVisible();
});
