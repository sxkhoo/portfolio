import { test, expect } from '@playwright/test';

test('share preview points at the published image', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://portfolio-sage-pi-63.vercel.app/img/og.png');
});

test('share image and favicon are served', async ({ request }) => {
  for (const path of ['/img/og.png', '/favicon.svg']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});
