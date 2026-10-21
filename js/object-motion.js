// Animate nested SVG groups; the outer obj-* transforms belong to layout.
const PARTS = {
  work: ['#anim-laptop', '#screen-glow', '#code'],
  coffee: ['#anim-v60', '#tilt-v60', '#v60-top', '#v60-side', '#v60-body', '#v60-body-shade', '#v60-empty', '#z-v60', '#bloom',
    '#spill', '#coffee-stream', '#coffee-drops', '#coffee-puddle'],
  trade: ['#anim-phone', '#candles', '#vol'],
  about: ['#anim-polaroid', '#photo'],
  contact: ['#anim-envelope', '#letter', '#flap'],
};

export function createObjectMotion(gsap) {
  const fall = { angle: 0, drop: 0 };
  const $ = id => document.getElementById(id);
  const n = value => value.toFixed(3);
  const point = p => `${n(p.x)} ${n(p.y)}`;

  function projectCup() {
    // Project a tipping cylinder from above. Its mouth foreshortens along the
    // fall direction while its side wall grows between the base and the rim.
    const dx = -.97, dy = Math.sqrt(1 - dx * dx), px = -dy, py = dx;
    const c = Math.cos(fall.angle), s = Math.sin(fall.angle);
    const a = 1 + (c - 1) * dx * dx, b = (c - 1) * dx * dy;
    const d = 1 + (c - 1) * dy * dy;
    const base = { x: 12 * s, y: -5 * s };
    const mouth = { x: base.x + dx * 110 * s, y: base.y + dy * 110 * s };
    $('v60-top').setAttribute('transform', `matrix(${n(a)} ${n(b)} ${n(b)} ${n(d)} ${point(mouth)})`);
    const edge = (center, radius, sign) => ({ x: center.x + px * radius * sign, y: center.y + py * radius * sign });
    const top1 = edge(mouth, 104, -1), top2 = edge(mouth, 104, 1);
    const bottom1 = edge(base, 76, -1), bottom2 = edge(base, 76, 1);
    const cap = { x: base.x - dx * 28 * s, y: base.y - dy * 28 * s };
    $('v60-body').setAttribute('d', `M${point(top1)}L${point(bottom1)}Q${point(cap)} ${point(bottom2)}L${point(top2)}Z`);
    $('v60-body-shade').setAttribute('d', `M${point(mouth)}L${point(base)}Q${point(cap)} ${point(bottom2)}L${point(top2)}Z`);
    // The stream starts on a fixed point of the moving lip, in desk-object
    // coordinates. Camera transforms therefore never detach it from the cup.
    const lip = { x: mouth.x - 90 * a + 52 * b, y: mouth.y - 90 * b + 52 * d };
    $('coffee-stream').setAttribute('d', `M${point(lip)}C${n(lip.x - 14)} ${n(lip.y + 24)} -132 94 -142 108`);
    const t = fall.drop;
    const drop = { x: lip.x + (-142 - lip.x) * t, y: lip.y + (108 - lip.y) * t };
    $('coffee-drops').setAttribute('transform', `translate(${point(drop)})`);
  }

  const parts = Object.fromEntries(Object.entries(PARTS).map(([key, selectors]) => [key,
    selectors.map(selector => {
      const el = document.querySelector(selector);
      return { el, attributes: ['style', 'transform', 'd'].map(name => [name, el.getAttribute(name)]) };
    }),
  ]));

  function reset(key) {
    if (key === 'coffee') {
      gsap.killTweensOf(fall);
      fall.angle = fall.drop = 0;
    }
    const items = parts[key];
    gsap.killTweensOf(items.map(item => item.el));
    gsap.set(items.map(item => item.el), { clearProps: 'all' });
    for (const { el, attributes } of items) {
      for (const [name, value] of attributes) {
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
      gsap.set('#coffee-puddle', { opacity: 1, scale: 1, svgOrigin: '-142 108' });
      gsap.set('#coffee-stream', { strokeDashoffset: 0 });
      gsap.set('#coffee-drops', { opacity: 0 });
      gsap.set('#v60-side, #v60-empty', { opacity: 1 });
      gsap.set('#z-v60, #bloom', { opacity: .06 });
      fall.angle = 1.3;
      projectCup();
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
      gsap.set('#v60-side', { opacity: 1 });
      gsap.set('#coffee-stream', { strokeDashoffset: 1 });
      gsap.set('#coffee-drops', { opacity: 0 });
      gsap.set('#coffee-puddle', { opacity: 0, scale: .02, svgOrigin: '-142 108' });
      projectCup();
      const turn = (angle, duration, ease) => ({ angle, duration, ease, onUpdate: projectCup });
      tl.to(fall, turn(-.08, .12, 'power1.out'), 0)
        .to(fall, turn(1.4, .36, 'power2.in'), .12)
        .to(fall, turn(1.22, .12, 'power2.out'), .48)
        .to(fall, turn(1.3, .12, 'power1.inOut'), .6)
        .to('#coffee-stream', { strokeDashoffset: 0, autoRound: false, duration: .3, ease: 'power1.in' }, .42)
        .to('#v60-empty', { opacity: 1, duration: .25 }, .43)
        .to('#z-v60, #bloom', { opacity: .06, duration: .45, ease: 'power1.in' }, .43)
        .to('#coffee-drops', { opacity: 1, duration: .1 }, .5)
        .to(fall, { drop: 1, duration: .4, ease: 'power1.in', onUpdate: projectCup }, .5)
        .to('#coffee-drops', { opacity: 0, duration: .12 }, .82)
        .to('#coffee-puddle', { opacity: 1, scale: 1, duration: .55, ease: 'power2.out' }, .58);
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
