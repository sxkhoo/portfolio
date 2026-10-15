// Theme: default light for readability, remember user choice
const root = document.documentElement;
const saved = localStorage.getItem('ksx-theme');
if (saved) root.setAttribute('data-theme', saved);
else root.setAttribute('data-theme', 'light');

document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('ksx-theme', next);
});

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

// Scroll reveal — simple + fast, no library
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
// Safety: if observer misses hero (e.g. file preview), reveal above-the-fold anyway
setTimeout(() => {
  document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in'));
}, 800);
// Respect reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

// Glide — horizontal world-hopping, one section per screen
const track = document.getElementById('track');
const navA = [...document.querySelectorAll('.links a')];
const journeyA = [...document.querySelectorAll('.journey a')];
const panels = [...track.children].filter(el => el.tagName === 'SECTION');
const idToIdx = Object.fromEntries(panels.map((p, i) => [p.id, i]));
let idx = 0;
function journeySync() {
  journeyA.forEach(a => a.classList.toggle('active', idToIdx[a.getAttribute('href').slice(1)] === idx));
  navA.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    a.classList.toggle('active', (id === 'top' ? 0 : idToIdx[id]) === idx);
  });
}
function paintOffsets() {
  panels.forEach((p, j) => {
    p.style.setProperty('--off', j - idx);
    p.style.setProperty('--offAbs', Math.min(Math.abs(j - idx), 2));
  });
}
function goTo(i, push = true) {
  idx = (i + panels.length) % panels.length;
  track.style.transform = `translateX(${-idx * 100}vw)`;
  paintOffsets();
  journeySync();
  if (push) history.replaceState(null, '', '#' + panels[idx].id);
  // re-trigger panel entrance + resize canvas to visible panel
  dispatchEvent(new Event('resize'));
}
paintOffsets();
document.getElementById('prevBtn').addEventListener('click', () => goTo(idx - 1));
document.getElementById('nextBtn').addEventListener('click', () => goTo(idx + 1));
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goTo(idx + 1);
  else if (e.key === 'ArrowLeft') goTo(idx - 1);
});
// drag to glide — grab and throw, snaps to nearest world
let dragX = null, dragDx = 0, suppressClick = false;
track.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  dragX = e.clientX; dragDx = 0;
  track.classList.add('dragging');
}, { passive: true });
addEventListener('pointermove', e => {
  if (dragX === null) return;
  dragDx = e.clientX - dragX;
  if (Math.abs(dragDx) > 8) suppressClick = true;
  track.style.transform = `translateX(${-idx * innerWidth + dragDx}px)`;
}, { passive: true });
function endDrag() {
  if (dragX === null) return;
  dragX = null;
  track.classList.remove('dragging');
  if (dragDx < -90) goTo(idx + 1);
  else if (dragDx > 90) goTo(idx - 1);
  else goTo(idx);
  setTimeout(() => { suppressClick = false; }, 50);
}
addEventListener('pointerup', endDrag, { passive: true });
addEventListener('pointercancel', endDrag, { passive: true });
track.addEventListener('click', e => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
// all in-page anchors glide instead of scrolling
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = id === 'top' ? 0 : idToIdx[id];
    if (target !== undefined) { e.preventDefault(); goTo(target); mobileMenu.classList.remove('open'); }
  });
});
// start on hashed section if present + follow back/forward + external deep links
function fromHash(push) {
  if (location.hash && idToIdx[location.hash.slice(1)] !== undefined) goTo(idToIdx[location.hash.slice(1)], push);
}
fromHash(false);
addEventListener('hashchange', () => fromHash(false));

// ── YOUR COFFEES: add one line per coffee ──
// method: keep short (V60, AeroPress, French Press, Kalita, Chemex, Espresso…)
const COFFEES = [
  { name: "Terraform ALO AW33", origin: "Lot AW33", method: "V60", notes: "First brew in the log.", rating: 0 },
];

