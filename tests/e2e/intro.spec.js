import { test, expect } from '@playwright/test';
import { gotoVF, ORDER, SECTIONS, inside, rectOf } from './helpers.js';

const html = page => page.locator('html');
const KEY = 'ksx-viewfinder-intro-v1';

test('first visit plays once and remembers', async ({ page }) => {
  await gotoVF(page, { speed: 8 });
  await expect(html(page)).toHaveAttribute('data-intro', 'played');
  await expect(html(page)).toHaveAttribute('data-state', 'desk', { timeout: 3000 });
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe('1');
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-intro', 'skipped');
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
});

test('desk is interactive within 4s at real speed', async ({ page }) => {
  const t0 = Date.now();
  await gotoVF(page, { speed: 1 });
  await expect(html(page)).toHaveAttribute('data-intro', 'played');
  await expect(html(page)).toHaveAttribute('data-state', 'desk', { timeout: 4000 });
  expect(Date.now() - t0).toBeLessThan(4500);
});

test('any key skips', async ({ page }) => {
  await gotoVF(page, { speed: 1 });
  await expect(html(page)).toHaveAttribute('data-state', 'intro');
  await page.waitForTimeout(600);
  const t = Date.now();
  await page.keyboard.press('x');
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  expect(Date.now() - t).toBeLessThan(1000);
});

test('[review] a tap on a box during the intro only skips', async ({ page }) => {
  await gotoVF(page, { speed: 1 });
  await expect(html(page)).toHaveAttribute('data-state', 'intro');
  await page.waitForTimeout(800);
  const b = await rectOf(page, '.box[data-key="work"]');
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.waitForTimeout(500);
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  expect(await page.evaluate(() => location.hash)).toBe('');
});

test('[review] throwing storage: intro plays, no errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('denied'); };
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await gotoVF(page, { speed: 8 });
  await expect(html(page)).toHaveAttribute('data-intro', 'played');
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  expect(errors).toEqual([]);
});

test('[review] resize during the intro lands on a laid-out desk', async ({ page }) => {
  await gotoVF(page, { speed: 1 });
  await expect(html(page)).toHaveAttribute('data-state', 'intro');
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.waitForTimeout(400);
  for (const k of ORDER) {
    const box = await rectOf(page, `.box[data-key="${k}"]`), obj = await rectOf(page, `#obj-${SECTIONS[k].object}`);
    expect(inside(obj, box), `${k} ${JSON.stringify({ box, obj })}`).toBe(true);
  }
});

test('photo blocked: straight to the desk', async ({ page }) => {
  await gotoVF(page, { speed: 1, blockPhoto: true });
  await expect(html(page)).toHaveAttribute('data-state', 'desk', { timeout: 4000 });
});

test('deep link on a first visit skips and does not mark seen', async ({ page }) => {
  await gotoVF(page, { hash: '#about', speed: 8 });
  await expect(html(page)).toHaveAttribute('data-intro', 'skipped');
  await expect(html(page)).toHaveAttribute('data-section', 'about');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();
});

test('replay', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 8 });
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.locator('#replay').click();
  await expect(html(page)).toHaveAttribute('data-intro', 'played');
  await expect(html(page)).toHaveAttribute('data-state', 'desk', { timeout: 3000 });
  await page.keyboard.press('1');
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  await expect(page.locator('#replay')).toBeHidden();
});

test('no console errors across a full visit', async ({ page }) => {
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', e => errors.push(e.message));
  await gotoVF(page, { speed: 8 });
  await expect(html(page)).toHaveAttribute('data-state', 'desk', { timeout: 3000 });
  for (const [i] of ORDER.entries()) {
    await page.keyboard.press(String(i + 1));
    await expect(html(page)).toHaveAttribute('data-state', 'section');
    await page.keyboard.press('Escape');
    await expect(html(page)).toHaveAttribute('data-state', 'desk');
  }
  await page.keyboard.press('1');
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  await page.keyboard.press('ArrowRight');
  await expect(html(page)).toHaveAttribute('data-section', 'coffee');
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  expect(errors).toEqual([]);
});
