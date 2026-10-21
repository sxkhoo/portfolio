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
      .to(scan, { opacity: 0, duration: .15 }, D - .1);
    for (const { el, top, tag, label } of items) {
      const at = Math.max(0, Math.min(1, top / vh)) * D;
      tl.fromTo(el, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: .32, ease: 'back.out(2)', clearProps: 'opacity,scale' }, at)
        .add(() => scramble(tag, label, 14), at);
    }
    return tl;
  }

  return {
    animated: true,
    revealTimeline,

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
