import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');

test('vercel.json keeps clean URLs and sends the security headers', () => {
  const cfg = JSON.parse(read('vercel.json'));
  assert.equal(cfg.cleanUrls, true);
  assert.equal(cfg.trailingSlash, false);
  const rule = cfg.headers.find(h => h.source === '/(.*)');
  const headers = Object.fromEntries(rule.headers.map(h => [h.key, h.value]));
  assert.deepEqual(headers, {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
});

// the CSP has no 'unsafe-inline': anything inline in the page would be blocked
test('index.html has nothing inline that the CSP would block', () => {
  const html = read('index.html');
  assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), false, 'inline <script>');
  assert.equal(/\sstyle="/i.test(html), false, 'style="" attribute');
  assert.equal(/\son[a-z]+="/i.test(html), false, 'inline event handler');
});

test('share image is 1200x630', async () => {
  const { width, height } = await sharp(new URL('img/og.png', root).pathname).metadata();
  assert.deepEqual([width, height], [1200, 630]);
});
