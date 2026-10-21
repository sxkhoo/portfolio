// Detection boxes over the desk. Section boxes are the menu (real buttons);
// decor boxes are labels only, hidden from assistive tech.

import { ORDER, SECTIONS, DECOR } from './config.js';
import { scramble } from './fx.js';

const PAD = 8, EDGE = 6, MIN = 44;

const span = (cls, text) => {
  const s = document.createElement('span');
  s.className = cls;
  s.textContent = text;
  return s;
};

export function createBoxes(root, { onOpen }) {
  const boxes = {}; // key → { el, object }

  function add(key, def, decor) {
    const el = document.createElement(decor ? 'div' : 'button');
    const label = `${def.label} ${def.conf}`, tag = span('tag', label);
    el.className = `box ${decor ? 'decor' : 'obj'}`;
    el.dataset.key = key;
    el.style.setProperty('--c', `var(--c-${decor ? 'decor' : key})`);
    el.append(span('fr', ''), tag);
    if (decor) {
      el.setAttribute('aria-hidden', 'true');
      el.addEventListener('mouseenter', () => scramble(tag, def.quip, 12));
      el.addEventListener('mouseleave', () => scramble(tag, label, 10));
    } else {
      el.type = 'button';
      el.setAttribute('aria-label', `Open ${def.name} (${def.label})`);
      el.append(span('go', `→ ${def.name.toUpperCase()}`));
      el.addEventListener('click', () => onOpen(key));
    }
    root.append(el);
    boxes[key] = { el, object: def.object, tag, label };
  }

  ORDER.forEach(k => add(k, SECTIONS[k], false));
  Object.entries(DECOR).forEach(([k, d]) => add(k, d, true));

  const setBox = (el, l, t, r, b) => Object.assign(el.style, { left: l + 'px', top: t + 'px', width: Math.max(0, r - l) + 'px', height: Math.max(0, b - t) + 'px' });

  return {
    // pad each object's box, grow it to a tappable size, keep it on screen
    place(objects, viewport) {
      for (const { el, object } of Object.values(boxes)) {
        const o = objects[object];
        let l = o.left - PAD, t = o.top - PAD, r = o.left + o.width + PAD, b = o.top + o.height + PAD;
        if (r - l < MIN) { const c = (l + r) / 2; l = c - MIN / 2; r = c + MIN / 2; }
        if (b - t < MIN) { const c = (t + b) / 2; t = c - MIN / 2; b = c + MIN / 2; }
        setBox(el, Math.max(l, EDGE), Math.max(t, EDGE), Math.min(r, viewport.w - EDGE), Math.min(b, viewport.h - EDGE));
      }
    },
    setVisible(on) { root.classList.toggle('on', on); },
    elements: () => Object.entries(boxes).map(([key, { el, tag, label }]) => ({ key, el, tag, label, top: parseFloat(el.style.top) || 0 })),
    lock(key) { for (const [k, { el }] of Object.entries(boxes)) el.classList.toggle('lock', k === key); },
    // follow an object while the camera moves (unclamped: it grows past the screen)
    track(key, rect) { setBox(boxes[key].el, rect.left - PAD, rect.top - PAD, rect.left + rect.width + PAD, rect.top + rect.height + PAD); },
    focus(key) { boxes[key]?.el.focus({ preventScroll: true }); },
    setInert(on) { root.inert = on; },
  };
}
