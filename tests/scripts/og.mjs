// Renders the link-preview image (img/og.png, 1200x630) from the live desk.
// Start the local server first (python3 -m http.server 4173 --bind 127.0.0.1), then from the repo root:
//   node tests/scripts/og.mjs
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const gsap = createRequire(import.meta.url).resolve('gsap/dist/gsap.min.js');
const out = new URL('../../img/og.png', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.route(/cdnjs\.cloudflare\.com/, r => r.fulfill({ path: gsap, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }));
await page.addInitScript(() => localStorage.setItem('ksx-viewfinder-intro-v1', '1'));
await page.goto('http://127.0.0.1:4173/?vfspeed=50');
await page.waitForFunction(() => document.documentElement.dataset.state === 'desk');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600); // boxes finish popping in
const shot = await page.screenshot();
await browser.close();
// palette PNG: link-preview crawlers fetch this, keep it light
await sharp(shot).png({ palette: true, quality: 90, effort: 10 }).toFile(out);
console.log('img/og.png');
