import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svgScale, fitCamera, restCamera, lerpCamera, toTransform } from '../../js/camera.js';

const near = (actual, expected, tol = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} not within ${tol} of ${expected}`);
const deepNear = (actual, expected) => { for (const k in expected) near(actual[k], expected[k]); };

test('svgScale', () => {
  assert.equal(svgScale({ w: 1440, h: 900 }, [0, 0, 1600, 1000], 'slice'), 0.9);
  assert.equal(svgScale({ w: 1920, h: 1080 }, [0, 0, 1600, 1000], 'slice'), 1.2);
  assert.equal(svgScale({ w: 390, h: 844 }, [0, 0, 1000, 1600], 'slice'), 0.5275);
  assert.equal(svgScale({ w: 390, h: 844 }, [0, 0, 1600, 1000], 'meet'), 0.24375);
});

const VP = { w: 1440, h: 900 };

test('fitCamera frames the laptop screen like the mockup', () => {
  const cam = fitCamera({ rect: { left: 516.6, top: 129.6, width: 406.8, height: 243 }, size: { w: 452, h: 270 }, tilt: 0, k: 0.9, viewport: VP });
  near(cam.ox, 720); near(cam.oy, 251.1); assert.equal(cam.rotation, 0); near(cam.scale, 3.7593, 1e-3);
  const tr = toTransform(cam, VP);
  near(tr.x, 0); near(tr.y, 198.9); assert.equal(tr.transformOrigin, '720px 251.1px');
});

test('fitCamera counter-rotates tilted targets and sizes from their own box', () => {
  const cam = fitCamera({ rect: { left: 100, top: 100, width: 300, height: 400 }, size: { w: 134, h: 294 }, tilt: -10, k: 0.9, viewport: VP });
  assert.equal(cam.rotation, 10); near(cam.scale, 12.119, 1e-3);
});

test('coffee bed zoom is ~16x', () => {
  near(fitCamera({ rect: { left: 0, top: 0, width: 90, height: 90 }, size: { w: 100, h: 100 }, tilt: 0, k: 0.9, viewport: VP }).scale, 16.24, 1e-2);
});

test('restCamera is the identity transform', () => {
  assert.deepEqual(toTransform(restCamera(VP), VP), { x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '720px 450px' });
});

test('lerpCamera endpoints, geometric midpoint, and dip', () => {
  const a = { ox: 720, oy: 251.1, rotation: 0, scale: 3.7593 }, b = { ox: 1125, oy: 241.2, rotation: 0, scale: 16.24 };
  deepNear(lerpCamera(a, b, 0), a); deepNear(lerpCamera(a, b, 1), b);
  near(lerpCamera(a, b, 0.5).scale, Math.sqrt(a.scale * b.scale));
  assert.ok(lerpCamera(a, b, 0.5, 0.55).scale < a.scale);
});

// mulberry32: small seeded PRNG so the property cases are repeatable
const rng = seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const rotate = (x, y, deg) => {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
};

test('a fitted camera covers every viewport corner', () => {
  const rand = rng(42), span = (lo, hi) => lo + rand() * (hi - lo);
  for (let i = 0; i < 200; i++) {
    const viewport = { w: span(320, 2560), h: span(480, 1440) };
    const k = span(0.3, 2), tilt = span(-30, 30), size = { w: span(20, 600), h: span(20, 600) };
    const rect = { left: span(-200, 1800), top: span(-200, 1200), width: span(10, 500), height: span(10, 500) };
    const cam = fitCamera({ rect, size, tilt, k, viewport });
    const cx = viewport.w / 2, cy = viewport.h / 2;
    for (const [px, py] of [[0, 0], [viewport.w, 0], [0, viewport.h], [viewport.w, viewport.h]]) {
      // screen corner → rest pose: q = o + R(-rotation)·((p - centre) / scale)
      const [dx, dy] = rotate((px - cx) / cam.scale, (py - cy) / cam.scale, -cam.rotation);
      // rest pose → target's own (untilted) frame
      const [lx, ly] = rotate(dx, dy, -tilt);
      assert.ok(Math.abs(lx) <= size.w * k / 2 + 1e-6 && Math.abs(ly) <= size.h * k / 2 + 1e-6, `case ${i} corner ${px},${py}`);
    }
  }
});
