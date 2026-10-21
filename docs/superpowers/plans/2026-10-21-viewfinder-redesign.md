# Viewfinder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current horizontal-"worlds" portfolio with the Viewfinder site. It has three parts:
- a camera-HUD opening;
- a drawn desk whose detected objects are the menu;
- camera zooms into sections that sit on the surface of their object.

**Architecture:**
- Static site: `index.html`, two stylesheets and native ES modules, with no build step.
- Every word of content is real HTML. Without JS the page reads as a plain dark document.
- "Camera mode" is progressive enhancement, switched on by the `js` class on `<html>`.
- Pure modules (camera maths, layouts, state reducer, router, storage) are unit-tested with `node:test`.
- DOM modules are wired by one controller, `js/main.js`, and covered by Playwright end-to-end tests.
- All animation goes through one `Motion` interface with two drivers:
  - GSAP: camera moves.
  - Static: fades only. Used when reduced motion is on or GSAP fails to load.

**Tech Stack:**
- HTML, CSS, vanilla JS (ES modules).
- GSAP 3.12.5 core (cdnjs + SRI).
- Google Fonts: Inter Tight, JetBrains Mono, Caveat.
- Node 22 `node:test`.
- Playwright (Chromium + WebKit).
- sharp (image tooling only).
- Python 3 `http.server` (local server).
- Vercel.

**Spec:** `docs/superpowers/specs/2026-10-21-viewfinder-redesign-design.md`. Read it before any task.

**Reference implementation (throwaway, local only):** `.superpowers/brainstorm/75423-1792567087/content/viewfinder-flow.html`. Its `runIntro`, `focus`, `back`, `camFor`, `scanReveal`, `scramble` and the scene SVG are proven starting points to port. Do not copy its structure: one IIFE, `innerHTML` templates and the `__vf` debug handle.

## Global Constraints

**Repo and tooling**
- Branch `feat/viewfinder`. Never push, open a PR or merge without asking Shi Xian first.
- No build step. Site files are served as-is from the repo root.
- Test tooling lives only under `tests/`, with its own `package.json`, and is kept out of deploys by `.vercelignore`.
- Every commit message ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Code style matches the existing code: 2-space indent, semicolons, single quotes, short lower-case comments.
- Run unit tests from `tests/`: `npm run test:unit`. Run e2e from `tests/`: `npx playwright test <file>`.

**External resources**
- GSAP tag: `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" integrity="sha512-7eHRwcbYkK4d9g/6tD/mhkf++eoTHwpNM9woBxtPUBWm67zeAfFC+HrdoE2GanKeocly/VxeLvIqwvCdk7qScg==" crossorigin="anonymous" referrerpolicy="no-referrer" defer></script>`. Core only, no plugins.
- Fonts come from Google Fonts with `display=swap`: Caveat 500/700, Inter Tight 500/600/700/800, JetBrains Mono 400/500/600/700.
- Browsers: current Chrome, Edge, Firefox and Safari, including iOS Safari 16.4+.

**Budgets**
- HTML + CSS + JS + inline SVG ≤ 250 KB transferred, excluding the photo.
- `img/pfp-2560.webp` ≤ 250 KB.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
- No animation frame over 50 ms during zooms.

**Links and copy**
- Live URL `https://portfolio-sage-pi-63.vercel.app/`
- GitHub `https://github.com/sxkhoo`
- Email `khooshixian@gmail.com`
- LinkedIn `https://linkedin.com/in/khoo-shi-xian`
- Phone `+65 8885 3806`
- Copy is verbatim from `git show ab6b1f5:index.html` unless the spec gives new text.

**Colours:** HUD `#F2EFE8`, lock `#C8FF3E`, REC `#FF453A`, work `#6A8DFF`, coffee `#F4A940`, trade `#34D399`, about `#FF7A9A`, contact `#B79BFF` (seal `#5B3FC4`, ink `#1E2B4F`), decor `#A3A9B1`. They are defined once, as CSS custom properties. JS never holds colours.

**Behaviour rules**
- Storage key `ksx-viewfinder-intro-v1` with value `'1'`. All storage access is in try/catch, and any failure means the intro plays.
- Routes: `/` is the desk. Sections are `#work #coffee #trade #about #contact`. `#home`, `#top` and unknown hashes go to the desk.
- Static mode (reduced motion or no GSAP): no intro, no camera transform ever, and section fades ≤ 200 ms.
- Debug hook: the query param `?vfspeed=N` (N > 0) sets `gsap.globalTimeline.timeScale(N)`. It's the only test hook allowed in site code.
- `<html>` reflects state in these attributes, which tests and CSS rely on:
  - `data-state`: `intro|desk|opening|section|closing|hopping`
  - `data-section`: section key or absent
  - `data-layout`: `landscape|portrait`
  - `data-intro`: `played|skipped`
  - class `js`
  - class `vf-static`

## Review Focus

These are the five inputs the spec implies but doesn't spell out. Each gets a test in the task that owns the code:

1. **A tap or click during the intro that lands on a box** must only skip the intro, never open a section. Test in Task 10.
2. **Storage that throws** (private mode, blocked cookies) must not cause errors. The intro just plays every visit. Tests in Tasks 4 and 10.
3. **Resizing or rotating during the intro** must still land on a correctly laid-out desk with boxes over their objects. Test in Task 10.
4. **A long section on a phone** must have its last line reachable above the section bar. Test in Task 8.
5. **Tab during a camera move or inside a section** must never land on an invisible desk box. Boxes are `inert` whenever the state isn't `desk`. Test in Task 8.

## File Map

| File | Responsibility | Task |
|---|---|---|
| `js/camera.js` | Pure camera maths: SVG scale, fit, rest, lerp, to-transform | 2 |
| `js/layout.js` | Landscape/portrait desk geometry + `pickLayout` | 2, 6 |
| `js/config.js` | Section registry, decor, order, storage key | 3 |
| `js/state.js` | Pure navigation reducer | 3 |
| `js/router.js` | Hash ↔ section key | 4 |
| `js/storage.js` | Intro-seen flag with failure handling | 4 |
| `index.html` | All content + scene SVG + HUD markup | 5–8, 10 |
| `css/site.css` | Tokens, type, document (no-JS) layout, content components | 5 |
| `css/viewfinder.css` | Everything under `html.js`: scene, HUD, boxes, overlays, bar | 6–10 |
| `js/data/coffees.js` | `COFFEES`: one line per bag | 5 |
| `js/brewlog.js` | Renders the brew log with `textContent` only | 5 |
| `js/early.js` | Adds `html.js`; failsafe removes it after 6 s if `main.js` never boots | 6 |
| `js/scene.js` | Decorate, apply layout, measure, photo source | 6 |
| `js/fx.js` | `scramble()` text effect | 7 |
| `js/boxes.js` | Detection-box buttons | 7 |
| `js/hud.js` | Timecode, zoom readout, count, hint, cursor reticle | 7 |
| `js/sections.js` | Show/hide overlays, chips, focus | 8 |
| `js/motion.js` | `createMotion` factory + static driver | 8 |
| `js/motion-gsap.js` | GSAP driver: moves, reveal, intro | 9, 10 |
| `js/main.js` | Controller: boot, state, routing, input, resize | 5–10 |
| `img/pfp-1280.webp`, `img/pfp-2560.webp`, `img/og.png`, `favicon.svg` | Assets | 6, 11 |
| `vercel.json`, `.vercelignore`, `.gitignore` | Deploy + hygiene | 1, 11 |
| `tests/**` | Unit, e2e, fixtures, asset scripts | all |
| `README.md`, `ARCHITECTURE.md` | Docs | 12 |
| `styles.css`, `script.js` | Deleted | 5 |

---

### Task 1: Test harness and repo hygiene

**Files:**
- Create: `tests/package.json`, `tests/playwright.config.js`, `tests/unit/sri.test.js`, `tests/e2e/smoke.spec.js`, `.vercelignore`
- Modify: `.gitignore` (it already contains `.superpowers/` from the planning commit)

**Interfaces:**
- Produces:
  - `npm run test:unit` (runs `node --test unit/`) and `npx playwright test`, both run from `tests/`.
  - Playwright `baseURL` `http://127.0.0.1:4173`, served by `python3 -m http.server 4173 --bind 127.0.0.1 --directory ..`.
  - Projects `chromium` (Desktop Chrome) and `webkit` (Desktop Safari), both 1440×900.

