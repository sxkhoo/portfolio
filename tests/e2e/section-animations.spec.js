import { test, expect } from '@playwright/test';
import { gotoVF, ORDER, SECTIONS, TARGETS } from './helpers.js';

const html = page => page.locator('html');
const button = (page, key) => page.locator(`.box[data-key="${key}"]`);
const target = key => TARGETS[key] ?? SECTIONS[key].target;

async function deskReady(page) {
  await expect(html(page)).toHaveAttribute('data-state', 'desk');
  await expect(page.locator('#boxes')).not.toHaveAttribute('inert', '');
  await expect.poll(() => page.locator('#boxes button').evaluateAll(elements =>
    elements.every(el => getComputedStyle(el).transform === 'none'))).toBe(true);
}

const covers = (page, key) => page.locator(`#${target(key)}`).evaluate(el => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left <= 1 && r.top <= 1 &&
    r.right >= innerWidth - 1 && r.bottom >= innerHeight - 1;
});

const baseline = page => page.evaluate(() => {
  const selectors = ['#anim-laptop', '#screen-glow', '#code', '#anim-v60', '#tilt-v60',
    '#v60-saucer', '#v60-handle', '#v60-top', '#v60-side', '#v60-body', '#v60-empty', '#z-v60', '#bloom',
    '#spill', '#coffee-puddle', '#coffee-stream', '#coffee-drops', '#anim-phone',
    '#candles', '#vol', '#anim-polaroid', '#photo', '#anim-envelope', '#letter', '#flap'];
  const rect = el => {
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map(value => +value.toFixed(2));
  };
  return {
    parts: selectors.map(selector => {
      const el = document.querySelector(selector), style = getComputedStyle(el);
      return [selector, el.getAttribute('transform'), el.getAttribute('d'), style.display, style.opacity, style.transform];
    }),
    boxes: [...document.querySelectorAll('#boxes button')].map(el => [el.dataset.key, rect(el)]),
    objects: ['v60', 'phone', 'polaroid', 'envelope'].map(key => rect(document.getElementById(`obj-${key}`))),
    count: document.querySelectorAll('#scene *').length,
  };
});

// Start before activation and await the whole rAF interval. Sample local SVG
// properties, so a moving camera alone cannot satisfy an object-reaction test.
const sample = (page, key) => page.evaluate(section => new Promise(resolve => {
  const values = [];
  let started;
  const opacity = id => +getComputedStyle(document.getElementById(id)).opacity;
  const matrix = id => {
    const transforms = document.getElementById(id).transform.baseVal;
    return transforms.numberOfItems ? transforms.getItem(0).matrix : { a: 1, b: 0, d: 1, f: 0 };
  };
  function frame(now) {
    let value;
    if (section === 'work') value = [opacity('screen-glow'), opacity('code')];
    if (section === 'coffee') {
      const face = matrix('v60-top');
      value = [face.e, matrix('coffee-puddle').a,
        parseFloat(getComputedStyle(document.getElementById('coffee-stream')).strokeDashoffset),
        getComputedStyle(document.getElementById('spill')).display !== 'none',
        face.a * face.d - face.b * face.c, opacity('v60-side'), opacity('z-v60')];
      const plate = document.getElementById('v60-saucer').getBoundingClientRect();
      value.push([plate.x, plate.y, plate.width, plate.height]);
    }
    if (section === 'trade') value = [matrix('anim-phone').f, matrix('candles').d];
    if (section === 'about') value = [matrix('anim-polaroid').b, opacity('photo')];
    if (section === 'contact') value = [matrix('flap').d, matrix('letter').f, opacity('letter')];
    values.push({ value, state: document.documentElement.dataset.state,
      overlay: !!document.querySelector('.sec.is-open.is-visible') });
    if (now - started < 850) requestAnimationFrame(frame); else resolve(values);
  }
  function activate(event) {
    if (event.type === 'click' && !event.target.closest('#boxes button')) return;
    document.removeEventListener('click', activate, true);
    document.removeEventListener('keydown', activate, true);
    started = performance.now();
    requestAnimationFrame(frame);
  }
  document.addEventListener('click', activate, true);
  document.addEventListener('keydown', activate, true);
}), key);

