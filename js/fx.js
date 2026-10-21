// Detector-style text: random glyphs settle into the real label, left to right.

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789_';
const runs = new WeakMap();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scramble(el, text, frames = 16) {
  cancelAnimationFrame(runs.get(el));
  if (reduced()) { el.textContent = text; return; }
  let f = 0;
  const step = () => {
    f++;
    const settled = Math.floor(text.length * f / frames);
    el.textContent = [...text].map((ch, i) => i < settled || ch === ' ' ? ch : GLYPHS[Math.random() * GLYPHS.length | 0]).join('');
    if (f < frames) runs.set(el, requestAnimationFrame(step));
    else el.textContent = text;
  };
  step();
}
