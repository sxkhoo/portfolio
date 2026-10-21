import { COFFEES } from './data/coffees.js';
import { renderBrewLog } from './brewlog.js';
import { ORDER } from './config.js';
import { LAYOUTS, pickLayout } from './layout.js';
import { decorate, applyLayout, measure, photoHref } from './scene.js';
import { createBoxes } from './boxes.js';
import { createHud } from './hud.js';
import { createSections } from './sections.js';
import { createMotion } from './motion.js';
import { initialState, reduce } from './state.js';
import { parseHash, hashFor } from './router.js';

const html = document.documentElement;
const $ = id => document.getElementById(id);
const cam = $('cam'), svg = $('scene'), photo = $('photo');

renderBrewLog($('brewlog'), COFFEES);

// static mode: reduced motion, or GSAP never arrived
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = !reduced && window.gsap ? window.gsap : null;
html.classList.toggle('vf-static', !gsap);

const boxes = createBoxes($('boxes'), { onOpen: key => open(key) });
const hud = createHud(document.querySelector('.hud'));
const sections = createSections($('sections'), { onBack: () => close(), onJump: key => jump(key) });
const motion = createMotion({ gsap, cam, hud, boxes });
const fade = { show: motion.animated ? 450 : 200, hide: motion.animated ? 250 : 200 };

let layout, meas, state, lastKey = null;

// lay the desk out for this screen and re-measure what the camera needs
function fit() {
  const name = pickLayout(innerWidth, innerHeight);
  layout = LAYOUTS[name];
  html.dataset.layout = name;
  applyLayout(svg, layout);
  const href = photoHref(innerWidth, devicePixelRatio || 1);
  if (photo.getAttribute('href') !== href) photo.setAttribute('href', href);
  meas = measure(cam, svg, layout);
  boxes.place(meas.objects, meas.viewport);
}

// ---- state: every change goes through the reducer, effects run on entry

function dispatch(event) {
  const prev = state, next = reduce(state, event);
  if (next === prev) return;
  state = next;
  html.dataset.state = next.mode;
  enter(prev, next);
}

async function enter(prev, { mode, key, from }) {
  if (mode === 'opening') {
    lastKey = key;
    boxes.lock(key);
    boxes.setInert(true);
    hud.cursor(false);
    await motion.open(key, meas);
    dispatch({ type: 'ARRIVED' });
  } else if (mode === 'section') {
    sections.show(key, fade.show);
  } else if (mode === 'closing') {
    lastKey = key;
    await Promise.all([sections.hide(key, fade.hide), motion.close(key, meas)]);
    dispatch({ type: 'ARRIVED' });
  } else if (mode === 'hopping') {
    lastKey = key;
    sections.hide(from, fade.hide);
    await motion.hop(from, key, meas);
    dispatch({ type: 'ARRIVED' });
  } else if (mode === 'desk') {
    boxes.lock(null);
    await motion.reveal({ fast: true });
    if (state.mode !== 'desk') return; // already moving again
    boxes.setInert(false);
    hud.cursor(true);
    if (prev?.mode === 'closing' && lastKey) boxes.focus(lastKey);
  }
}

// ---- input: UI acts only on the desk or inside a section; the URL always follows

function open(key) {
  if (state.mode !== 'desk') return;
  history.pushState({ vf: 1 }, '', hashFor(key));
  dispatch({ type: 'OPEN', key });
}

function close() {
  if (state.mode !== 'section') return;
  if (history.state?.vf) return history.back(); // hashchange routes us back to the desk
  history.replaceState(null, '', location.pathname + location.search);
  dispatch({ type: 'CLOSE' });
}

function jump(key) {
  if (state.mode !== 'section' || key === state.key) return;
  history.replaceState(history.state, '', hashFor(key));
  dispatch({ type: 'JUMP', key });
}

const hop = dir => state.mode === 'section' && jump(ORDER[(ORDER.indexOf(state.key) + dir + ORDER.length) % ORDER.length]);

addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (state.mode === 'desk' && /^[1-5]$/.test(e.key)) open(ORDER[e.key - 1]);
  else if (state.mode === 'section') {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') hop(1);
    else if (e.key === 'ArrowLeft') hop(-1);
  }
});

addEventListener('hashchange', () => dispatch({ type: 'ROUTE', target: parseHash(location.hash) }));

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    fit();
    if (state.mode !== 'desk') motion.frame(state.key, meas);
  }, 150);
});

// ---- boot

history.scrollRestoration = 'manual';
decorate(svg);
fit();
hud.setCount(boxes.elements().length);
hud.setHint('click an object to focus · 1–5');
hud.start();
html.dataset.intro = 'skipped';

const deepLink = parseHash(location.hash);
if (deepLink) {
  // straight into the section: no opening, camera already on its object
  state = initialState('section', deepLink);
  html.dataset.state = 'section';
  lastKey = deepLink;
  boxes.setInert(true);
  motion.frame(deepLink, meas);
  sections.show(deepLink, 200);
} else {
  state = initialState('desk');
  html.dataset.state = 'desk';
  enter(null, state);
}

// booted: early.js keeps camera mode, and the boot screen can lift
window.__vfBooted = true;
html.classList.add('vf-ready');
