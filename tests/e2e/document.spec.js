import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const parity = JSON.parse(readFileSync(new URL('../fixtures/parity.json', import.meta.url), 'utf8'));

test('no-JS: every section is readable', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const k of ['work', 'coffee', 'trade', 'about', 'contact']) await expect(page.locator(`#${k}-h`)).toBeVisible();
  await expect(page.locator('h1.name')).toHaveText('Khoo Shi Xian');
  await ctx.close();
});

test('content parity with ab6b1f5', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#brewlog tbody tr')).toHaveCount(2);
  const text = (await page.locator('body').textContent()).replace(/\s+/g, ' ');
  for (const s of parity) expect(text, s).toContain(s);
});

test('brew log renders COFFEES as text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#brewlog tbody tr')).toHaveCount(2);
  await expect(page.locator('#brewlog')).toContainText('not rated yet');
  await expect(page.locator('#brewlog .filters')).toBeHidden(); // only one method
});

test('links and share meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="https://github.com/sxkhoo"]').first()).toBeVisible();
  await expect(page.locator('a[href="mailto:khooshixian@gmail.com"]')).toHaveCount(1);
  await expect(page.locator('a[href^="https://linkedin.com"]')).toHaveAttribute('rel', /noopener/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://portfolio-sage-pi-63.vercel.app/');
});