for (const [index, key] of ORDER.entries()) test(`${key} reacts before zoom, resets and replays`, async ({ page }) => {
  await gotoVF(page, { introSeen: true });
  await deskReady(page);
  const before = await baseline(page);
  for (let run = 0; run < 2; run++) {
    const observations = sample(page, key);
    if (run === 0) await button(page, key).click(); else await page.keyboard.press(String(index + 1));
    const frames = (await observations).filter(frame => frame.state === 'opening');
    expect(frames.length).toBeGreaterThan(5);
    expect(new Set(frames.map(frame => JSON.stringify(frame.value))).size,
      JSON.stringify(frames.filter((_, i) => i % 8 === 0))).toBeGreaterThan(3);
    expect(frames.every(frame => !frame.overlay)).toBe(true);
    if (key === 'coffee') {
      expect(frames.some(frame => frame.value[3] && frame.value[2] < .8)).toBe(true);
      expect(frames.some(frame => frame.value[1] > .4 && frame.value[1] < 1)).toBe(true);
      const beforeSpill = frames.filter(frame => !frame.value[3] || frame.value[2] >= .8);
      expect(beforeSpill.some(frame => frame.value[4] < .35 && frame.value[5] > .5)).toBe(true);
      expect(frames.some(frame => frame.value[0] < -50 && frame.value[4] < .35 && frame.value[5] > .5)).toBe(true);
      expect(frames.filter(frame => frame.value[4] > .95).every(frame => frame.value[2] >= .99)).toBe(true);
      expect(frames.some(frame => frame.value[6] < .4)).toBe(true);
      // During the entire pre-zoom fall, the actual circular plate stays put.
      const plate = frames[0].value[7];
      expect(plate[2]).toBeCloseTo(plate[3], 1);
      for (const frame of frames) for (let i = 0; i < 4; i++) expect(frame.value[7][i]).toBeCloseTo(plate[i], 1);
    }
    await expect(html(page)).toHaveAttribute('data-state', 'section');
    await expect(page.locator(`#${key}-h`)).toBeFocused();
    await expect.poll(() => covers(page, key)).toBe(true);
    if (key === 'coffee' || key === 'contact') {
      await expect(page.locator(key === 'coffee' ? '#coffee-puddle' : '#letter')).toBeVisible();
    }
    if (key === 'coffee') {
      const rimGap = await page.evaluate(() => {
        const m = document.querySelector('#v60-top').transform.baseVal.getItem(0).matrix;
        const start = document.querySelector('#coffee-stream').getAttribute('d').match(/-?\d*\.?\d+/g).slice(0, 2).map(Number);
        return Math.hypot(start[0] - (-58 * m.a + 35 * m.c + m.e), start[1] - (-58 * m.b + 35 * m.d + m.f));
      });
      expect(rimGap).toBeLessThan(.1);
    }
    await page.keyboard.press('Escape');
    await deskReady(page);
    expect(await baseline(page)).toEqual(before);
  }
});

test('revealed surfaces work through deep links, every hop and resize', async ({ page }) => {
  for (const key of ['coffee', 'contact']) {
    await gotoVF(page, { hash: `#${key}`, introSeen: true, speed: 8 });
    await expect(html(page)).toHaveAttribute('data-section', key);
    await expect.poll(() => covers(page, key)).toBe(true);
    await expect(page.locator(key === 'coffee' ? '#coffee-puddle' : '#letter')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => covers(page, key)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(() => covers(page, key)).toBe(true);
    let index = ORDER.indexOf(key);
    for (let i = 0; i < ORDER.length; i++) {
      index = (index + 1) % ORDER.length;
      await page.keyboard.press('ArrowRight');
      await expect(html(page)).toHaveAttribute('data-section', ORDER[index]);
      await expect(html(page)).toHaveAttribute('data-state', 'section');
      await expect.poll(() => covers(page, ORDER[index])).toBe(true);
    }
  }
});

test('resize and queued back during a spill return a clean, usable desk', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: .5 });
  await deskReady(page);
  await button(page, 'coffee').click();
  await expect(html(page)).toHaveAttribute('data-state', 'opening');
  await page.goBack();
  await page.setViewportSize({ width: 390, height: 844 });
  await deskReady(page);
  await expect(page.locator('#coffee-puddle')).toBeHidden();
  await expect(page.locator('#letter')).toBeHidden();
  const box = await button(page, 'coffee').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await button(page, 'contact').click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(html(page)).toHaveAttribute('data-section', 'contact');
  await expect.poll(() => covers(page, 'contact')).toBe(true);
});

test.describe('phone touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('all section objects remain tappable and restore their bounds', async ({ page }) => {
    await gotoVF(page, { introSeen: true, speed: 4 });
    await deskReady(page);
    const before = await baseline(page);
    for (const key of ORDER) {
      await button(page, key).tap();
      await expect(html(page)).toHaveAttribute('data-section', key);
      await expect.poll(() => covers(page, key)).toBe(true);
      await page.locator('.secbar .back').click();
      await deskReady(page);
      expect(await baseline(page)).toEqual(before);
    }
  });
});

for (const mode of [{ reducedMotion: 'reduce' }, { blockGsap: true }]) test(`object effects stay off in ${JSON.stringify(mode)}`, async ({ page }) => {
  await gotoVF(page, { introSeen: true, ...mode });
  await deskReady(page);
  const before = await baseline(page);
  for (const key of ORDER) {
    await button(page, key).click();
    await expect(html(page)).toHaveAttribute('data-section', key);
    expect(await page.locator('#cam').evaluate(el => getComputedStyle(el).transform)).toBe('none');
    expect(await baseline(page)).toEqual(before);
    await page.keyboard.press('Escape');
    await deskReady(page);
  }
});
