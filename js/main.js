import { COFFEES } from './data/coffees.js';
import { renderBrewLog } from './brewlog.js';
import { LAYOUTS, pickLayout } from './layout.js';
import { decorate, applyLayout, measure, photoHref } from './scene.js';
import { createBoxes } from './boxes.js';
import { createHud } from './hud.js';

const html = document.documentElement;
const cam = document.getElementById('cam');
const svg = document.getElementById('scene');
const photo = document.getElementById('photo');

renderBrewLog(document.getElementById('brewlog'), COFFEES);

const boxes = createBoxes(document.getElementById('boxes'), { onOpen: () => {} });
const hud = createHud(document.querySelector('.hud'));

let layout, meas;

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

decorate(svg);
fit();
boxes.setVisible(true);
hud.setCount(boxes.elements().length);
hud.setHint('click an object to focus · 1–5');
hud.start();
hud.cursor(true);

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fit, 150);
});

// booted: early.js keeps camera mode, and the boot screen can lift
window.__vfBooted = true;
html.classList.add('vf-ready');
