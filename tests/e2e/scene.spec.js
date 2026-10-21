import { test, expect } from '@playwright/test';
import { gotoVF, VIEWPORTS, inside, overlaps, rectOf } from './helpers.js';

for (const [w, h] of VIEWPORTS) test(`all five section objects fit at ${w}x${h}`, async ({ page }) => {
  await page.setViewportSize({ width: w, height: h });
  await gotoVF(page, { speed: 50, introSeen: true });
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  await expect(page.locator('html')).toHaveAttribute('data-layout', w / h < 1.15 ? 'portrait' : 'landscape');
  const ident = await rectOf(page, '.ident');
  for (const id of ['laptop', 'v60', 'phone', 'polaroid', 'envelope']) {
    const r = await rectOf(page, `#obj-${id}`);
    expect(inside(r, { x: 0, y: 0, width: w, height: h }), `${id} ${JSON.stringify(r)}`).toBe(true);
    expect(overlaps(r, ident), `${id} vs name ${JSON.stringify(ident)}`).toBe(false);
  }
});

test('failsafe: if main.js never boots, the document comes back', async ({ page }) => {
  await page.route('**/js/main.js', r => r.abort());
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/\bjs\b/, { timeout: 8000 });
  await expect(page.locator('#work-h')).toBeVisible();
});

test('a stalled font server does not hold up the page', async ({ page }) => {
  await page.route(/fonts\.googleapis\.com/, () => {}); // never answers
  await page.addInitScript(() => localStorage.setItem('ksx-viewfinder-intro-v1', '1'));
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk', { timeout: 3000 });
});

test('idle reticle and face box are hidden, not just transparent', async ({ page }) => {
  await gotoVF(page, { introSeen: true });
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk');
  for (const id of ['#af', '#facebox']) expect(await page.locator(id).evaluate(el => getComputedStyle(el).visibility), id).toBe('hidden');
});

test('photo uses the responsive webp', async ({ page }) => {
  await gotoVF(page);
  await expect(page.locator('#photo')).toHaveAttribute('href', /img\/pfp-(1280|2048)\.webp$/);
});
