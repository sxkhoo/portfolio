import { test, expect } from '@playwright/test';
import { gotoVF, ORDER, rectOf } from './helpers.js';

const state = page => page.locator('html');

for (const mode of [{ reducedMotion: 'reduce' }, { blockGsap: true }]) test.describe(JSON.stringify(mode), () => {
  test('click opens each section; Escape returns focus to its box', async ({ page }) => {
    await gotoVF(page, { introSeen: true, ...mode });
    for (const k of ORDER) {
      await expect(state(page)).toHaveAttribute('data-state', 'desk');
      await page.locator(`.box[data-key="${k}"]`).click();
      await expect(state(page)).toHaveAttribute('data-state', 'section');
      await expect(page).toHaveURL(new RegExp(`#${k}$`));
      await expect(page.locator(`#${k}-h`)).toBeFocused();
      await expect(page.locator('.sec.is-open')).toHaveCount(1);
      await page.keyboard.press('Escape');
      await expect(state(page)).toHaveAttribute('data-state', 'desk');
      await expect(page.locator(`.box[data-key="${k}"]`)).toBeFocused();
    }
  });

  test('keys 1-5, arrows wrap, chips jump', async ({ page }) => {
    await gotoVF(page, { introSeen: true, ...mode });
    await expect(state(page)).toHaveAttribute('data-state', 'desk');
    await page.keyboard.press('5');
    await expect(state(page)).toHaveAttribute('data-section', 'contact');
    await expect(state(page)).toHaveAttribute('data-state', 'section');
    await page.keyboard.press('ArrowRight');
    await expect(state(page)).toHaveAttribute('data-section', 'work');
    await expect(state(page)).toHaveAttribute('data-state', 'section');
    await expect(page).toHaveURL(/#work$/);
    await page.keyboard.press('ArrowLeft');
    await expect(state(page)).toHaveAttribute('data-section', 'contact');
    await expect(state(page)).toHaveAttribute('data-state', 'section');
    await page.locator('.secbar .chip[data-k="about"]').click();
    await expect(state(page)).toHaveAttribute('data-section', 'about');
    await expect(page).toHaveURL(/#about$/);
    await expect(page.locator('.secbar .chip[data-k="about"]')).toHaveClass(/\bon\b/);
  });

  test('back and forward', async ({ page }) => {
    await gotoVF(page, { introSeen: true, ...mode });
    await page.locator('.box[data-key="work"]').click();
    await expect(state(page)).toHaveAttribute('data-state', 'section');
    await page.goBack();
    await expect(state(page)).toHaveAttribute('data-state', 'desk');
    expect(await page.evaluate(() => location.hash)).toBe('');
    await page.goForward();
    await expect(state(page)).toHaveAttribute('data-section', 'work');
    await expect(state(page)).toHaveAttribute('data-state', 'section');
  });

  test('deep links open directly without the intro', async ({ page }) => {
    for (const k of ORDER) {
      await gotoVF(page, { hash: `#${k}`, ...mode });
      await expect(state(page)).toHaveAttribute('data-section', k);
      await expect(state(page)).toHaveAttribute('data-state', 'section');
      await expect(state(page)).toHaveAttribute('data-intro', 'skipped');
    }
  });

  test('#home, #top and unknown hashes show the desk', async ({ page }) => {
    for (const hash of ['#home', '#top', '#foo']) {
      await gotoVF(page, { hash, introSeen: true, ...mode });
      await expect(state(page)).toHaveAttribute('data-state', 'desk');
      await expect(page.locator('.sec.is-open')).toHaveCount(0);
    }
  });
});

test('static mode never moves the camera', async ({ page }) => {
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  for (const [i, k] of ORDER.entries()) {
    await page.keyboard.press(String(i + 1));
    await expect(state(page)).toHaveAttribute('data-section', k);
    expect(await page.locator('#cam').evaluate(el => getComputedStyle(el).transform)).toBe('none');
    expect(await page.locator(`#${k}`).evaluate(el => parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(0.2);
    await page.keyboard.press('Escape');
    await expect(state(page)).toHaveAttribute('data-state', 'desk');
  }
  expect(await page.locator('#cam').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});

test('GSAP blocked switches on static mode', async ({ page }) => {
  await gotoVF(page, { introSeen: true, blockGsap: true });
  await expect(state(page)).toHaveClass(/\bvf-static\b/);
});

test('contact switches the HUD to dark ink', async ({ page }) => {
  await gotoVF(page, { hash: '#contact', reducedMotion: 'reduce' });
  await expect(state(page)).toHaveAttribute('data-section', 'contact');
  await expect(page.locator('.hud-tl')).toHaveCSS('color', 'rgb(30, 43, 79)');
});

test('[review] long sections clear the bar on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoVF(page, { hash: '#work', reducedMotion: 'reduce' });
  await expect(state(page)).toHaveAttribute('data-state', 'section');
  await page.locator('#work').evaluate(el => el.scrollTo(0, el.scrollHeight));
  const last = await rectOf(page, '#work .sec-inner > :last-child'), bar = await rectOf(page, '.secbar');
  expect(last.y + last.height, JSON.stringify({ last, bar })).toBeLessThanOrEqual(bar.y);
});

test('[review] desk boxes are inert outside the desk', async ({ page }) => {
  await gotoVF(page, { hash: '#work', reducedMotion: 'reduce' });
  await expect(page.locator('#boxes')).toHaveAttribute('inert', '');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#boxes'))).toBe(false);
  }
});