- [ ] **Step 1: Create `tests/package.json`**
  - `"private": true`, `"type": "module"`, `"engines": {"node": ">=22.12"}`.
  - Scripts: `test:unit`, `test:e2e`, and `test` (runs both).
  - devDependencies: `"@playwright/test": "^1.48.2"`, `"gsap": "3.12.5"` (exact), `"sharp": "^0.33.5"`.
  - Then run `cd tests && npm install && npx playwright install chromium webkit`.

- [ ] **Step 2: Write `tests/unit/sri.test.js`**

```js
test('npm gsap 3.12.5 is byte-identical to the cdnjs build we pin', () => {
  const buf = readFileSync(new URL('../node_modules/gsap/dist/gsap.min.js', import.meta.url));
  const sri = 'sha512-' + createHash('sha512').update(buf).digest('base64');
  assert.equal(sri, 'sha512-7eHRwcbYkK4d9g/6tD/mhkf++eoTHwpNM9woBxtPUBWm67zeAfFC+HrdoE2GanKeocly/VxeLvIqwvCdk7qScg==');
});
```

- [ ] **Step 3: Run `npm run test:unit`.** Expected: PASS. If it fails, the npm and CDN builds differ: stop and report.

- [ ] **Step 4: Write `tests/playwright.config.js`** as described in Interfaces, and `tests/e2e/smoke.spec.js`:

```js
test('site serves', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Khoo Shi Xian/);
});
```

- [ ] **Step 5: Run `npx playwright test e2e/smoke.spec.js`.** Expected: 2 passed (chromium, webkit).

- [ ] **Step 6: Hygiene files**
  - `.vercelignore` lists `tests/`, `docs/`, `.superpowers/`, `.claude/` and `ARCHITECTURE.md`.
  - Append `tests/node_modules/`, `tests/test-results/` and `tests/playwright-report/` to `.gitignore`.

- [ ] **Step 7: Commit**
  - `git add .gitignore .vercelignore tests/package.json tests/package-lock.json tests/playwright.config.js tests/unit tests/e2e`
  - Message: `chore: add test harness (node:test + Playwright) and deploy ignores`

---

### Task 2: Camera maths and desk layouts (pure)

**Files:**
- Create: `js/camera.js`, `js/layout.js`, `tests/unit/camera.test.js`, `tests/unit/layout.test.js`

**Interfaces:**
- Produces, `js/camera.js`. `Rect = {left, top, width, height}`, `Cam = {ox, oy, rotation, scale}` (focus-point form):
  - `svgScale(viewport: {w,h}, viewBox: [x,y,w,h], mode: 'slice'|'meet') → number`: screen px per SVG unit.
  - `fitCamera({ rect: Rect, size: {w,h}, tilt: number, k: number, viewport: {w,h}, overscan = 1.015 }) → Cam`
  - `restCamera(viewport) → Cam`: `{ ox: w/2, oy: h/2, rotation: 0, scale: 1 }`
  - `lerpCamera(a: Cam, b: Cam, t: number, dip = 0) → Cam`
  - `toTransform(cam: Cam, viewport) → { x, y, rotation, scale, transformOrigin }`: GSAP `set` vars.
- Produces, `js/layout.js`:
  - `LAYOUTS = { landscape, portrait }`. Each is `{ viewBox: [0,0,W,H], mat: [x,y,w,h], objects: { [id]: { x, y, r, s = 1 } } }`.
  - Object ids: `ball phone laptop polaroid pick pencil beans v60 kettle envelope`.
  - `PORTRAIT_BELOW = 1.15`
  - `pickLayout(width, height) → 'landscape'|'portrait'`: portrait when `width / height < 1.15`.