// Brew log render + method filter
(() => {
  const grid = document.getElementById('brewGrid');
  const bar = document.getElementById('brewFilters');
  if (!grid || !bar) return;
  const methods = ['All', ...new Set(COFFEES.map(c => c.method))];
  let active = 'All';
  if (methods.length <= 2) bar.style.display = 'none';
  bar.innerHTML = methods.map(m => `<button class="filter${m === 'All' ? ' active' : ''}" data-m="${m}" role="tab">${m}</button>`).join('');
  function card(c) {
    const stars = c.rating
      ? `<div class="brew-rating" aria-label="${c.rating} out of 5">${'●'.repeat(c.rating)}${'○'.repeat(5 - c.rating)}</div>`
      : `<div class="brew-rating muted">Not rated yet</div>`;
    return `<article class="brew-card"><span class="brew-method">${c.method}</span><h4>${c.name}</h4><p class="brew-origin">${c.origin}</p><p class="brew-notes">${c.notes}</p>${stars}</article>`;
  }
  function render() {
    grid.innerHTML = (active === 'All' ? COFFEES : COFFEES.filter(c => c.method === active)).map(card).join('')
      || `<p class="muted small">No coffees with this method yet.</p>`;
  }
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    active = b.dataset.m;
    bar.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x === b));
    render();
  });
  render();
})();

