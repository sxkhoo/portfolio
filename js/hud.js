// The camera overlay: timecode, detection count, zoom readout, hint, desk reticle.

const pad = n => String(n).padStart(2, '0');

export function createHud(root) {
  const $ = id => document.getElementById(id);
  const tc = $('tc'), count = $('objcount'), hint = $('hint'), mark = root.querySelector('.fscale .mk'), cur = $('cur');
  const fine = matchMedia('(pointer: fine)').matches;
  let t0 = 0, clock = 0, last = -1;
  let following = false, loop = 0, mx = -100, my = -100, cx = -100, cy = -100;

  // timecode HH:MM:SS:FF at 24 fps; rAF pauses with the tab, text only changes per frame
  function tick(now) {
    const f = Math.floor((now - t0) / 1000 * 24);
    if (f !== last) {
      last = f;
      tc.textContent = [Math.floor(f / 86400), Math.floor(f / 1440) % 60, Math.floor(f / 24) % 60, f % 24].map(pad).join(':');
    }
    clock = requestAnimationFrame(tick);
  }

  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  function follow() {
    cx += (mx - cx) * .3; cy += (my - cy) * .3;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    loop = following ? requestAnimationFrame(follow) : 0;
  }

  return {
    start() {
      if (clock) return;
      t0 = performance.now();
      clock = requestAnimationFrame(tick);
    },
    setZoom(scale) {
      const text = scale.toFixed(1) + '×';
      for (const id of ['zoomx', 'zoomx2']) { const el = $(id); if (el) el.textContent = text; }
      mark.style.left = (78 - Math.min(Math.log(Math.max(scale, 1)) / Math.log(18), 1) * 64) + '%';
    },
    setCount(n) { count.textContent = String(n); },
    setHint(text) { hint.textContent = text; },
    cursor(on) {
      following = on && fine;
      document.documentElement.classList.toggle('vf-cursor', following);
      if (following && !loop) loop = requestAnimationFrame(follow);
    },
  };
}