**Camera semantics** (the one thing the tests don't make obvious):
- A `Cam` maps the rest-pose point `(ox, oy)` to the viewport centre, rotated by `rotation` degrees and scaled by `scale`.
- `toTransform` returns:
  - `transformOrigin: \`${ox}px ${oy}px\``
  - `x = w/2 - ox`
  - `y = h/2 - oy`
  - `rotation` and `scale` as given.
- `fitCamera`:
  - `ox, oy` = the centre of `rect`, the target's on-screen box measured with the camera at rest.
  - `rotation = -tilt`.
  - `scale = max(w / (size.w*k), h / (size.h*k)) * overscan`.

`lerpCamera` (t is already eased; `dip` pulls the camera back mid-move):

```js
const lerp = (p, q) => p + (q - p) * t;
const logS = lerp(Math.log(a.scale), Math.log(b.scale)) - dip * Math.sin(Math.PI * t) * Math.log(Math.max(a.scale, b.scale));
return { ox: lerp(a.ox, b.ox), oy: lerp(a.oy, b.oy), rotation: lerp(a.rotation, b.rotation), scale: Math.exp(logS) };
```

- [ ] **Step 1: Write `tests/unit/camera.test.js`** (values come from the mockup at 1440×900; the laptop screen is 452×270 at scene (574,144))

```js
test('svgScale', () => {
  assert.equal(svgScale({ w: 1440, h: 900 }, [0, 0, 1600, 1000], 'slice'), 0.9);
  assert.equal(svgScale({ w: 1920, h: 1080 }, [0, 0, 1600, 1000], 'slice'), 1.2);
  assert.equal(svgScale({ w: 390, h: 844 }, [0, 0, 1000, 1600], 'slice'), 0.5275);
  assert.equal(svgScale({ w: 390, h: 844 }, [0, 0, 1600, 1000], 'meet'), 0.24375);
});
const VP = { w: 1440, h: 900 };
test('fitCamera frames the laptop screen like the mockup', () => {
  const cam = fitCamera({ rect: { left: 516.6, top: 129.6, width: 406.8, height: 243 }, size: { w: 452, h: 270 }, tilt: 0, k: 0.9, viewport: VP });
  near(cam.ox, 720); near(cam.oy, 251.1); assert.equal(cam.rotation, 0); near(cam.scale, 3.7593, 1e-3);
  const tr = toTransform(cam, VP);
  near(tr.x, 0); near(tr.y, 198.9); assert.equal(tr.transformOrigin, '720px 251.1px');
});
test('fitCamera counter-rotates tilted targets and sizes from their own box', () => {
  const cam = fitCamera({ rect: { left: 100, top: 100, width: 300, height: 400 }, size: { w: 134, h: 294 }, tilt: -10, k: 0.9, viewport: VP });
  assert.equal(cam.rotation, 10); near(cam.scale, 12.119, 1e-3);
});
test('coffee bed zoom is ~16x', () => {
  near(fitCamera({ rect: { left: 0, top: 0, width: 90, height: 90 }, size: { w: 100, h: 100 }, tilt: 0, k: 0.9, viewport: VP }).scale, 16.24, 1e-2);
});
test('restCamera is the identity transform', () => {
  assert.deepEqual(toTransform(restCamera(VP), VP), { x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '720px 450px' });
});
test('lerpCamera endpoints, geometric midpoint, and dip', () => {
  const a = { ox: 720, oy: 251.1, rotation: 0, scale: 3.7593 }, b = { ox: 1125, oy: 241.2, rotation: 0, scale: 16.24 };
  deepNear(lerpCamera(a, b, 0), a); deepNear(lerpCamera(a, b, 1), b);
  near(lerpCamera(a, b, 0.5).scale, Math.sqrt(a.scale * b.scale));
  assert.ok(lerpCamera(a, b, 0.5, 0.55).scale < a.scale);
});
test('a fitted camera covers every viewport corner', () => {
  // 200 seeded random rect/size/tilt cases. For each viewport corner p, map it back to the rest pose
  // q = o + R(-rotation)·((p - viewportCentre) / scale)
  // and assert q lies inside the target's tilted rectangle (half-extents size·k/2, ±1e-6).
});
```

`near` and `deepNear` are tiny helpers in the test file, with a default tolerance of 1e-6.

- [ ] **Step 2: Write `tests/unit/layout.test.js`**

```js
test('pickLayout', () => {
  assert.equal(pickLayout(1440, 900), 'landscape');
  assert.equal(pickLayout(1035, 900), 'landscape'); // exactly 1.15
  assert.equal(pickLayout(1024, 900), 'portrait');
  assert.equal(pickLayout(390, 844), 'portrait');
});
test('every layout places every scene object', () => {
  for (const name of ['landscape', 'portrait'])
    assert.deepEqual(Object.keys(LAYOUTS[name].objects).sort(), ['ball', 'beans', 'envelope', 'kettle', 'laptop', 'pencil', 'phone', 'pick', 'polaroid', 'v60']);
});
test('landscape matches the approved mockup', () => {
  const o = LAYOUTS.landscape.objects;
  assert.deepEqual(LAYOUTS.landscape.viewBox, [0, 0, 1600, 1000]);
  assert.deepEqual(LAYOUTS.landscape.mat, [168, 58, 914, 884]);
  assert.deepEqual([o.laptop.x, o.laptop.y, o.laptop.r], [560, 130, 0]);
  assert.deepEqual([o.phone.x, o.phone.y, o.phone.r], [250, 120, -10]);
  assert.deepEqual([o.polaroid.x, o.polaroid.y, o.polaroid.r], [205, 490, 6]);
  assert.deepEqual([o.envelope.x, o.envelope.y, o.envelope.r], [1110, 700, -5]);
  assert.deepEqual([o.v60.x, o.v60.y], [1250, 268]);
});
```

- [ ] **Step 3: Run `npm run test:unit`.** Expected: FAIL, modules not found.

- [ ] **Step 4: Implement both modules.**
  - Landscape values come from the mockup: `ball (30,300,0)`, `pick (600,820,18)`, `pencil (700,842,-6)` and `kettle (1278,566,0)`.
  - `beans` becomes one local-coordinate cluster at `(1120,300,0)`.
  - Portrait uses `viewBox [0,0,1000,1600]` with a first-guess arrangement. Task 6 tunes it with e2e.

- [ ] **Step 5: Run `npm run test:unit`.** Expected: PASS.

- [ ] **Step 6: Commit.** Message: `feat: camera maths and desk layouts`

---

### Task 3: Section registry and navigation reducer

**Files:**
- Create: `js/config.js`, `js/state.js`, `tests/unit/state.test.js`

**Interfaces:**
- Produces, `js/config.js`:
  - `ORDER = ['work','coffee','trade','about','contact']`
  - `SECTIONS = { work: { object: 'laptop', target: 'z-laptop', label: 'laptop', conf: '0.97', name: 'Work' }, … }` (labels and confidences from spec §4.2)
  - `DECOR = { ball: { object: 'ball', label: 'sports_ball', conf: '0.88', quip: 'weekends → basketball' }, pick: { object: 'pick', label: 'guitar_pick', conf: '0.41', quip: 'low conf. it plays guitar' } }`
  - `INTRO_KEY = 'ksx-viewfinder-intro-v1'`
- Produces, `js/state.js`:
  - `State = { mode, key, from, pending }`.
  - `pending` is `undefined` when nothing is queued, `null` for "desk", or a section key.
  - `initialState(mode = 'desk', key = null) → State`
  - `reduce(state, event) → State`. It returns **the same object** when an event is ignored.
  - Events:
    - `{type:'INTRO_DONE'}`
    - `{type:'OPEN', key}`
    - `{type:'ARRIVED'}`
    - `{type:'CLOSE'}`
    - `{type:'HOP', dir: 1|-1}`
    - `{type:'JUMP', key}`
    - `{type:'ROUTE', target: key|null}`
  - Transitions:
    - intro –INTRO_DONE→ desk
    - desk –OPEN k→ opening(k)
    - opening –ARRIVED→ section(k)
    - section –CLOSE→ closing(k)
    - closing –ARRIVED→ desk
    - section –HOP/JUMP→ hopping(to, from k)
    - hopping –ARRIVED→ section(to)
  - ROUTE outside a move acts like OPEN, CLOSE or JUMP as appropriate. ROUTE to the current place is ignored.
  - In `intro`, `opening`, `closing` and `hopping`, ROUTE is queued (last wins). Every other event is ignored.
  - On ARRIVED or INTRO_DONE, a queued route is applied immediately.

- [ ] **Step 1: Write `tests/unit/state.test.js`**

```js
const desk = initialState();
test('desk opens a section; spam during the move is ignored', () => {
  const s = reduce(desk, { type: 'OPEN', key: 'work' });
  assert.deepEqual([s.mode, s.key], ['opening', 'work']);
  for (const e of [{ type: 'OPEN', key: 'coffee' }, { type: 'CLOSE' }, { type: 'HOP', dir: 1 }, { type: 'JUMP', key: 'about' }])
    assert.equal(reduce(s, e), s);
  assert.deepEqual(pick(reduce(s, { type: 'ARRIVED' })), ['section', 'work']);
});
test('hop wraps in both directions', () => {
  assert.deepEqual(pick(reduce(initialState('section', 'contact'), { type: 'HOP', dir: 1 })), ['hopping', 'work']);
  assert.deepEqual(pick(reduce(initialState('section', 'work'), { type: 'HOP', dir: -1 })), ['hopping', 'contact']);
});
test('close returns to desk', () => {
  const c = reduce(initialState('section', 'trade'), { type: 'CLOSE' });
  assert.deepEqual(pick(c), ['closing', 'trade']);
  assert.deepEqual(pick(reduce(c, { type: 'ARRIVED' })), ['desk', null]);
});
test('a route during a move is queued and applied on arrival (last wins)', () => {
  let s = reduce(desk, { type: 'OPEN', key: 'work' });
  s = reduce(s, { type: 'ROUTE', target: 'coffee' });
  s = reduce(s, { type: 'ROUTE', target: null });
  assert.equal(s.pending, null);
  assert.deepEqual(pick(reduce(s, { type: 'ARRIVED' })), ['closing', 'work']);
});
test('route during intro opens after INTRO_DONE', () => {
  const s = reduce(initialState('intro'), { type: 'ROUTE', target: 'about' });
  assert.deepEqual(pick(reduce(s, { type: 'INTRO_DONE' })), ['opening', 'about']);
});
test('routes to the current place and same-key jumps are ignored', () => {
  const sec = initialState('section', 'work');
  assert.equal(reduce(sec, { type: 'ROUTE', target: 'work' }), sec);
  assert.equal(reduce(sec, { type: 'JUMP', key: 'work' }), sec);
  assert.equal(reduce(desk, { type: 'ROUTE', target: null }), desk);
});
test('routes from section map to close and hop', () => {
  assert.deepEqual(pick(reduce(initialState('section', 'work'), { type: 'ROUTE', target: null })), ['closing', 'work']);
  const h = reduce(initialState('section', 'work'), { type: 'ROUTE', target: 'about' });
  assert.deepEqual([h.mode, h.key, h.from], ['hopping', 'about', 'work']);
});
test('unknown keys are ignored', () => {
  assert.equal(reduce(desk, { type: 'OPEN', key: 'nope' }), desk);
});
```

`pick = s => [s.mode, s.key]` is a helper in the test file.

- [ ] **Step 2: Run `npm run test:unit`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement `js/config.js` and `js/state.js`.** Both must be pure: no `window` or `document`.
- [ ] **Step 4: Run `npm run test:unit`.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: section registry and navigation reducer`

---

### Task 4: Router and intro-seen storage

**Files:**
- Create: `js/router.js`, `js/storage.js`, `tests/unit/router.test.js`, `tests/unit/storage.test.js`

**Interfaces:**
- Consumes: `ORDER` and `INTRO_KEY` from Task 3.
- Produces:
  - `parseHash(hash: string) → key|null`
  - `hashFor(key|null) → '#work' | ''`
  - `getStorage(win) → Storage|null`. Accessing `win.localStorage` can itself throw.
  - `introSeen(storage) → boolean`
  - `markIntroSeen(storage) → void`. It swallows storage errors on purpose, and the comment says why: an unavailable storage means the intro plays again, which is the specified fallback.

- [ ] **Step 1: Write the tests**

```js
test('parseHash', () => {
  for (const k of ORDER) assert.equal(parseHash('#' + k), k);
  for (const h of ['', '#', '#home', '#top', '#foo', '#Work', '#work/x']) assert.equal(parseHash(h), null);
});
test('hashFor', () => { assert.equal(hashFor('trade'), '#trade'); assert.equal(hashFor(null), ''); });
test('intro flag round-trips', () => {
  const s = fakeStorage(); assert.equal(introSeen(s), false); markIntroSeen(s);
  assert.equal(s.getItem('ksx-viewfinder-intro-v1'), '1'); assert.equal(introSeen(s), true);
});
test('broken or missing storage means "not seen" and never throws', () => {
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(introSeen(boom), false); assert.doesNotThrow(() => markIntroSeen(boom));
  assert.equal(introSeen(null), false); assert.doesNotThrow(() => markIntroSeen(null));
  assert.equal(getStorage({ get localStorage() { throw new Error('denied'); } }), null);
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: hash router and intro-seen storage`

---

### Task 5: The document: real content, readable without JS

**Files:**
- Modify: `index.html` (full rewrite of `<head>` and `<body>`)
- Create: `css/site.css`, `js/data/coffees.js`, `js/brewlog.js`, `js/main.js` (it only renders the brew log for now), `tests/fixtures/parity.json`, `tests/e2e/document.spec.js`
- Delete: `script.js`, `styles.css`

**Interfaces:**
- Produces the DOM contract that later tasks rely on:
  - `<a class="skip" href="#toc">Skip to content</a>`
  - `<header class="ident">` contains:
    - `.status` "open to internships · SG / remote"
    - `h1.name` built as `<span class="w"><span>Khoo</span></span>` ×3 words
    - `.sub` "Computer Engineering @ NUS · Vision AI & ML"
    - `.links` with GitHub. The CV line is present only as an HTML comment: `<!-- <a href="cv.pdf">CV</a> -->`.
  - `<main id="sections">` contains:
    - `<nav id="toc" class="toc" tabindex="-1" aria-label="Sections">`, with links `#work`…`#contact`
    - five `<section id="KEY" class="sec" data-section="KEY" aria-labelledby="KEY-h">`
  - Each section contains `.sec-inner > p.sec-k + h2.sec-t#KEY-h[tabindex="-1"] + p.sec-l` followed by its content.
  - Content components:
    - Work: `.det-grid > article.det` ×4, each with `span.det-tag`, `p.det-meta`, `h3`, `p.det-tldr`, `ul.det-bullets`, `.pills > span`. Then `p.also`.
    - Coffee: `div#brewlog`
    - Trade: `.tcards > article.tcard` ×3, each with `span.src`, `h3`, `p.since`, `p`.
    - About: `.facts > .fact` ×4, each with `h4` + `p`/`.pills`.
    - Contact: `.cta` with `a.btn.fill` mailto, `a.btn` LinkedIn and `a.btn` GitHub; `p.meta`; `p.sig`; `footer`.
  - `renderBrewLog(root: HTMLElement, coffees: Coffee[]) → void`.
    - `Coffee = {name, origin, method, notes, rating}`; rating 0 means "not rated yet".
    - It uses only `createElement` and `textContent`.
  - Per-section accent custom property `[data-section="KEY"]{--acc: <colour>}` in `css/site.css`.
- Copy:
  - Work lede "I build machines that can see."
  - Coffee kicker "Filter coffee", heading "Brew log".
  - Trade heading "Market hours", lede "Student account, learning first."
  - About lede "Malaysian in Singapore. Basketball on weekends, ML papers on weeknights."
  - About also carries the line "🇲🇾 → 🇸🇬 · NUS · Tsinghua exchange".
  - Contact heading "Let's build something<br>that sees.", meta "+65 8885 3806 · Singapore · replies within a day", signature "— Shi Xian", footer "© 2026 Khoo Shi Xian · Short, on purpose."
  - Detection tags: `venture_corp 0.98`, `wizard_battle 0.95`, `starfish 0.93`, `studyjio 0.90`.
- `<head>`:
  - Keep the current `<title>` and description.
  - Add `og:title`, `og:description`, `og:type=website`, `og:url=https://portfolio-sage-pi-63.vercel.app/` and `og:image=https://portfolio-sage-pi-63.vercel.app/img/og.png`, plus `twitter:card=summary_large_image`.
  - `<link rel="icon" href="favicon.svg" type="image/svg+xml">`
  - Fonts per Global Constraints, then `css/site.css`, then `<script type="module" src="js/main.js">`.
- Document-mode look: dark background `#0b0b0c`, single column, max-width 1080 px, section accents. No camera styling yet.
- Global focus ring: `:focus-visible { outline: 2px solid #C8FF3E; outline-offset: 3px }`.

- [ ] **Step 1: Build `tests/fixtures/parity.json`.** It's a JSON array of every content string in `git show ab6b1f5:index.html` plus each coffee's name and notes.
  - Include headings, TL;DRs (as plain text without tags), bullets, pills, card text, background/education/toolbox/languages and contact meta.
  - Exclude:
    - nav and journey labels
    - "Toggle theme"
    - arrows
    - "Save your photo as pfp.jpg"
    - "↑ Start"
    - the old eyebrow
    - the old hero lede as one string. Its two spec halves go in instead: "I build machines that can see" and "Malaysian in Singapore. Basketball on weekends, ML papers on weeknights."

- [ ] **Step 2: Write `tests/e2e/document.spec.js`**

```js
test('no-JS: every section is readable', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage(); await page.goto('/');
  for (const k of ['work', 'coffee', 'trade', 'about', 'contact']) await expect(page.locator(`#${k}-h`)).toBeVisible();
  await expect(page.locator('h1.name')).toHaveText('Khoo Shi Xian'); await ctx.close();
});
test('content parity with ab6b1f5', async ({ page }) => {
  await page.goto('/'); const text = (await page.locator('body').textContent()).replace(/\s+/g, ' ');
  for (const s of parity) expect(text, s).toContain(s);
});
test('brew log renders COFFEES as text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#brewlog tbody tr')).toHaveCount(2);
  await expect(page.locator('#brewlog')).toContainText('not rated yet');
  await expect(page.locator('#brewlog .filters')).toBeHidden(); // only one method
});
test('links and share meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="https://github.com/sxkhoo"]').first()).toBeVisible();
  await expect(page.locator('a[href="mailto:khooshixian@gmail.com"]')).toHaveCount(1);
  await expect(page.locator('a[href^="https://linkedin.com"]')).toHaveAttribute('rel', /noopener/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://portfolio-sage-pi-63.vercel.app/');
});
```

- [ ] **Step 3: Run `npx playwright test e2e/document.spec.js`.** Expected: FAIL (old page).
- [ ] **Step 4: Implement** the files above. Move `COFFEES` verbatim into `js/data/coffees.js`, with a header comment explaining how to add a coffee. `js/main.js` imports and calls `renderBrewLog`.
- [ ] **Step 5: Run the spec, then the full e2e suite.** Expected: PASS. Update `smoke.spec.js` if needed.
- [ ] **Step 6: Commit.**
  - Run `git rm script.js styles.css`, then add the new files.
  - Message: `feat: rebuild the page as a plain, readable document`

---

### Task 6: Desk scene and camera-mode shell

**Files:**
- Modify: `index.html`, `js/layout.js` (portrait tuning), `js/main.js`, `tests/unit/sri.test.js`
- Create: `js/early.js`, `js/scene.js`, `css/viewfinder.css`, `tests/scripts/images.mjs`, `img/pfp-1280.webp`, `img/pfp-2560.webp`, `tests/unit/scene.test.js`, `tests/e2e/scene.spec.js`

**Interfaces:**
- Consumes: `LAYOUTS`, `pickLayout`, `svgScale`, `fitCamera` and `restCamera` (Task 2); `SECTIONS` (Task 3).
- Produces, markup:
  - `<div id="cam" class="cam" aria-hidden="true"><svg id="scene">`, containing:
    - `#mat`
    - one `<g id="obj-ID" class="obj">` per layout object, drawn in **local coordinates with no transform attribute**
    - zoom targets `#z-laptop` (452×270 screen), `#z-v60` (r 50 coffee bed), `#z-phone` (134×294), `#z-polaroid` (250×156 photo area) and `#z-envelope` (300×190)
    - `#z-face` (rect 126,104,28,36 in polaroid space)
    - `<image id="photo">`
    - empty generated groups `#grain #keys #code #pins #candles #vol #bloom`
  - `<div id="boot" aria-hidden="true">` with `CAM 01 / SENSOR ▮▮▮▮▮ OK`.
    - Under `html.js` it covers the screen from first paint, so the desk never flashes before JS decides what to show.
    - `main.js` adds class `vf-ready` to `<html>` once booted, and CSS fades `#boot` out over 200 ms.
    - In Task 10 the intro drives this fade itself.
  - In `<head>`, before the stylesheets: `<script src="js/early.js"></script>` (sync). Then the GSAP tag from Global Constraints, placed before the module script.
