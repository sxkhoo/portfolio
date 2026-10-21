import { test, expect } from '@playwright/test';
import { gotoVF, ORDER, SECTIONS, TARGETS } from './helpers.js';

// does the section's zoom target fill the whole screen?
const covers = (page, id) => page.locator(`#${id}`).evaluate(el => {
  const r = el.getBoundingClientRect();
  return r.left <= 1 && r.top <= 1 && r.right >= innerWidth - 1 && r.bottom >= innerHeight - 1;
});
const html = page => page.locator('html');
const camAtRest = page => page.locator('#cam').evaluate(el => getComputedStyle(el).transform);

test('each section lands on its activated surface', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 8 });
  for (const [i, k] of ORDER.entries()) {
    await expect(html(page)).toHaveAttribute('data-state', 'desk');
    await page.keyboard.press(String(i + 1));
    await expect(html(page)).toHaveAttribute('data-state', 'section');
    await expect.poll(() => covers(page, TARGETS[k] ?? SECTIONS[k].target)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(html(page)).toHaveAttribute('data-state', 'desk');
  }
  expect(await camAtRest(page)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
});

test('zoom readout matches the activated surfaces at 1440x900', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 8 });
  await page.keyboard.press('1');
  await expect(page.locator('#zoomx2')).toHaveText('3.8×');
  await page.keyboard.press('Escape');
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.keyboard.press('2');
  await expect(page.locator('#zoomx2')).toHaveText('26.7×');
  await expect.poll(() => covers(page, 'z-coffee-spill')).toBe(true);
});

// half speed: the 2 s move keeps every key inside it, even on a loaded test machine
test('spam during a move ends consistent', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 0.5 });
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.locator('.box[data-key="work"]').click();
  for (const key of ['2', '3', 'ArrowRight', 'Escape', '5']) await page.keyboard.press(key);
  await expect(html(page)).toHaveAttribute('data-state', 'opening');
  await expect(html(page)).toHaveAttribute('data-state', 'section', { timeout: 5000 });
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('.sec.is-open')).toHaveCount(1);
  await expect.poll(() => covers(page, TARGETS.work ?? SECTIONS.work.target)).toBe(true);
});

test('back during a move is applied when it lands', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 0.5 });
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.locator('.box[data-key="work"]').click();
  await page.goBack();
  await expect(html(page)).toHaveAttribute('data-state', 'opening');
  await expect(html(page)).toHaveAttribute('data-state', 'desk', { timeout: 8000 });
  expect(await page.evaluate(() => location.hash)).toBe('');
  expect(await camAtRest(page)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
});

test('hop is one move, not out-and-in', async ({ page }) => {
  await gotoVF(page, { hash: '#work', speed: 1 });
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  const seen = [];
  await page.exposeFunction('note', t => seen.push(t));
  await page.evaluate(() => new MutationObserver(() => window.note(document.querySelector('#zoomx2').textContent))
    .observe(document.querySelector('#zoomx2'), { childList: true, characterData: true, subtree: true }));
  const t0 = Date.now();
  await page.keyboard.press('ArrowRight');
  await expect(html(page)).toHaveAttribute('data-section', 'coffee');
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  // wall-clock time stretches on a loaded machine; the readout check below is what proves "one move"
  if (process.env.PERF) expect(Date.now() - t0).toBeLessThan(2000);
  expect(seen.length).toBeGreaterThan(5);
  expect(seen).not.toContain('1.0×');
});

test('resizing while zoomed keeps the object framed', async ({ page }) => {
  await gotoVF(page, { hash: '#coffee', speed: 8 });
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(300);
  expect(await covers(page, 'z-coffee-spill')).toBe(true);
});

// frame timing only means something on an idle machine: run it alone with
//   PERF=1 npx playwright test -g "long frames" --project=chromium --workers=1
test('no long frames during the coffee zoom (chromium)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || !process.env.PERF, 'perf check: run alone with PERF=1');
  await gotoVF(page, { introSeen: true, speed: 1 });
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await page.evaluate(() => {
    window.__long = [];
    new PerformanceObserver(l => window.__long.push(...l.getEntries().map(e => e.duration))).observe({ type: 'long-animation-frame', buffered: false });
  });
  await page.keyboard.press('2');
  await expect(html(page)).toHaveAttribute('data-state', 'section');
  await page.waitForTimeout(500);
  expect(Math.max(0, ...await page.evaluate(() => window.__long))).toBeLessThanOrEqual(50);
});
