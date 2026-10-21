# Architecture

Static portfolio, no build step: `index.html` + two stylesheets + native ES modules, served as-is by Vercel. A camera "viewfinder" looks down at a drawn SVG desk; each desk object opens a section. All content is real HTML — camera mode is progressive enhancement switched on by `html.js`.

## File Map

```
index.html              — all content (identity block, toc, 5 sections) + inline SVG desk, HUD, boxes nav, section bar, boot screen
css/
  site.css              — tokens/colours, type, plain-document layout (no JS), content components
  viewfinder.css        — everything under html.js: camera, HUD, boxes, overlays, section bar, intro, responsive
js/
  early.js              — sync in <head>: adds html.js (6 s failsafe), injects the web-font stylesheet so it never blocks paint
  main.js               — controller: boot, fit/measure, dispatch + effects, routing/history, input, resize, intro gating
  config.js             — ORDER, SECTIONS (object/target/label/conf/name), DECOR, INTRO_KEY
  state.js              — pure reducer: intro|desk|opening|section|closing|hopping, queued routes
  router.js             — parseHash / hashFor
  storage.js            — intro-seen flag; any storage failure reads as "not seen"
  camera.js             — pure maths: svgScale, fitCamera, restCamera, lerpCamera, toTransform
  layout.js             — LAYOUTS (landscape/portrait: viewBox, mat, object x/y/tilt/scale) + pickLayout
  scene.js              — decorate (seeded detail), applyLayout, measure → Meas, photoHref
  boxes.js              — detection-box buttons + decor labels: place, track, lock, inert
  hud.js                — timecode, zoom readout, object count, hint, desk reticle
  sections.js           — show/hide section overlays, chips, heading focus
  motion.js             — Motion factory + static driver (fades only)
  motion-gsap.js        — GSAP driver: open/close/hop/reveal/frame/finish + the intro timeline
  fx.js                 — scramble() label effect (instant under reduced motion)
  brewlog.js            — coffee table renderer (textContent only)
  data/coffees.js       — COFFEES: one line per bag
  package.json          — {"type":"module"} so Node treats js/ as ESM (vercelignored)
img/                    — pfp-1280/2048.webp (photo), shadow.png (shadow sprite), og.png (link preview)
favicon.svg             — viewfinder-brackets icon
vercel.json             — cleanUrls + security headers (CSP: self, cdnjs, Google Fonts)
.vercelignore           — keeps tests/, docs/, pfp.jpg and dev files out of the deploy
pfp.jpg                 — source photo (not served)
tests/
  package.json          — dev only: @playwright/test, gsap (local copy for tests), sharp
  playwright.config.js  — chromium + webkit at 1440x900; python http.server on :4173
  unit/                 — node:test: pure modules, GSAP SRI pin, headers/CSP markup, asset budgets
  e2e/                  — Playwright specs + helpers.js (gotoVF, rectOf, VIEWPORTS)
  fixtures/parity.json  — every content string from the pre-redesign site (ab6b1f5)
  scripts/              — images.mjs (photo sizes + shadow sprite), og.mjs (link-preview render)
docs/superpowers/       — design spec + implementation plan
```

## Dependency Flow

```
index.html
  ├─ js/early.js            (classic, sync)
  ├─ gsap 3.12.5            (cdnjs + SRI, deferred) ──► window.gsap (absent ⇒ static driver)
  └─ js/main.js             (module)
       ├─ state.js ─┐
       ├─ router.js ├─► config.js
       ├─ storage.js┘
       ├─ layout.js
       ├─ scene.js ──────► camera.js, config.js
       ├─ boxes.js ──────► config.js, fx.js
       ├─ hud.js, sections.js
       ├─ motion.js ─────► motion-gsap.js ──► camera.js, config.js, fx.js
       └─ brewlog.js, data/coffees.js
```

## Key Patterns

- **One state machine.** All navigation goes through `reduce()`; `enter()` runs effects only when mode or key changes. Input is ignored during moves; routes that arrive mid-move are queued (last wins) and applied on arrival.
- **The URL follows the view.** Opening from the desk pushStates `#key` (state `{vf:1}`); hops replaceState; closing uses `history.back()` when we pushed, else replaceState. `hashchange` is the only external route source.
- **Camera = focus-point Cam `{ox, oy, rotation, scale}`.** Measure at rest (`measure()` clears the transform), fit with `fitCamera`, move with `lerpCamera` (dip > 0 pulls back mid-move), apply with `toTransform` through `gsap.set`.
- **Motion seam.** `createMotion` returns the GSAP driver or the static one (reduced motion / GSAP missing). New animation needs both.
- **Single sources.** Geometry (positions, tilt, scale) lives only in `layout.js`; colours only in CSS (`--c-<key>`); section metadata only in `config.js`.
- **No SVG filters in the scene.** Shadows are `img/shadow.png` or radial gradients in `#shades`, positioned by `applyLayout`; filters stall high-zoom frames.
- **CSP-safe markup.** No inline `<script>`, `style=""` or `on*=` in HTML (CSSOM writes are fine).
- **Test hooks.** `?vfspeed=N` scales GSAP's global timeline; `<html>` carries `data-state`, `data-section`, `data-layout`, `data-intro`.

## Entry Points

- `index.html` → `js/early.js` (head) → GSAP (defer) → `js/main.js` (module, boots on load). Every module is listed as `<link rel="modulepreload">` in the head — add new modules there too.
- Served locally on port 4173 (same server Playwright uses).

## Run Commands

```
python3 -m http.server 4173 --bind 127.0.0.1                 # serve the site
cd tests && npm test                                         # unit + e2e (chromium, webkit)
cd tests && PERF=1 npx playwright test -g "long frames|hop is one move|within 4s" --project=chromium --workers=1
node tests/scripts/images.mjs && node tests/scripts/og.mjs   # regenerate assets (og.mjs needs the server)
```