- Produces, `js/scene.js`:
  - `decorate(svg, seed = 7) → void`: generates grain, keys, code lines, PCB pins, candles, volume, bloom and beans with a seeded PRNG (mulberry32).
  - `applyLayout(svg, layout) → void`: sets the `viewBox`, `preserveAspectRatio="xMidYMid slice"`, the `#mat` attributes, and each `#obj-ID` `transform="translate(x y) rotate(r) scale(s)"`.
  - `measure(cam, svg, layout) → Meas`. It temporarily clears `cam.style.transform` and returns `{ viewport, k, rest, objects: {ID: Rect}, targets: {sectionKey: Cam}, face: Rect }`.
    - `targets` come from `fitCamera` with `size = getBBox() × s` and `tilt = layout r`.
    - `face` is measured at the About framing.
  - `photoHref(viewportWidth, dpr) → 'img/pfp-2560.webp' | 'img/pfp-1280.webp'`: 2560 when `viewportWidth * dpr > 1600`.
- Produces, `js/early.js`: adds class `js` to `<html>`. After 6000 ms it removes the class unless `window.__vfBooted` is set.
- Produces, `js/main.js` (boot): sets `window.__vfBooted = true`, then `decorate`, `applyLayout(pickLayout(...))`, `html.dataset.layout`, photo `href`, `measure`. On resize (150 ms debounce): re-layout, re-measure and update the photo `href`.
- Produces, `css/viewfinder.css`:
  - Everything is scoped to `html.js`.
  - `html, body` fixed, `overflow: hidden`, black.
  - `#cam` fixed with `inset: 0`, `transform-origin: 0 0`.
  - Sections are hidden (`display: none`) and `.ident` sits bottom-left.
  - Scene filters: drop shadows only, no `feTurbulence`.

