import { COFFEES } from './data/coffees.js';
import { renderBrewLog } from './brewlog.js';
import { LAYOUTS, pickLayout } from './layout.js';
import { decorate, applyLayout, measure, photoHref } from './scene.js';

const html = document.documentElement;
const cam = document.getElementById('cam');
const svg = document.getElementById('scene');
const photo = document.getElementById('photo');

renderBrewLog(document.getElementById('brewlog'), COFFEES);

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
}

decorate(svg);
fit();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fit, 150);
});

// booted: early.js keeps camera mode, and the boot screen can lift
window.__vfBooted = true;
html.classList.add('vf-ready');
