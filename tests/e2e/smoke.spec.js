import { test, expect } from '@playwright/test';

test('site serves', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Khoo Shi Xian/);
});