- [ ] **Step 1: Write tests.**
  - Unit (`tests/unit/scene.test.js`), importing only the pure `photoHref`. `scene.js` must not touch the DOM at import time.
    - `photoHref(1440, 2) === 'img/pfp-2560.webp'`
    - `photoHref(1024, 1) === 'img/pfp-1280.webp'`
    - `statSync('img/pfp-2560.webp').size <= 250_000`
  - Unit, appended to `tests/unit/sri.test.js`: `index.html` contains the exact GSAP `integrity` string.
  - E2E `tests/e2e/scene.spec.js`:

```js
// helpers.js exports VIEWPORTS = [[1024, 768], [1440, 900], [1920, 1080], [2560, 1080], [390, 844]]
// and re-exports ORDER and SECTIONS from ../../js/config.js
for (const [w, h] of VIEWPORTS) test(`all five section objects fit at ${w}x${h}`, async ({ page }) => {
  await page.setViewportSize({ width: w, height: h }); await page.goto('/?vfspeed=50');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  await expect(page.locator('html')).toHaveAttribute('data-layout', w / h < 1.15 ? 'portrait' : 'landscape');
  const ident = await page.locator('.ident').boundingBox();
  for (const id of ['laptop', 'v60', 'phone', 'polaroid', 'envelope']) {
    const r = await page.locator(`#obj-${id}`).boundingBox();
    expect(inside(r, { x: 0, y: 0, width: w, height: h }), id).toBe(true);
    expect(overlaps(r, ident), `${id} vs name`).toBe(false);
  }
});
test('failsafe: if main.js never boots, the document comes back', async ({ page }) => {
  await page.route('**/js/main.js', r => r.abort()); await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/\bjs\b/, { timeout: 8000 });
  await expect(page.locator('#work-h')).toBeVisible();
});
test('photo uses the responsive webp', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#photo')).toHaveAttribute('href', /img\/pfp-(1280|2560)\.webp$/);
});
```

  `inside` and `overlaps` are rect helpers in `tests/e2e/helpers.js`.

  All e2e specs from here on use `gotoVF(page, opts)` from `tests/e2e/helpers.js`. It:
  - blocks Google Fonts
  - optionally pre-sets the intro flag (`introSeen: true`) via `addInitScript`
  - optionally blocks GSAP or the photo
  - emulates `reducedMotion`
  - navigates to `/?vfspeed=${speed}${hash}`

  Add it in this task.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Write `tests/scripts/images.mjs`.** It uses sharp to turn `pfp.jpg` into widths 1280 and 2560 at WebP quality 78. Run `node tests/scripts/images.mjs` from the repo root and commit the outputs.
- [ ] **Step 4: Implement.**
  - Port the scene SVG from the mockup into local coordinates.
  - Write `early.js`, `scene.js` and the base `viewfinder.css`, and add boot to `main.js`.
  - Tune `LAYOUTS.portrait` until the 390×844 case passes:
    - Objects may use `s < 1`.
    - Keep the bottom ~25% clear for `.ident`.
- [ ] **Step 5: Run unit + e2e.** Expected: PASS on chromium and webkit.
- [ ] **Step 6: Commit.** Message: `feat: drawn desk scene, layouts and camera-mode shell`

---

### Task 7: Detection boxes and HUD

**Files:**
- Modify: `index.html` (add `<nav id="boxes" aria-label="Desk">`, `#scan`, and the `.hud` markup), `css/viewfinder.css`, `js/main.js`
- Create: `js/fx.js`, `js/boxes.js`, `js/hud.js`, `tests/e2e/boxes.spec.js`

**Interfaces:**
- Consumes: `Meas.objects` (Task 6); `ORDER`, `SECTIONS` and `DECOR` (Task 3).
- Produces:
  - `scramble(el, text, frames = 16) → void`. It resolves random glyphs `a–z0–9_` into `text` over `frames` animation frames, and cancels any previous run on the same element.
  - `createBoxes(root, { onOpen: key => void }) → Boxes`:
    - `place(objects: {ID: Rect}, viewport)`: pad 8 px, clamp 6 px inside the viewport, minimum 44×44 px.
    - `setVisible(on: boolean)`
    - `elements() → [{ key, el, top }]`, used by the reveal animation.
    - `lock(key|null)`: lime lock style.
    - `track(key, rect)`
    - `focus(key)`
    - `setInert(on: boolean)`
  - Section boxes are `<button class="box obj" data-key aria-label="Open Work (laptop)">`, with children `.fr`, `.tag` ("laptop 0.97") and `.go` ("→ WORK").
  - Decor boxes are `<div class="box decor" aria-hidden="true">`. Hovering one scrambles its tag to the quip; leaving scrambles it back.
  - `createHud(root) → Hud`:
    - `start()`: timecode `HH:MM:SS:FF` at 24 fps, driven by rAF.
    - `setZoom(scale)`: sets `#zoomx` (and `#zoomx2` if present) to `scale.toFixed(1) + '×'`, and the marker `left` to `78 - min(log(max(s,1))/log(18), 1) * 64` %.
    - `setCount(n)`
    - `setHint(text)`
    - `cursor(on)`: the desk reticle, only when `(pointer: fine)`.
  - HUD markup (`aria-hidden`):
    - corners
    - `REC` + `#tc` + `CAM 01`
    - `DETECT · yolo-ksx-v11n · <span id="objcount">0</span> obj`
    - `ISO 400 ƒ/1.8 1/125 AWB` + battery
    - `.fscale` with `.mk`, and `#zoomx`
    - `#hint`
    - `.crosshair`
    - top and bottom scrims
  - CSS:
    - Box styling per spec §4.2.
    - `#boxes:has(.box:hover, .box:focus-visible) .box:not(:hover, :focus-visible) > * { opacity: .28 }`. Keyboard focus gets the same glow as hover.
    - `.box.lock` uses `--lock` with `!important`, because the per-box colour is inline.
    - Below 700 px: hide `.hud-tc`, `.hud-tr`, `.hud-bc` and `.box .go`.
  - `main.js` (interim, replaced in Task 8): after measuring, `place()` the boxes and `setVisible(true)`, set `hud.setCount(7)`, set the hint "click an object to focus · 1–5", and `hud.start()`.

