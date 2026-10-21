// Detector-style text: random glyphs settle into the real label, left to right.

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789_';
const runs = new WeakMap();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// writes textContent, or an attribute when given (for labels drawn by CSS content)
export function scramble(el, text, frames = 16, attr = null) {
  const write = t => attr ? el.setAttribute(attr, t) : (el.textContent = t);
  cancelAnimationFrame(runs.get(el));
  if (reduced()) { write(text); return; }
  let f = 0;
  const step = () => {
    f++;
    const settled = Math.floor(text.length * f / frames);
    write([...text].map((ch, i) => i < settled || ch === ' ' ? ch : GLYPHS[Math.random() * GLYPHS.length | 0]).join(''));
    if (f < frames) runs.set(el, requestAnimationFrame(step));
    else write(text);
  };
  step();
}
