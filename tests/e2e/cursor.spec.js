import { test, expect } from '@playwright/test';
import { gotoVF, ORDER, rectOf } from './helpers.js';

const SAMPLE_MS = 400;

async function sampleCursor(page, duration = SAMPLE_MS) {
  return page.evaluate(duration => new Promise(resolve => {
    const cur = document.getElementById('cur');
    const samples = [];
    let start;

    const read = now => {
      if (start === undefined) start = now;
      const rect = cur.getBoundingClientRect();
      const style = getComputedStyle(cur);
      samples.push({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        opacity: Number(style.opacity),
        scale: Number(style.scale),
        rotate: style.rotate,
      });
      if (now - start < duration) requestAnimationFrame(read);
      else resolve(samples);
    };
    requestAnimationFrame(read);
  }), duration);
}

async function expectCursorNear(page, point) {
  await expect.poll(async () => {
    const rect = await rectOf(page, '#cur');
    return Math.hypot(rect.x + rect.width / 2 - point.x, rect.y + rect.height / 2 - point.y);
  }).toBeLessThanOrEqual(1);
}

test('cursor stays under the pointer when entering and leaving section boxes', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 8 });
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk');
  await expect(page.locator('html.vf-cursor #cur')).toHaveCSS('opacity', '1');
  await expect(page.locator('#scan')).toHaveCSS('opacity', '0');

  for (const key of ORDER) {
    await expect(page.locator(`.box[data-key="${key}"]`)).toHaveCSS('opacity', '1');
  }

  for (const key of ORDER) {
    const box = await rectOf(page, `.box[data-key="${key}"]`);
    const y = box.y + box.height / 2;
    const outside = { x: box.x - 4, y };
    const inside = { x: box.x + 4, y };

    await page.mouse.move(outside.x, outside.y, { steps: 4 });
    await expectCursorNear(page, outside);

    await page.mouse.move(inside.x, inside.y, { steps: 1 });
    const entering = await sampleCursor(page);
    for (const sample of entering) {
      expect(Math.hypot(sample.x - inside.x, sample.y - inside.y)).toBeLessThanOrEqual(10);
      expect(sample.opacity).toBe(1);
      expect(sample.x).toBeGreaterThanOrEqual(0);
      expect(sample.x).toBeLessThanOrEqual(1440);
      expect(sample.y).toBeGreaterThanOrEqual(0);
      expect(sample.y).toBeLessThanOrEqual(900);
    }
    expect(entering.at(-1).scale).toBe(1.5);
    expect(entering.at(-1).rotate).toBe('90deg');
    expect(entering.at(-1).width).toBeCloseTo(39, 0);
    expect(entering.at(-1).height).toBeCloseTo(39, 0);

    await page.mouse.move(outside.x, outside.y, { steps: 1 });
    const leaving = await sampleCursor(page);
    for (const sample of leaving) {
      expect(Math.hypot(sample.x - outside.x, sample.y - outside.y)).toBeLessThanOrEqual(10);
      expect(sample.opacity).toBe(1);
      expect(sample.x).toBeGreaterThanOrEqual(0);
      expect(sample.x).toBeLessThanOrEqual(1440);
      expect(sample.y).toBeGreaterThanOrEqual(0);
      expect(sample.y).toBeLessThanOrEqual(900);
    }
  }
});