- [ ] **Step 1: Write `tests/e2e/boxes.spec.js`**

```js
test('five labelled section buttons in order, Work first', async ({ page }) => {
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  const names = await page.locator('#boxes button.obj').evaluateAll(b => b.map(x => x.getAttribute('aria-label')));
  expect(names).toEqual(['Open Work (laptop)', 'Open Coffee (v60_dripper)', 'Open Trade (cell_phone)', 'Open About (polaroid)', 'Open Contact (envelope)']);
  await expect(page.locator('.box[data-key="work"] .tag')).toHaveText('laptop 0.97');
});
test('each box contains its object', async ({ page }) => { /* box rect ⊇ #obj-ID rect (±1 px) for all five */ });
for (const [w, h] of VIEWPORTS) test(`boxes and tags stay on screen at ${w}x${h}`, async ({ page }) => { /* box + .tag rects inside the viewport */ });
test('decor is not a control', async ({ page }) => {
  await gotoVF(page, { introSeen: true });
  await expect(page.locator('.box.decor').first()).toHaveAttribute('aria-hidden', 'true');
  await page.locator('.box[data-key="ball"]').hover();
  await expect(page.locator('.box[data-key="ball"] .tag')).toHaveText('weekends → basketball');
});
test('phone tap targets are at least 44px', async ({ page }) => { /* 390x844: every .box.obj width and height >= 44 */ });
test('HUD counts seven detections and the timecode runs', async ({ page }) => {
  await gotoVF(page, { introSeen: true });
  await expect(page.locator('#objcount')).toHaveText('7');
  const a = await page.locator('#tc').textContent(); await page.waitForTimeout(250);
  expect(await page.locator('#tc').textContent()).not.toBe(a);
});
```

`VIEWPORTS` is exported from `helpers.js`.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `fx.js`, `boxes.js` and `hud.js`, the CSS, the markup, and the `main.js` wiring.
- [ ] **Step 4: Run all e2e.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: detection boxes and camera HUD`

---

### Task 8: Navigation, sections and the static driver

**Files:**
- Modify: `index.html` (add `.secbar` with `button.back` "◂ DESK" + `<kbd>esc</kbd>`, `.chips` with five `button.chip[data-k]`, and `#zoomx2`), `css/viewfinder.css`, `js/main.js` (becomes the controller)
- Create: `js/sections.js`, `js/motion.js`, `tests/e2e/navigation.spec.js`

**Interfaces:**
- Consumes: `reduce` and `initialState` (Task 3); `parseHash`, `hashFor` and storage (Task 4); `Boxes` and `Hud` (Task 7); `Meas` (Task 6).
- Produces, `createSections(root, { onBack: () => void, onJump: key => void }) → Sections`:
  - `show(key, ms)`:
    - adds `is-open`, then `is-visible` on the next frame (the fade lasts `ms`)
    - sets `html.dataset.section`
    - focuses `#KEY-h` with `preventScroll`
    - scrolls the section to the top
    - updates the chips
  - `hide(key, ms) → Promise`: fades out over `ms` (250 animated, 200 static), then removes `is-open`.
  - `current() → key|null`
- Produces, `createMotion({ gsap, cam, hud, boxes, els }) → Motion`:
  - `{ animated, intro(meas, opts), reveal({ fast }), open(key, meas), close(key, meas), hop(from, to, meas), frame(key|null, meas), finish() }`. Every animation method returns a Promise.
  - This task ships only the static driver, used when `gsap` is null:
    - `animated: false`
    - `intro` and the moves resolve immediately
    - `reveal` calls `boxes.setVisible(true)`
    - `frame` and `finish` are no-ops
  - Section fades: 450 ms when animated, 200 ms when static.
- Controller rules in `js/main.js`:
  - `motion` uses the static driver when `prefers-reduced-motion: reduce` or `!window.gsap`. In that case it also adds class `vf-static`.
  - `dispatch(event)` runs `next = reduce(state, event)`. If `next === state` it returns. Otherwise it reflects `data-state` and `data-section` and runs the transition effects:
    - → opening(k): `boxes.lock(k)`, `boxes.setInert(true)`, `hud.cursor(false)`, `await motion.open`, then dispatch ARRIVED.
    - → section(k): `sections.show(k, motion.animated ? 450 : 200)`.
    - → closing(k): `await Promise.all([sections.hide(k, ms), motion.close(k, meas)])`, then dispatch ARRIVED. `motion.close` starts its camera 0.2 s in, so the fade leads.
    - → desk: `boxes.lock(null)`, `await motion.reveal({ fast: true })`, `boxes.setInert(false)`, `hud.cursor(true)`, and focus the box of the section just closed.
    - → hopping: `sections.hide(from)`, `await motion.hop`, then dispatch ARRIVED.
  - History:
    - Opening from the desk calls `history.pushState({ vf: 1 }, '', hashFor(k))`.
    - Hop and jump call `history.replaceState(history.state, '', hashFor(to))`.
    - Closing with `history.state?.vf` set calls `history.back()`. Otherwise it calls `replaceState(null, '', pathname + search)` and dispatches CLOSE.
    - `hashchange` dispatches `ROUTE(parseHash(location.hash))`. It's the only external route source.
    - Set `history.scrollRestoration = 'manual'`.
  - Input:
    - box click → open
    - on the desk, keys `1`–`5` open sections
    - in a section, `Escape` closes, `ArrowRight`/`ArrowLeft` hop, `.back` closes, and chips jump
    - UI handlers act only when `data-state` is `desk` or `section`
  - Deep link at boot: if `parseHash` gives a key:
    - start in `section(key)`
    - `motion.frame(key, meas)`
    - `sections.show(key, 200)`
    - boxes are inert and hidden
    - set `data-intro="skipped"`
  - Otherwise start on the desk with `reveal({ fast: true })` and `data-intro="skipped"`. Task 10 adds the intro.
  - CSS:
    - `html.js .sec` is `position: fixed; inset: 0; overflow: auto`, with background `var(--sbg)` and padding that keeps content clear of `.secbar`.
    - Overlay values per spec §4.4.
    - `html.vf-static .sec` uses the same colours at alpha ≥ .96.
    - `html[data-section="contact"]` switches the HUD and bar ink to `#1E2B4F` and turns the scrims off.
    - Crosshair, `.ident` and `#hint` are hidden whenever `data-state` isn't `desk` or `intro`.
    - `html.js .toc` is visually hidden until `:focus-within`, then shows as a small panel at the top-left. Its hash links route through `hashchange` like any other.
    - Below 700 px, `.chips` scrolls horizontally.

- [ ] **Step 1: Write `tests/e2e/navigation.spec.js`**

