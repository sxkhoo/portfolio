import { test, expect } from '@playwright/test';
import { gotoVF, VIEWPORTS, ORDER, SECTIONS, inside, rectOf } from './helpers.js';

test('five labelled section buttons in order, Work first', async ({ page }) => {
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  const names = await page.locator('#boxes button.obj').evaluateAll(b => b.map(x => x.getAttribute('aria-label')));
  expect(names).toEqual(['Open Work (laptop)', 'Open Coffee (v60_dripper)', 'Open Trade (cell_phone)', 'Open About (polaroid)', 'Open Contact (envelope)']);
  await expect(page.locator('.box[data-key="work"] .tag')).toHaveText('laptop 0.97');
  await expect(page.locator('.box[data-key="contact"] .go')).toHaveText('→ CONTACT');
});

test('each box contains its object', async ({ page }) => {
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  await expect(page.locator('#objcount')).toHaveText('7');
  for (const k of ORDER) {
    const box = await rectOf(page, `.box[data-key="${k}"]`), obj = await rectOf(page, `#obj-${SECTIONS[k].object}`);
    expect(inside(obj, box), `${k} ${JSON.stringify({ box, obj })}`).toBe(true);
  }
});

for (const [w, h] of VIEWPORTS) test(`boxes and tags stay on screen at ${w}x${h}`, async ({ page }) => {
  await page.setViewportSize({ width: w, height: h });
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  await expect(page.locator('#objcount')).toHaveText('7');
  const screen = { x: 0, y: 0, width: w, height: h };
  for (const k of ORDER) {
    const box = await rectOf(page, `.box[data-key="${k}"]`), tag = await rectOf(page, `.box[data-key="${k}"] .tag`);
    expect(inside(box, screen), `${k} box ${JSON.stringify(box)}`).toBe(true);
    expect(inside(tag, screen), `${k} tag ${JSON.stringify(tag)}`).toBe(true);
  }
});

test('decor is not a control', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: .5 }); // hover while the scan is still revealing labels
  await expect(page.locator('.box.decor')).toHaveCount(2);
  await expect(page.locator('.box[data-key="ball"]')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('.box[data-key="ball"]').evaluate(el => el.tabIndex)).toBe(-1);
  await page.locator('.box[data-key="ball"]').hover();
  await expect(page.locator('.box[data-key="ball"] .tag')).toHaveText('weekends → basketball');
  await page.mouse.move(5, 5);
  await expect(page.locator('.box[data-key="ball"] .tag')).toHaveText('sports_ball 0.88');
});

test('phone tap targets are at least 44px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  for (const k of ORDER) {
    const box = await rectOf(page, `.box[data-key="${k}"]`);
    expect(box.width >= 44 && box.height >= 44, `${k} ${JSON.stringify(box)}`).toBe(true);
  }
});

test('HUD counts seven detections and the timecode runs', async ({ page }) => {
  await gotoVF(page, { introSeen: true });
  await expect(page.locator('#objcount')).toHaveText('7');
  const a = await page.locator('#tc').textContent();
  await page.waitForTimeout(250);
  expect(await page.locator('#tc').textContent()).not.toBe(a);
});
