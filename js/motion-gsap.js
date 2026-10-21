// GSAP driver for Motion: every camera move is one tween of a proxy t through
// lerpCamera, so open, close and hop share the same maths. Sequencing lives in
// timelines only (no timers), so a background tab can't desync anything.

import { SECTIONS } from './config.js';
import { lerpCamera, toTransform } from './camera.js';
import { scramble } from './fx.js';

export function gsapMotion({ gsap, cam, hud, boxes }) {
  const scan = document.getElementById('scan');
  let running = null;

  // play a timeline as the current one; resolves when it completes
  function play(tl) {
    running = tl;
    return new Promise(resolve => tl.eventCallback('onComplete', () => {
      if (running === tl) running = null;
      resolve();
    }));
  }

  // jump whatever is playing to its end, so a new move never fights an old one
  function finish() {
    running?.progress(1);
  }

  function moveCamera(tl, from, to, { at, duration, ease, dip = 0, viewport, onFrame }) {
    const p = { t: 0 };
    tl.to(p, {
      t: 1, duration, ease,
      onUpdate() {
        const c = lerpCamera(from, to, p.t, dip);
        gsap.set(cam, toTransform(c, viewport));
        hud.setZoom(c.scale);
        onFrame?.();
      },
    }, at);
  }

  function blurPulse(tl, at, px, rise, fall) {
    tl.fromTo(cam, { filter: 'blur(0px)' }, { filter: `blur(${px}px)`, duration: rise, ease: 'power2.in' }, at)
      .to(cam, { filter: 'blur(0px)', duration: fall, ease: 'power2.out' }, at + rise)
      .set(cam, { clearProps: 'filter' });
  }

  function revealTimeline(fast) {
    const tl = gsap.timeline(), D = fast ? .5 : .8, vh = innerHeight;
    const items = boxes.elements();
    boxes.setVisible(true);
    gsap.set(items.map(i => i.el), { opacity: 0 });
    tl.set(scan, { y: -10, opacity: 1 }, 0)
      .to(scan, { y: vh + 10, duration: D, ease: 'power1.inOut' }, 0)
      .to(scan, { opacity: 0, duration: .15 }, D - .1)
      .add(() => hud.setCount(items.length), D / 2);
    for (const { el, top, tag, label } of items) {
      const at = Math.max(0, Math.min(1, top / vh)) * D;
      tl.fromTo(el, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: .32, ease: 'back.out(2)', clearProps: 'opacity,scale' }, at)
        .add(() => scramble(tag, label, 14), at);
    }
    return tl;
  }

  // the opening (spec §4.3): boot, autofocus hunts and locks on the face, the name
  // comes in, the camera pulls back to the desk, the detector scans it.
  // Resolves when the reveal starts — the desk is usable while the boxes pop in.
  function intro(meas, { photoOk }) {
    finish();
    const html = document.documentElement, $ = id => document.getElementById(id);
    const tl = gsap.timeline(), vp = meas.viewport;
    const corners = gsap.utils.toArray('.hud .corner'), rows = gsap.utils.toArray('.hud .hud-row, .hud .crosshair');
    const ident = document.querySelector('.ident'), words = gsap.utils.toArray('.ident .name .w > span');
    const fades = gsap.utils.toArray('.ident .status, .ident .links'), sub = ident.querySelector('.sub');
    const af = $('af'), fb = $('facebox'), tag = fb.querySelector('.tag'), faceEl = $('z-face');
    const F = (b, br, s) => `blur(${b}px) brightness(${br}) saturate(${s})`;

    html.classList.remove('vf-ready'); // boot screen covers the first frame (again, on replay)
    hud.setCount(0);
    gsap.set(corners, { opacity: 0, scale: .5 });
    gsap.set(rows, { opacity: 0 });
    tl.add(() => html.classList.add('vf-ready'), .3)
      .to(corners, { opacity: .9, scale: 1, duration: .5, ease: 'expo.out', stagger: .05, clearProps: 'opacity,scale' }, .3)
      .to(rows, { opacity: 1, duration: .3, stagger: .05, clearProps: 'opacity' }, .45);

    let revealAt = .5;
    if (photoOk) {
      const about = meas.targets.about, face = meas.face;
      const fx = face.left + face.width / 2, fy = face.top + face.height / 2;
      // the name starts large near the top, scaled from its bottom-left corner
      gsap.set(ident, { clearProps: 'transform' });
      const r = ident.getBoundingClientRect(), big = Math.max(1, Math.min(1.8, vp.w / 900));
      gsap.set(ident, { transformOrigin: '0% 100%', scale: big, y: 120 - (r.bottom - r.height * big) });
      gsap.set(words, { yPercent: 115 });
      gsap.set([...fades, sub], { opacity: 0 });
      gsap.set(cam, { ...toTransform(about, vp), filter: F(26, 1.8, .3) });
      hud.setZoom(about.scale);
      gsap.set(af, { opacity: 1, x: vp.w / 2 - 45, y: vp.h / 2 - 45, scale: 1 });
      af.classList.remove('lock');
      tag.textContent = 'person 0.99';

      // autofocus hunting, then lock
      let t = .5;
      [[.34, .38, 14, 1.45, .5], [.66, .27, 20, 1.3, .65], [.46, .6, 7, 1.12, .85]].forEach(([px, py, b, br, s]) => {
        tl.to(af, { x: vp.w * px - 45, y: vp.h * py - 45, duration: .13, ease: 'power2.out' }, t)
          .to(cam, { filter: F(b, br, s), duration: .13, ease: 'power1.out' }, t);
        t += .15;
      });
      tl.to(af, { x: fx - 45, y: fy - 45, duration: .18, ease: 'power3.out' }, t)
        .to(cam, { filter: F(0, 1, 1), duration: .24, ease: 'power2.out' }, t)
        .add(() => af.classList.add('lock'), t + .18)
        .to(af, { scale: .82, duration: .07, yoyo: true, repeat: 1 }, t + .18);
      t += .34;

      // the reticle becomes a face box; the name arrives
      tl.set(fb, { opacity: 1, left: fx - 45, top: fy - 45, width: 90, height: 90 }, t)
        .to(fb, { left: face.left - 14, top: face.top - 18, width: face.width + 28, height: face.height + 36, duration: .3, ease: 'expo.out' }, t)
        .to(af, { opacity: 0, duration: .15 }, t)
        .add(() => hud.setCount(1), t)
        .add(() => scramble(tag, 'khoo_shi_xian 0.99', 22), t + .25)
        .to(words, { yPercent: 0, duration: .7, ease: 'expo.out', stagger: .07 }, t + .05)
        .to(fades, { opacity: 1, duration: .3 }, t + .3)
        .to(sub, { opacity: 1, duration: .3 }, t + .4)
        .add(() => scramble(sub, sub.textContent, 18), t + .4);
      t += .6;

      // pull back to the desk, rolling the polaroid's tilt back in
      tl.set(cam, { filter: 'blur(0px)' }, t);
      moveCamera(tl, about, meas.rest, {
        at: t, duration: 1, ease: 'power3.inOut', viewport: vp,
        onFrame: () => {
          if (+gsap.getProperty(fb, 'opacity') === 0) return;
          const f = faceEl.getBoundingClientRect();
          gsap.set(fb, { left: f.left - 14, top: f.top - 18, width: f.width + 28, height: f.height + 36 });
        },
      });
      blurPulse(tl, t, 3, .45, .55);
      tl.to(fb, { opacity: 0, duration: .35 }, t + .5)
        .to(ident, { scale: 1, y: 0, duration: 1, ease: 'power3.inOut' }, t)
        .set(cam, { clearProps: 'transform' }, t + 1)
        .set([ident, ...words, ...fades, sub, af, fb], { clearProps: 'all' }, t + 1.01);
      revealAt = t + .9;
    }

    tl.add(revealTimeline(false), revealAt);
    const ready = new Promise(resolve => tl.add(resolve, revealAt));
    play(tl);
    return ready;
  }

  return {
    animated: true,
    intro,

    reveal({ fast = false } = {}) {
      finish();
      return play(revealTimeline(fast));
    },

    open(key, meas) {
      finish();
      const tl = gsap.timeline();
      const items = boxes.elements(), box = items.find(i => i.key === key).el;
      const obj = document.getElementById('obj-' + SECTIONS[key].object);
      tl.to(items.filter(i => i.key !== key).map(i => i.el), { opacity: 0, duration: .2 }, 0)
        .to(box, { scale: 1.05, duration: .07, yoyo: true, repeat: 3, ease: 'power1.inOut' }, 0);
      moveCamera(tl, meas.rest, meas.targets[key], {
        at: .3, duration: 1.05, ease: 'expo.inOut', viewport: meas.viewport,
        onFrame: () => boxes.track(key, obj.getBoundingClientRect()),
      });
      blurPulse(tl, .3, 7, .45, .6);
      tl.to(box, { opacity: 0, duration: .3 }, .75);
      // the section starts fading in at 1.0 s while the camera settles
      const arrived = new Promise(resolve => tl.add(resolve, 1.0));
      play(tl);
      return arrived;
    },

    close(key, meas) {
      finish();
      const tl = gsap.timeline();
      moveCamera(tl, meas.targets[key], meas.rest, { at: .2, duration: .95, ease: 'expo.inOut', viewport: meas.viewport });
      blurPulse(tl, .2, 5, .4, .55);
      tl.set(cam, { clearProps: 'transform' });
      return play(tl);
    },

    hop(from, to, meas) {
      finish();
      const tl = gsap.timeline();
      moveCamera(tl, meas.targets[from], meas.targets[to], { at: 0, duration: 1.3, ease: 'power2.inOut', dip: .55, viewport: meas.viewport });
      blurPulse(tl, 0, 4, .5, .8);
      return play(tl);
    },

    frame(key, meas) {
      if (!key) {
        gsap.set(cam, { clearProps: 'transform,filter' });
        hud.setZoom(1);
        return;
      }
      const c = meas.targets[key];
      gsap.set(cam, toTransform(c, meas.viewport));
      hud.setZoom(c.scale);
    },

    finish,
  };
}
