import { createRequire } from 'node:module';

export { ORDER, SECTIONS } from '../../js/config.js';

const require = createRequire(import.meta.url);
const GSAP_FILE = require.resolve('gsap/dist/gsap.min.js');

export const VIEWPORTS = [[1024, 768], [1366, 657], [1440, 900], [1920, 1080], [2560, 1080], [390, 844]];

// open the site in a controlled way: no web fonts, GSAP served locally (byte-identical
// to the pinned cdnjs build, so SRI still passes), optional blocks and motion setting
export async function gotoVF(page, { hash = '', introSeen = false, speed = 1, reducedMotion = 'no-preference', blockGsap = false, blockPhoto = false } = {}) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\//, r => blockGsap
    ? r.abort()
    : r.fulfill({ path: GSAP_FILE, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }));
  if (blockPhoto) await page.route(/img\/pfp-\d+\.webp/, r => r.abort());
  if (introSeen) await page.addInitScript(key => { try { localStorage.setItem(key, '1'); } catch {} }, 'ksx-viewfinder-intro-v1');
  await page.emulateMedia({ reducedMotion });
  await page.goto(`/?vfspeed=${speed}${hash}`);
}

// geometry box of an element. Playwright's boundingBox() in WebKit includes SVG
// filter regions (drop shadows), so measure the way the app does instead.
export const rectOf = (page, selector) => page.locator(selector).first().evaluate(el => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
});

export const inside = (r, box, tol = 1) =>
  r.x >= box.x - tol && r.y >= box.y - tol && r.x + r.width <= box.x + box.width + tol && r.y + r.height <= box.y + box.height + tol;

export const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
