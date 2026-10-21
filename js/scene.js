// The drawn desk: generated detail, layout, and measurements for the camera.
// Nothing here touches the DOM at import time.

import { ORDER, SECTIONS } from './config.js';
import { svgScale, fitCamera, restCamera, toTransform } from './camera.js';

// mulberry32: seeded, so the desk looks the same on every visit
const prng = seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const f = n => n.toFixed(1);

export function decorate(svg, seed = 7) {
  const rand = prng(seed);
  const $ = id => svg.getElementById(id);

  // wood grain across the whole (oversized) desk
  let s = '';
  for (let i = 0; i < 80; i++) {
    const y = -400 + i * 30 + rand() * 12;
    let d = `M-600 ${f(y)}`;
    for (let x = -600; x <= 2200; x += 200) d += ` Q${x + 100} ${f(y + (rand() - .5) * 16)} ${x + 200} ${f(y + (rand() - .5) * 6)}`;
    s += `<path d="${d}" stroke-width="${f(1 + rand() * 2.5)}" opacity="${(.3 + rand() * .7).toFixed(2)}"/>`;
  }
  $('grain').innerHTML = s;

  // laptop keyboard: 6 rows × 14 keys, wide space bar
  const kx = 42, ky = 330, kw = (396 - 13 * 4) / 14, kh = (136 - 5 * 4) / 6;
  s = '';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) {
    if (r === 5 && c > 4 && c < 10) continue;
    const w = r === 5 && c === 4 ? kw * 6 + 20 : kw;
    s += `<rect x="${f(kx + c * (kw + 4))}" y="${f(ky + r * (kh + 4))}" width="${f(w)}" height="${f(kh)}" rx="3"/>`;
  }
  $('keys').innerHTML = s;

  // code pane + PCB pins on the laptop screen
  const cols = ['#5b74c9', '#9aa6c8', '#c792ea', '#7fd1b9', '#f2a541', '#9aa6c8'], ind = [0, 8, 8, 16, 16, 8, 0];
  s = '';
  for (let i = 0; i < 19; i++) s += `<rect x="${24 + ind[i % 7]}" y="${46 + i * 11}" width="${(30 + rand() * 120).toFixed(0)}" height="4" rx="2" fill="${cols[(i * 7 + 3) % cols.length]}" opacity=".85"/>`;
  $('code').innerHTML = s;
  s = '';
  for (let i = 0; i < 6; i++) s += `<rect x="91" y="${70 + i * 11}" width="5" height="3"/><rect x="156" y="${70 + i * 11}" width="5" height="3"/>`;
  $('pins').innerHTML = s;

  // phone chart: a random walk of candles with volume
  let c = '', v = '', p = 150;
  for (let i = 0; i < 17; i++) {
    const o = p, close = Math.max(112, Math.min(196, p + (rand() - .5) * 24));
    p = close;
    const hi = Math.min(o, close) - 3 - rand() * 8, lo = Math.max(o, close) + 3 + rand() * 8;
    const col = close < o ? '#34D399' : '#F87171', x = 16 + i * 7, vh = 4 + rand() * 16;
    c += `<line x1="${x + 2.5}" x2="${x + 2.5}" y1="${f(hi)}" y2="${f(lo)}" stroke="${col}" stroke-width="1"/><rect x="${x}" y="${f(Math.min(o, close))}" width="5" height="${f(Math.max(Math.abs(close - o), 1.5))}" fill="${col}"/>`;
    v += `<rect x="${x}" y="${f(232 - vh)}" width="5" height="${f(vh)}"/>`;
  }
  $('candles').innerHTML = c;
  $('vol').innerHTML = v;

  // coffee bloom bubbles
  s = '';
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 40;
    s += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="${f(1 + rand() * 3)}" opacity="${(.35 + rand() * .5).toFixed(2)}"/>`;
  }
  $('bloom').innerHTML = s;

  // a small scatter of beans
  s = '';
  for (let i = 0; i < 7; i++) {
    const x = (rand() - .5) * 110, y = (rand() - .5) * 90, r = (rand() * 180).toFixed(0);
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${r})"><ellipse rx="10" ry="7" fill="#4b2b16"/><path d="M-8 1C-3-3 3 3 8-1" stroke="#26150a" stroke-width="1.6" fill="none"/></g>`;
  }
  $('obj-beans').innerHTML = `<g filter="url(#f-sh2)">${s}</g>`;
}

export function applyLayout(svg, layout) {
  svg.setAttribute('viewBox', layout.viewBox.join(' '));
  svg.setAttribute('preserveAspectRatio', layout.aspect);
  const [x, y, w, h] = layout.mat;
  const set = (el, a) => { for (const k in a) el.setAttribute(k, a[k]); };
  set(svg.getElementById('mat'), { x, y, width: w, height: h });
  set(svg.getElementById('mat-stitch'), { x: x + 13, y: y + 13, width: w - 26, height: h - 26 });
  for (const [id, o] of Object.entries(layout.objects))
    svg.getElementById('obj-' + id).setAttribute('transform', `translate(${o.x} ${o.y}) rotate(${o.r}) scale(${o.s ?? 1})`);
}

const rectOf = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
const cssOf = (t, set) => { set.transformOrigin = t.transformOrigin; set.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`; };

// everything the camera needs, measured with the camera at rest
export function measure(cam, svg, layout) {
  const saved = { transform: cam.style.transform, transformOrigin: cam.style.transformOrigin };
  cam.style.transform = 'none';
  const viewport = { w: innerWidth, h: innerHeight };
  const k = svgScale(viewport, layout.viewBox, layout.aspect.endsWith('slice') ? 'slice' : 'meet');

  const objects = {};
  for (const id of Object.keys(layout.objects)) objects[id] = rectOf(svg.getElementById('obj-' + id));

  const targets = {};
  for (const key of ORDER) {
    const { object, target } = SECTIONS[key];
    const el = svg.getElementById(target), bb = el.getBBox(), o = layout.objects[object], s = o.s ?? 1;
    targets[key] = fitCamera({ rect: rectOf(el), size: { w: bb.width * s, h: bb.height * s }, tilt: o.r, k, viewport });
  }

  // the face as it sits when the camera frames the polaroid (the opening's first shot)
  cssOf(toTransform(targets.about, viewport), cam.style);
  const face = rectOf(svg.getElementById('z-face'));

  Object.assign(cam.style, saved);
  return { viewport, k, rest: restCamera(viewport), objects, targets, face };
}

export function photoHref(viewportWidth, dpr) {
  return viewportWidth * dpr > 1600 ? 'img/pfp-2048.webp' : 'img/pfp-1280.webp';
}
