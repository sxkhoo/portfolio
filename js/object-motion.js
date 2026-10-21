// Animate nested SVG groups; the outer obj-* transforms belong to layout.
const PARTS = {
  work: ['#anim-laptop', '#screen-glow', '#code'],
  coffee: ['#anim-v60', '#tilt-v60', '#spill', '#coffee-stream', '#coffee-drops', '#coffee-puddle'],
  trade: ['#anim-phone', '#candles', '#vol'],
  about: ['#anim-polaroid', '#photo'],
  contact: ['#anim-envelope', '#letter', '#flap'],
};

export function createObjectMotion(gsap) {
  const parts = Object.fromEntries(Object.entries(PARTS).map(([key, selectors]) => [key,
    selectors.map(selector => {
      const el = document.querySelector(selector);
      return { el, style: el.getAttribute('style'), transform: el.getAttribute('transform') };
    }),
  ]));

  function reset(key) {
    const items = parts[key];
    gsap.killTweensOf(items.map(item => item.el));
    gsap.set(items.map(item => item.el), { clearProps: 'all' });
    for (const { el, style, transform } of items) {
      for (const [name, value] of [['style', style], ['transform', transform]]) {
        if (value === null) el.removeAttribute(name); else el.setAttribute(name, value);
      }
    }
  }

  const resetAll = () => Object.keys(parts).forEach(reset);

  // A final pose is also used for deep links, resize and section-to-section hops.
  function settle(key) {
    if (key === 'work') gsap.set('#screen-glow', { opacity: 1 });
    if (key === 'coffee') {
      gsap.set('#spill, #coffee-puddle, #coffee-stream', { display: 'block' });
      gsap.set('#coffee-puddle', { opacity: 1, scale: 1, svgOrigin: '-160 122' });
      gsap.set('#coffee-stream', { strokeDashoffset: 0 });
      gsap.set('#coffee-drops', { opacity: 0 });
      gsap.set('#tilt-v60', { rotation: -12, svgOrigin: '0 0' });
    }
    if (key === 'contact') {
      gsap.set('#letter', { display: 'block', opacity: 1, y: 0 });
      gsap.set('#flap', { scaleY: -1, svgOrigin: '150 0' });
    }
  }

  function timelineFor(key, tl) {
    reset(key);
    if (key === 'work') {
      gsap.set('#code', { opacity: 0, scaleY: .15, transformOrigin: '50% 100%' });
      tl.to('#screen-glow', { opacity: 1, duration: .3, ease: 'power2.out' }, 0)
        .to('#code', { opacity: 1, scaleY: 1, duration: .5, ease: 'power2.out' }, .08);
    } else if (key === 'coffee') {
      gsap.set('#spill, #coffee-stream, #coffee-puddle', { display: 'block' });
      gsap.set('#coffee-stream', { strokeDashoffset: 1 });
      gsap.set('#coffee-drops', { opacity: 0, y: 0 });
      gsap.set('#coffee-puddle', { opacity: 0, scale: .08, svgOrigin: '-160 122' });
      tl.to('#tilt-v60', { rotation: -24, svgOrigin: '0 0', duration: .32, ease: 'power2.inOut' }, 0)
        .to('#coffee-stream', { strokeDashoffset: 0, autoRound: false, duration: .38, ease: 'power1.in' }, .14)
        .to('#coffee-drops', { opacity: 1, duration: .12 }, .2)
        .to('#coffee-drops', { y: 82, duration: .4, ease: 'power1.in' }, .2)
        .to('#coffee-drops', { opacity: 0, duration: .15 }, .56)
        .to('#coffee-puddle', { opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, .25)
        .to('#tilt-v60', { rotation: -12, duration: .3, ease: 'power2.out' }, .4);
    } else if (key === 'trade') {
      gsap.set('#candles, #vol', { scaleY: .05, transformOrigin: '50% 100%' });
      tl.to('#anim-phone', { y: -12, duration: .24, ease: 'power2.out' }, 0)
        .to('#anim-phone', { y: 0, duration: .3, ease: 'power2.inOut' }, .3)
        .to('#candles, #vol', { scaleY: 1, duration: .52, ease: 'power3.out' }, .06);
    } else if (key === 'about') {
      gsap.set('#photo', { opacity: 0, scale: 1.12, transformOrigin: '50% 40%' });
      tl.to('#anim-polaroid', { rotation: -5, y: -14, transformOrigin: '50% 50%', duration: .28, ease: 'power2.out' }, 0)
        .to('#photo', { opacity: 1, scale: 1, duration: .56, ease: 'power2.out' }, .08)
        .to('#anim-polaroid', { rotation: 0, y: 0, duration: .34, ease: 'power2.inOut' }, .34);
    } else if (key === 'contact') {
      gsap.set('#letter', { display: 'block', y: 150, opacity: 0 });
      tl.to('#flap', { scaleY: -1, svgOrigin: '150 0', duration: .4, ease: 'power2.inOut' }, 0)
        .to('#letter', { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, .26);
    }
  }

  return { timelineFor, reset, resetAll, settle };
}
