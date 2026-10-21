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
import { getStorage, introSeen, markIntroSeen } from './storage.js';

const html = document.documentElement;
const $ = id => document.getElementById(id);
const cam = $('cam'), svg = $('scene'), photo = $('photo');

renderBrewLog($('brewlog'), COFFEES);

// static mode: reduced motion, or GSAP never arrived
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = !reduced && window.gsap ? window.gsap : null;
html.classList.toggle('vf-static', !gsap);

// test hook: ?vfspeed=N speeds every animation up N times
const speed = Number(new URLSearchParams(location.search).get('vfspeed'));
if (gsap && speed > 0) gsap.globalTimeline.timeScale(speed);

const boxes = createBoxes($('boxes'), { onOpen: key => open(key) });
const hud = createHud(document.querySelector('.hud'));
const sections = createSections($('sections'), { onBack: () => close(), onJump: key => jump(key) });
const motion = createMotion({ gsap, cam, hud, boxes });
const fade = { show: motion.animated ? 450 : 200, hide: motion.animated ? 250 : 200 };

let layout, meas, state, lastKey = null;

// lay the desk out for this screen and re-measure what the camera needs
function fit() {
  motion.resetObjects?.(); // measure the resting desk, independent of the current section pose
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
  // a route queued during a move only updates `pending`: nothing to run yet
  if (next.mode === prev.mode && next.key === prev.key) return;
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
    boxes.place(meas.objects, meas.viewport); // the opened box followed its object; put it back
    if (prev?.mode !== 'intro') await motion.reveal({ fast: true }); // the opening ends in its own reveal
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

// ---- the opening

const DESK_HINT = 'click an object to focus · 1–5';
let photoOk = null, skipRequested = false, swallowClick = false;
let interruptPreload = null;

// fonts + photo, so the autofocus lands on something; never wait more than 2.5 s
function preload() {
  return new Promise(resolve => {
    const img = new Image();
    let settled = false;
    const cap = setTimeout(() => settle(false), 2500);
    const settle = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(cap);
      img.onload = img.onerror = null;
      interruptPreload = null;
      resolve(ok);
    };
    const loaded = new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    Promise.all([loaded, document.fonts.ready]).then(([ok]) => settle(ok));
    img.src = photo.getAttribute('href');
    if (skipRequested) settle(false);
    else interruptPreload = settle;
  });
}

async function runIntro(remember) {
  state = initialState('intro');
  html.dataset.state = 'intro';
  html.dataset.intro = 'played';
  boxes.setInert(true);
  hud.cursor(false);
  hud.setHint('click or any key → skip');
  skipRequested = false;
  const readyPhoto = photoOk ?? await preload();
  if (!skipRequested) photoOk = readyPhoto;
  const ready = motion.intro(meas, { photoOk: readyPhoto });
  if (skipRequested) motion.finish();
  await ready;
  if (remember) markIntroSeen(getStorage(window));
  hud.setHint(DESK_HINT);
  dispatch({ type: 'INTRO_DONE' });
}

// any key or press skips the opening — and is swallowed, so nothing underneath fires.
// A skipping press also swallows its own click (preventDefault on pointerdown doesn't
// cancel click); every new press resets that, however slowly the click arrives.
function skipIntro(e) {
  if (e.type === 'pointerdown') swallowClick = false;
  if (state?.mode !== 'intro' || e.target.closest?.('#replay')) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.type === 'pointerdown') swallowClick = true;
  skipRequested = true;
  interruptPreload?.(false);
  motion.finish();
}
addEventListener('keydown', skipIntro, true);
addEventListener('pointerdown', skipIntro, true);
addEventListener('click', e => {
  if (!swallowClick) return;
  swallowClick = false;
  e.preventDefault();
  e.stopPropagation();
}, true);

$('replay').addEventListener('click', () => state.mode === 'desk' && runIntro(false));

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    motion.finish(); // land the current move first, then re-fit to the new size
    fit();
    const framed = ['opening', 'section', 'hopping'].includes(state.mode) ? state.key : null;
    motion.frame(framed, meas);
  }, 150);
});

// ---- boot

history.scrollRestoration = 'manual';
decorate(svg);
fit();
hud.setCount(boxes.elements().length);
hud.setHint(DESK_HINT);
hud.start();
html.dataset.intro = 'skipped';
window.__vfBooted = true; // early.js keeps camera mode

const deepLink = parseHash(location.hash);
if (deepLink) {
  // straight into the section: no opening, camera already on its object
  state = initialState('section', deepLink);
  html.dataset.state = 'section';
  lastKey = deepLink;
  boxes.setInert(true);
  motion.frame(deepLink, meas);
  sections.show(deepLink, 200);
  html.classList.add('vf-ready');
  if (!history.state?.vf) {
    const sectionUrl = location.href;
    history.replaceState(null, '', location.pathname + location.search);
    history.pushState({ vf: 1 }, '', sectionUrl);
  }
} else if (motion.animated && !introSeen(getStorage(window))) {
  runIntro(true); // lifts the boot screen itself
} else {
  state = initialState('desk');
  html.dataset.state = 'desk';
  enter(null, state);
  html.classList.add('vf-ready');
}