```js
for (const mode of [{ reducedMotion: 'reduce' }, { blockGsap: true }]) test.describe(JSON.stringify(mode), () => {
  test('click opens each section; Escape returns focus to its box', async ({ page }) => {
    await gotoVF(page, { introSeen: true, ...mode });
    for (const k of ORDER) {
      await page.locator(`.box[data-key="${k}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('data-state', 'section');
      await expect(page).toHaveURL(new RegExp(`#${k}$`));
      await expect(page.locator(`#${k}-h`)).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.locator('html')).toHaveAttribute('data-state', 'desk');
      await expect(page.locator(`.box[data-key="${k}"]`)).toBeFocused();
    }
  });
  test('keys 1-5, arrows wrap, chips jump', async ({ page }) => { /* '5' → contact; ArrowRight → work; ArrowLeft → contact; chip "about" → #about */ });
  test('back and forward', async ({ page }) => { /* click work; goBack → desk, no hash; goForward → work */ });
  test('deep links open directly without the intro', async ({ page }) => {
    for (const k of ORDER) { await gotoVF(page, { hash: `#${k}`, ...mode });
      await expect(page.locator('html')).toHaveAttribute('data-section', k);
      await expect(page.locator('html')).toHaveAttribute('data-intro', 'skipped'); }
  });
  test('#home, #top and unknown hashes show the desk', async ({ page }) => { /* each → data-state desk */ });
});
test('static mode never moves the camera', async ({ page }) => {
  await gotoVF(page, { introSeen: true, reducedMotion: 'reduce' });
  for (const k of ORDER) { await page.keyboard.press(String(ORDER.indexOf(k) + 1)); await page.keyboard.press('Escape'); }
  expect(await page.locator('#cam').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await page.locator('.sec').first().evaluate(el => parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(0.2);
});
test('GSAP blocked switches on static mode', async ({ page }) => {
  await gotoVF(page, { introSeen: true, blockGsap: true }); await expect(page.locator('html')).toHaveClass(/vf-static/);
});
test('contact switches the HUD to dark ink', async ({ page }) => { /* #contact → computed color of .hud-tl is rgb(30, 43, 79) */ });
test('[review] long sections clear the bar on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await gotoVF(page, { hash: '#work', reducedMotion: 'reduce' });
  await page.locator('#work').evaluate(el => el.scrollTo(0, el.scrollHeight));
  const last = await page.locator('#work .det').last().boundingBox(), bar = await page.locator('.secbar').boundingBox();
  expect(last.y + last.height).toBeLessThanOrEqual(bar.y);
});
test('[review] desk boxes are inert outside the desk', async ({ page }) => {
  await gotoVF(page, { hash: '#work', reducedMotion: 'reduce' });
  await expect(page.locator('#boxes')).toHaveAttribute('inert', '');
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#boxes'))).toBe(false); }
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `sections.js`, the static half of `motion.js`, the controller, and the CSS. Port the overlay values from the spec §4.4 table.
- [ ] **Step 4: Run the full e2e suite.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: navigation state machine, history and section overlays`

---

### Task 9: Camera moves (GSAP driver)

**Files:**
- Create: `js/motion-gsap.js`, `tests/e2e/camera.spec.js`
- Modify: `js/motion.js` (the factory returns the GSAP driver when `gsap` is present), `js/main.js` (applies `?vfspeed`; on resize calls `motion.finish()`, re-layouts, re-measures, then `motion.frame(state.key, meas)` when not on the desk)

**Interfaces:**
- Consumes: `lerpCamera`, `toTransform` and `restCamera` (Task 2); `Meas.targets` (Task 6); `boxes.elements`, `lock`, `track` and `setVisible` (Task 7); `hud.setZoom` (Task 7).
- Produces: the GSAP implementations of `open`, `close`, `hop`, `reveal`, `frame` and `finish` (`intro` comes in Task 10).
  - There's one camera tween helper: tween a proxy `t` from 0 to 1, and in `onUpdate` call `gsap.set(cam, toTransform(lerpCamera(from, to, t, dip), viewport))` and `hud.setZoom(scale)`.
  - **open**:
    - lock the box with a 0.07 s yoyo ×3 and fade the other boxes over 0.2 s
    - camera rest → target over 1.05 s, `expo.inOut`, dip 0, starting at 0.3 s
    - blur `filter` 0 → 7 px (0.45 s, `power2.in`) → 0 (0.6 s, `power2.out`)
    - the locked box tracks `#obj-ID` each frame and fades out from 0.75 s
    - the promise resolves at 1.0 s, so the section fades in over the end of the move (spec: "at about 1.0 s"). The timeline keeps running to 1.35 s.
  - Every move first calls `finish()` on any timeline still running, so a close that starts during the end of an open can't fight it.
  - **close**: target → rest over 0.95 s, `expo.inOut`, with a 5 px blur pulse. When it finishes, clear the inline transform and filter.
  - **hop**: target A → target B over 1.3 s, `power2.inOut`, dip 0.55, with a 4 px blur pulse.
  - **reveal({ fast })**:
    - a lime `#scan` line sweeps the viewport over 0.8 s (0.5 s when `fast`)
    - each box pops (`opacity 0→1`, `scale 1.12→1`, `back.out(2)`, 0.32 s) when the line reaches its `top`, and its tag scrambles
  - **frame**: `gsap.set` the target `Cam` (or rest) instantly.
  - **finish**: `progress(1)` on the running timeline.
  - Sequence nothing with `setTimeout`. Only timelines and their promises, so background tabs can't desync.

- [ ] **Step 1: Write `tests/e2e/camera.spec.js`.** Animated, `introSeen`, `speed: 8` unless stated.

```js
const covers = (page, id) => page.locator(`#z-${id}`).evaluate(el => { const r = el.getBoundingClientRect();
  return r.left <= 1 && r.top <= 1 && r.right >= innerWidth - 1 && r.bottom >= innerHeight - 1; });
test('each section lands on its object', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 8 });
  for (const [i, k] of ORDER.entries()) { await page.keyboard.press(String(i + 1));
    await expect(page.locator('html')).toHaveAttribute('data-state', 'section');
    await expect.poll(() => covers(page, SECTIONS[k].object)).toBe(true);
    await page.keyboard.press('Escape'); await expect(page.locator('html')).toHaveAttribute('data-state', 'desk'); }
});
test('zoom readout matches the spec at 1440x900', async ({ page }) => { /* work → '3.8×', coffee → '16.2×' in #zoomx2 */ });
test('spam during a move ends consistent', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 1 }); await page.locator('.box[data-key="work"]').click();
  for (const key of ['2', '3', 'ArrowRight', 'Escape', '5']) await page.keyboard.press(key);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'section', { timeout: 4000 });
  await expect(page).toHaveURL(/#work$/); await expect(page.locator('.sec.is-open')).toHaveCount(1);
  await expect.poll(() => covers(page, 'laptop')).toBe(true);
});
test('back during a move is applied when it lands', async ({ page }) => {
  await gotoVF(page, { introSeen: true, speed: 1 }); await page.locator('.box[data-key="work"]').click(); await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk', { timeout: 5000 });
  await expect(page).not.toHaveURL(/#/);
  expect(await page.locator('#cam').evaluate(el => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
});
test('hop is one move, not out-and-in', async ({ page }) => {
  await gotoVF(page, { hash: '#work', speed: 1 }); const seen = [];
  await page.exposeFunction('note', t => seen.push(t));
  await page.evaluate(() => new MutationObserver(() => note(document.querySelector('#zoomx2').textContent)).observe(document.querySelector('#zoomx2'), { childList: true, characterData: true, subtree: true }));
  const t0 = Date.now(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('html')).toHaveAttribute('data-section', 'coffee');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'section');
  expect(Date.now() - t0).toBeLessThan(2000); expect(seen).not.toContain('1.0×');
});
test('resizing while zoomed keeps the object framed', async ({ page }) => {
  await gotoVF(page, { hash: '#coffee', speed: 8 }); await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(300); expect(await covers(page, 'v60')).toBe(true);
});
test('no long frames during the coffee zoom (chromium)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await gotoVF(page, { introSeen: true, speed: 1 });
  await page.evaluate(() => { window.__long = []; new PerformanceObserver(l => window.__long.push(...l.getEntries().map(e => e.duration))).observe({ type: 'long-animation-frame', buffered: false }); });
  await page.keyboard.press('2'); await expect(page.locator('html')).toHaveAttribute('data-state', 'section');
  expect(Math.max(0, ...await page.evaluate(() => window.__long))).toBeLessThanOrEqual(50);
});
```

`covers` takes the object id. Zoom-target ids are `z-` plus the object id.

- [ ] **Step 2: Run.** Expected: FAIL (the static driver never moves the camera).
- [ ] **Step 3: Implement `motion-gsap.js`** and the factory switch. Port the zoom choreography from the mockup's `focus` and `back`, but drive the camera through `lerpCamera`.
- [ ] **Step 4: Run the full suite (unit + e2e).** Expected: PASS. If the long-frame test fails on the coffee zoom, first remove `filter` from the per-frame work (blur only on `#cam` while `scale < 6`). If it still fails, retarget Coffee to the paper filter (`r 88`, about 9×) and update the spec table in the same commit.
- [ ] **Step 5: Commit.** Message: `feat: GSAP camera moves with one-move hops`

---

### Task 10: The opening

**Files:**
- Modify: `js/motion-gsap.js` (`intro`), `js/main.js` (gating, skip, replay, photo preload), `index.html` (`#af`, `#facebox` with `.tag`, `button#replay` "↺ replay intro"), `css/viewfinder.css`
- Create: `tests/e2e/intro.spec.js`

**Interfaces:**
- Consumes: `Meas.targets.about` (the polaroid framing) and `Meas.face` (Task 6); `introSeen`, `markIntroSeen` and `getStorage` (Task 4); `scramble` (Task 7); `reveal` (Task 9).
- Produces: `motion.intro(meas, { photoOk: boolean }) → Promise`. Beats per spec §4.3; the mockup's `runIntro` is the reference. Total ≈ 3.7 s at speed 1.
  1. Boot fades out at 0.3 s. Corners and HUD come in over 0.5 s.
  2. AF hunts 3 points at 0.15 s intervals, with filter steps `blur 14/20/7, brightness 1.45/1.3/1.12, saturate .5/.65/.85`. It then locks on `meas.face`: lime, a ×0.82 pulse, and the image goes sharp.
  3. The face box grows from the reticle, and its tag scrambles "person 0.99" → "khoo_shi_xian 0.99". The name words slide up (`yPercent 115→0`, stagger 0.07, `expo.out`) at intro scale `clamp(1, vw/900, 1.8)`, top ≈ 120 px. Then the status pill and subtitle appear.
  4. A 0.6 s hold.
  5. Pull back for 1.0 s, `power3.inOut`: about-framing → rest, with a 3 px blur pulse. The face box tracks `#z-face` and fades. The name returns to scale 1, `y` 0.
  6. `reveal({ fast: false })` starts 0.9 s after the pull-back begins.
- If `photoOk` is false, skip beats 2–5 and go straight to `reveal`.
- Controller:
  - With no deep link, animated mode and `!introSeen(getStorage(window))`:
    - set state `intro` and `data-intro="played"`
    - preload the photo (resolves on load or error, with a 2.5 s cap) together with `document.fonts.ready`
    - `await motion.intro`, then `markIntroSeen`, then dispatch INTRO_DONE
  - During the intro, any `keydown`, or a `pointerdown` that isn't on `#replay`, calls `motion.finish()` and swallows the event: `preventDefault` + `stopPropagation` in the capture phase, so nothing underneath activates.
  - Resize during the intro: `finish()`, then the normal re-layout.
  - `#replay` is visible only on the desk. It runs the intro again (and doesn't touch storage).

- [ ] **Step 1: Write `tests/e2e/intro.spec.js`**

```js
test('first visit plays once and remembers', async ({ page }) => {
  await gotoVF(page, { speed: 8 });
  await expect(page.locator('html')).toHaveAttribute('data-intro', 'played');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk', { timeout: 3000 });
  expect(await page.evaluate(() => localStorage.getItem('ksx-viewfinder-intro-v1'))).toBe('1');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-intro', 'skipped');
});
test('desk is interactive within 4s at real speed', async ({ page }) => {
  const t0 = Date.now(); await gotoVF(page, { speed: 1 });
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk', { timeout: 4000 }); expect(Date.now() - t0).toBeLessThan(4500);
});
test('any key skips', async ({ page }) => {
  await gotoVF(page, { speed: 1 }); await page.waitForTimeout(600); const t = Date.now(); await page.keyboard.press('x');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk'); expect(Date.now() - t).toBeLessThan(1000);
});
test('[review] a tap on a box during the intro only skips', async ({ page }) => {
  await gotoVF(page, { speed: 1 }); await page.waitForTimeout(800);
  const b = await page.locator('.box[data-key="work"]').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk'); await page.waitForTimeout(500);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk'); await expect(page).not.toHaveURL(/#work/);
});
test('[review] throwing storage: intro plays, no errors', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e));
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('denied'); }; Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await gotoVF(page, { speed: 8 }); await expect(page.locator('html')).toHaveAttribute('data-state', 'desk'); expect(errors).toEqual([]);
});
test('[review] resize during the intro lands on a laid-out desk', async ({ page }) => {
  await gotoVF(page, { speed: 1 }); await page.waitForTimeout(500); await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('html')).toHaveAttribute('data-state', 'desk');
  /* every .box.obj rect contains its #obj-ID rect (±1 px) */
});
test('photo blocked: straight to the desk', async ({ page }) => {
  await gotoVF(page, { speed: 1, blockPhoto: true }); await expect(page.locator('html')).toHaveAttribute('data-state', 'desk', { timeout: 4000 });
});
test('deep link on a first visit skips and does not mark seen', async ({ page }) => { /* #about → data-intro skipped; storage flag null */ });
test('replay', async ({ page }) => { /* desk → click #replay → data-state intro → desk; #replay hidden inside a section */ });
test('no console errors across a full visit', async ({ page }) => {
  /* collect console 'error' + pageerror; intro at speed 8 → open each section by key → Escape → hop once → expect [] */
});
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the full suite.** Expected: PASS.
- [ ] **Step 5: Manual check at 390×844.**
  - Screenshot mid-intro (use `?vfspeed=0.2`).
  - The face is horizontally centred and the name sits above it.
  - If not, adjust the portrait intro framing.
- [ ] **Step 6: Commit.** Message: `feat: camera-boot opening sequence`

---

### Task 11: Share image, favicon and security headers

**Files:**
- Create: `favicon.svg` (lime corner brackets on black, 64×64 viewBox), `img/og.png`, `tests/scripts/og.mjs`, `tests/unit/headers.test.js`, `tests/e2e/meta.spec.js`
- Modify: `vercel.json`, `.vercelignore` (add `pfp.jpg`)

**Interfaces:**
- Produces:
  - `img/og.png`: 1200×630, the desk after the reveal, made by `node tests/scripts/og.mjs` while the local server runs. It uses `@playwright/test`'s chromium, `introSeen`, and `?vfspeed=50`.
  - `vercel.json` keeps `cleanUrls: true` and `trailingSlash: false`, and adds `headers` for source `/(.*)`:
    - `Content-Security-Policy`: `default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - Site markup has no inline `<script>`, no `style=""` attributes and no inline event handlers (CSP).

- [ ] **Step 1: Write the tests.**
  - `headers.test.js`: parse `vercel.json`, check the four headers exactly as above, and check `cleanUrls` is kept.
  - `headers.test.js` also: `index.html` has no inline `<script>` without `src`, no ` style="` and no ` on[a-z]+="`.
  - `meta.spec.js`:
    - `og:image` equals `https://portfolio-sage-pi-63.vercel.app/img/og.png`
    - `GET /img/og.png` and `/favicon.svg` return 200
    - sharp metadata of `img/og.png` is 1200×630. This one is a unit test.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement**, generate `og.png`, and commit the assets.
- [ ] **Step 4: Run the full suite.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: share image, favicon and security headers`

---

### Task 12: Docs, architecture map, final verification

**Files:**
- Modify: `README.md` (rewrite), and the spec's frontmatter (`owners: [index.html, css/site.css, css/viewfinder.css, js/]`, `last_verified`, `status: implemented`)
- Create: `ARCHITECTURE.md` (via the `architecture-map` skill; the old three-file site is gone, so the map describes the new structure)

- [ ] **Step 1: Write the README.** It covers:
  - what the site is
  - run locally: `python3 -m http.server 4173 --bind 127.0.0.1`
  - add a coffee: one line in `js/data/coffees.js`
  - add the CV: put the PDF at `cv.pdf` and uncomment the line in `.ident .links` and in Contact
  - regenerate images: `node tests/scripts/images.mjs`, `node tests/scripts/og.mjs`
  - tests: `cd tests && npm install && npx playwright install chromium webkit && npm test`
  - deploy: merge to `main`
- [ ] **Step 2: Generate `ARCHITECTURE.md`** with the `architecture-map` skill.
- [ ] **Step 3: Run the full suite** (`cd tests && npm test`). Expected: all unit tests and both Playwright projects pass.
- [ ] **Step 4: Check the budgets.**
  - Sum the gzip sizes of `index.html`, `css/*`, `js/**` (`gzip -c f | wc -c`). Expected: ≤ 250 000 bytes.
  - Run `npx lighthouse http://127.0.0.1:4173 --form-factor=mobile --only-categories=performance,accessibility --quiet --chrome-flags="--headless"`. Expected: Performance ≥ 90, Accessibility ≥ 95.
  - Record both numbers in the commit message.
- [ ] **Step 5: Commit.** Message: `docs: README, architecture map, spec sync`
- [ ] **Step 6: Stop and ask Shi Xian before pushing.** On his yes:
  - push `feat/viewfinder` and open a PR to `main`
  - on the Vercel preview, `curl -sI <preview-url>` shows the four headers
  - load the preview in Playwright with no console errors, ignoring `vercel.live` toolbar CSP noise
  - check it by hand on a real phone and in real Safari
  - merging stays his call
