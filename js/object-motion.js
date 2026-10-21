// Animate nested SVG groups; the outer obj-* transforms belong to layout.
const PARTS = {
  work: ['#anim-laptop', '#screen-glow', '#code'],
  coffee: ['#anim-v60', '#tilt-v60', '#v60-handle', '#v60-top', '#v60-side', '#v60-body', '#v60-empty', '#z-v60', '#bloom',
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
    // Only the smaller cup tips; its saucer is a separate, stationary sibling.
    // Curved walls and a round heel connect the projected rim to the cup base.
    const dx = -.97, dy = Math.sqrt(1 - dx * dx), px = -dy, py = dx;
    const c = Math.cos(fall.angle), s = Math.sin(fall.angle);
    const a = 1 + (c - 1) * dx * dx, b = (c - 1) * dx * dy;
    const d = 1 + (c - 1) * dy * dy;
    const base = { x: dx * 24 * s, y: dy * 24 * s };
    const mouth = { x: base.x + dx * 88 * s, y: base.y + dy * 88 * s };
    $('v60-top').setAttribute('transform', `matrix(${n(a)} ${n(b)} ${n(b)} ${n(d)} ${point(mouth)})`);
    const edge = (center, radius, sign) => ({ x: center.x + px * radius * sign, y: center.y + py * radius * sign });
    const top1 = edge(mouth, 68, -1), top2 = edge(mouth, 68, 1);
    const bottom1 = edge(base, 43, -1), bottom2 = edge(base, 43, 1);
    const offset = (p, axis, side = 0) => ({ x: p.x + dx * axis + px * side, y: p.y + dy * axis + py * side });
    $('v60-body').setAttribute('d', `M${point(top1)}C${point(offset(top1, -38 * s, -8 * s))} ${point(offset(bottom1, 16 * s))} ${point(bottom1)}C${point(offset(bottom1, -26 * s))} ${point(offset(bottom2, -26 * s))} ${point(bottom2)}C${point(offset(bottom2, 16 * s))} ${point(offset(top2, -38 * s, 8 * s))} ${point(top2)}Z`);
    // A curved ceramic loop stays visible above the round wall as it rolls.
    const blend = (p, q) => ({ x: p.x + (q.x - p.x) * Math.max(0, s), y: p.y + (q.y - p.y) * Math.max(0, s) });
    const between = t => ({ x: top2.x + (bottom2.x - top2.x) * t, y: top2.y + (bottom2.y - top2.y) * t });
    const h1 = between(.35), h2 = between(.75);
    $('v60-handle').setAttribute('d', `M${point(blend({ x: 60, y: -22 }, h1))}C${point(blend({ x: 108, y: -34 }, offset(h1, 0, 35)))} ${point(blend({ x: 108, y: 34 }, offset(h2, 0, 35)))} ${point(blend({ x: 60, y: 22 }, h2))}`);
    // The stream starts on a fixed point of the moving lip, in desk-object
    // coordinates. Camera transforms therefore never detach it from the cup.
    const lip = { x: mouth.x - 58 * a + 35 * b, y: mouth.y - 58 * b + 35 * d };
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