// Coffee splash — droplets, rising bubbles and steam over the roast world
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('brew');
  const section = document.getElementById('coffee');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, drops = [], bubbles = [], steam = [];
  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      ? { c: '214,158,96' } : { c: '150,102,52' };
  }
  function size() {
    const r = section.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drops = Array.from({ length: 16 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      v: 0.6 + Math.random() * 1.4, r: 1 + Math.random() * 2.2, wob: Math.random() * 7
    }));
    bubbles = Array.from({ length: 12 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      v: 0.2 + Math.random() * 0.5, r: 1 + Math.random() * 2.5, wob: Math.random() * 7
    }));
    steam = Array.from({ length: 5 }, () => ({
      x: Math.random() * w, y: h * (0.3 + Math.random() * 0.6),
      v: 0.25 + Math.random() * 0.3, ph: Math.random() * 7, len: 60 + Math.random() * 60
    }));
  }
  size();
  addEventListener('resize', size);
  let t = 0;
  (function draw() {
    t += 0.02;
    const c = theme();
    ctx.clearRect(0, 0, w, h);
    for (const s of steam) { // heat wisps
      s.y -= s.v;
      if (s.y < -s.len) { s.y = h + 20; s.x = Math.random() * w; }
      ctx.strokeStyle = `rgba(${c.c},0.10)`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let y = 0; y < s.len; y += 6) {
        const x = s.x + Math.sin(t * 2 + s.ph + y * 0.05) * 9;
        y ? ctx.lineTo(x, s.y - y) : ctx.moveTo(x, s.y - y);
      }
      ctx.stroke();
    }
    for (const b of bubbles) { // rising crema bubbles
      b.y -= b.v; b.x += Math.sin(t + b.wob) * 0.2;
      if (b.y < -8) { b.y = h + 8; b.x = Math.random() * w; }
      ctx.strokeStyle = `rgba(${c.c},0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke();
    }
    for (const d of drops) { // falling droplets with splash stretch
      d.y += d.v; d.x += Math.sin(t * 2 + d.wob) * 0.3;
      if (d.y > h + 8) { d.y = -8; d.x = Math.random() * w; }
      ctx.fillStyle = `rgba(${c.c},0.4)`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r * 0.7, d.r * (1 + d.v * 0.35), 0, 0, 7);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
})();

// Ticker tape — faint scrolling candlesticks behind the trade world
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('ticks');
  const section = document.getElementById('trade');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, candles = [], price = 0.5;
  const CW = 14;
  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      ? { up: '46,200,130', dn: '255,110,110' } : { up: '14,122,79', dn: '200,60,60' };
  }
  function size() {
    const r = section.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.ceil(w / CW) + 2;
    candles = Array.from({ length: n }, () => {
      price += (Math.random() - 0.5) * 0.08;
      price = Math.min(0.85, Math.max(0.15, price));
      const o = price, c = price + (Math.random() - 0.5) * 0.09;
      return { o, c, hi: Math.max(o, c) + Math.random() * 0.05, lo: Math.min(o, c) - Math.random() * 0.05 };
    });
  }
  size();
  addEventListener('resize', size);
  let frame = 0;
  (function draw() {
    frame++;
    if (frame % 22 === 0) { // drift one candle
      price += (Math.random() - 0.5) * 0.08;
      price = Math.min(0.85, Math.max(0.15, price));
      const o = candles.length ? candles[candles.length - 1].c : price;
      const c = price + (Math.random() - 0.5) * 0.09;
      candles.push({ o, c, hi: Math.max(o, c) + Math.random() * 0.05, lo: Math.min(o, c) - Math.random() * 0.05 });
      if (candles.length > w / CW + 3) candles.shift();
    }
    const t = theme();
    ctx.clearRect(0, 0, w, h);
    candles.forEach((k, i) => {
      const x = i * CW + CW / 2;
      const y = v => h * 0.12 + v * h * 0.76;
      const up = k.c >= k.o;
      ctx.strokeStyle = up ? `rgba(${t.up},0.35)` : `rgba(${t.dn},0.35)`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y(k.hi)); ctx.lineTo(x, y(k.lo)); ctx.stroke();
      const top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c));
      ctx.fillRect(x - 3, top, 6, Math.max(bot - top, 2));
    });
    requestAnimationFrame(draw);
  })();
})();

// Work cursor FX — particles that follow each tab's theme
let fxMode = 'venture';
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('workfx');
  const section = document.getElementById('work');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, ps = [];
  const mouse = { x: -9999, y: -9999 };
  const COLORS = {
    venture: ['37,71,244'], wizard: ['124,58,237', '217,70,239'],
    starfish: ['6,182,212', '45,212,191'], studyjio: ['150,102,52']
  };
  const COLORS_D = {
    venture: ['122,144,255'], wizard: ['167,139,250', '240,171,252'],
    starfish: ['34,211,238', '94,234,212'], studyjio: ['220,160,80']
  };
  function cols() {
    const set = document.documentElement.getAttribute('data-theme') === 'dark' ? COLORS_D : COLORS;
    return set[fxMode] || set.venture;
  }
  function size() {
    const r = section.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ps = Array.from({ length: 30 }, () => spawn(true));
  }
  function spawn(anywhere) {
    return {
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10,
      vx: (Math.random() - 0.5) * 0.3, vy: 0,
      r: 1 + Math.random() * 2.4, ph: Math.random() * 7,
      ci: Math.floor(Math.random() * 2)
    };
  }
  size();
  addEventListener('resize', size);
  section.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });
  section.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  let t = 0;
  (function draw() {
    t += 0.02;
    const C = cols();
    const col = i => C[i % C.length];
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const md = Math.hypot(dx, dy);
      const hot = md < 150 ? 1 - md / 150 : 0;
      if (fxMode === 'venture') { // drifting nodes, cursor links
        p.x += p.vx; p.y += (Math.random() - 0.5) * 0.2;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        if (md < 150 && md > 0.1) { p.x += (dx / md) * 0.4; p.y += (dy / md) * 0.4; }
        ctx.fillStyle = `rgba(${col(p.ci)},${0.3 + hot * 0.5})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + hot, 0, 7); ctx.fill();
        if (hot > 0) {
          ctx.strokeStyle = `rgba(${col(p.ci)},${hot * 0.5})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      } else if (fxMode === 'wizard') { // rising sparks, scatter from cursor
        p.y -= 0.3 + (p.r * 0.12);
        p.x += Math.sin(t * 2 + p.ph) * 0.3;
        if (md < 130 && md > 0.1) { p.x += (dx / md) * 0.9; p.y += (dy / md) * 0.9; }
        if (p.y < -10) Object.assign(p, spawn(false));
        const tw = 0.25 + 0.45 * Math.abs(Math.sin(t * 2 + p.ph)) + hot * 0.3;
        ctx.fillStyle = `rgba(${col(p.ci)},${Math.min(tw, 1)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      } else if (fxMode === 'starfish') { // bubbles rise, pushed by cursor
        p.y -= 0.25 + p.r * 0.1;
        p.x += Math.sin(t + p.ph) * 0.25;
        if (md < 140 && md > 0.1) { p.x += (dx / md) * 0.7; p.y += (dy / md) * 0.7; }
        if (p.y < -10) Object.assign(p, spawn(false));
        ctx.strokeStyle = `rgba(${col(p.ci)},${0.35 + hot * 0.4})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 1, 0, 7); ctx.stroke();
      } else { // studyjio: slow dust, gathers to cursor
        p.x += p.vx * 0.4; p.y += Math.sin(t + p.ph) * 0.12;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (md < 160 && md > 0.1) { p.x -= (dx / md) * 0.35; p.y -= (dy / md) * 0.35; }
        ctx.fillStyle = `rgba(${col(p.ci)},${0.25 + hot * 0.45})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
    }
    if (fxMode === 'venture') { // node bonds
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) {
          ctx.strokeStyle = `rgba(${C[0]},${(1 - d / 110) * 0.22})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  })();
})();
const themeGlow = document.getElementById('themeGlow');
let themeTimer = null;
function setWorkTheme(key) {
  fxMode = key;
  if (!themeGlow) return;
  themeGlow.classList.remove('on');
  clearTimeout(themeTimer);
  themeTimer = setTimeout(() => {
    themeGlow.className = 'theme-glow tg-' + key;
    void themeGlow.offsetWidth;
    themeGlow.classList.add('on');
  }, 220);
}
document.querySelectorAll('.exp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.exp-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const key = btn.dataset.exp;
    document.querySelectorAll('.exp-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === key));
    setWorkTheme(key);
  });
});

// Project filter (kept for compatibility if grid exists)
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.proj').forEach(card => {
      const show = f === 'all' || card.dataset.tags.includes(f);
      card.classList.toggle('hide', !show);
    });
  });
});

// Expandable details — keeps jargon hidden until asked for
document.querySelectorAll('.more').forEach(btn => {
  if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
  btn.addEventListener('click', () => {
    const d = btn.nextElementSibling;
    const open = d.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Show less −' : btn.dataset.label;
  });
});

document.getElementById('toTop').addEventListener('click', () => goTo(0));

// Nano tech — graphene hexagons + nanoparticles reacting to cursor (hero only)
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('nano');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let w = 0, h = 0, atoms = [], hexes = [];
  const mouse = { x: -9999, y: -9999 };

  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      ? { a: '122,144,255', hx: '122,144,255' }
      : { a: '37,71,244', hx: '37,71,244' };
  }
  function size() {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const na = coarse ? 22 : 38;
    atoms = Array.from({ length: na }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: 1.2 + Math.random() * 2.2,
      ph: Math.random() * Math.PI * 2
    }));
    // graphene-style hexagon rings
    hexes = Array.from({ length: coarse ? 3 : 5 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      s: 26 + Math.random() * 42,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.002
    }));
  }
  size();
  addEventListener('resize', size);
  hero.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function hexPath(x, y, s, rot) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = rot + (i / 6) * Math.PI * 2;
      const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  let t = 0;
  (function draw() {
    t += 0.02;
    const c = theme();
    ctx.clearRect(0, 0, w, h);
    // hexagon sheets
    for (const hx of hexes) {
      hx.x += hx.vx; hx.y += hx.vy; hx.rot += hx.vr;
      if (hx.x < -80) hx.x = w + 80; if (hx.x > w + 80) hx.x = -80;
      if (hx.y < -80) hx.y = h + 80; if (hx.y > h + 80) hx.y = -80;
      hexPath(hx.x, hx.y, hx.s, hx.rot);
      ctx.strokeStyle = `rgba(${c.hx},0.20)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      hexPath(hx.x, hx.y, hx.s * 0.55, -hx.rot);
      ctx.strokeStyle = `rgba(${c.hx},0.12)`;
      ctx.stroke();
      // vertices glow
      for (let i = 0; i < 6; i++) {
        const a = hx.rot + (i / 6) * Math.PI * 2;
        ctx.fillStyle = `rgba(${c.hx},0.4)`;
        ctx.beginPath();
        ctx.arc(hx.x + Math.cos(a) * hx.s, hx.y + Math.sin(a) * hx.s, 1.6, 0, 7);
        ctx.fill();
      }
    }
    // atoms drift + shimmer
    for (const p of atoms) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      const hot = md < 160 ? 1 - md / 160 : 0;
      if (md < 160 && md > 0.1) { p.x += ((p.x - mouse.x) / md) * 0.4; p.y += ((p.y - mouse.y) / md) * 0.4; }
      const tw = 0.35 + 0.3 * Math.sin(t + p.ph) + hot * 0.4;
      // halo
      ctx.fillStyle = `rgba(${c.a},${0.10 + hot * 0.18})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 7); ctx.fill();
      // core
      ctx.fillStyle = `rgba(${c.a},${Math.min(tw, 1)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      // bond to cursor
      if (hot > 0) {
        ctx.strokeStyle = `rgba(${c.a},${hot * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    // bonds between close atoms
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i], b = atoms[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) {
          ctx.strokeStyle = `rgba(${c.a},${(1 - d / 110) * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  })();
})();
