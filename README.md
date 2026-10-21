# Khoo Shi Xian — Portfolio

The site is a camera viewfinder looking down at a desk. A short opening finds Shi Xian in a polaroid, pulls back to the desk, and labels every object like an object detector would. Each object is a section: click it (or press 1–5) and the camera dives in; Esc zooms back out.

Static site, no build step. It deploys straight to Vercel and is live at https://portfolio-sage-pi-63.vercel.app.

- Without JavaScript the page is a plain, readable document. The camera is progressive enhancement.
- With "reduce motion" on (or if GSAP can't load) there's no opening and no zooming; sections just fade.

## Run it locally

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open http://127.0.0.1:4173. Add `#work`, `#coffee`, `#trade`, `#about` or `#contact` to open a section directly. The opening plays once per browser; clear the `ksx-viewfinder-intro-v1` localStorage key (or use "↺ replay intro") to see it again.

## Edit content

- **Text:** everything is real HTML in `index.html` (identity block at the top, then one `<section>` per object).
- **Add a coffee:** one line in `js/data/coffees.js` — `name`, `origin`, `method`, `notes`, `rating` (1–5, or 0 for "not rated yet").
- **Add the CV:** put the PDF in the repo root as `cv.pdf`, then uncomment the `cv.pdf` link in `index.html` (it sits next to GitHub in the identity block).
- **Images:** regenerate the photo sizes and the shadow sprite with `node tests/scripts/images.mjs` (from `pfp.jpg`). Re-render the link-preview image with `node tests/scripts/og.mjs` while the local server runs.

## Tests

```bash
cd tests && npm install && npx playwright install chromium webkit && npm test
```

Unit tests (`node:test`) cover the pure modules; Playwright covers the page in Chromium and WebKit. Timing budgets only mean something on an idle machine, so they run separately:

```bash
cd tests && PERF=1 npx playwright test -g "long frames|hop is one move|within 4s" --project=chromium --workers=1
```

## Deploy

Merge to `main`; Vercel deploys it. Pull requests get a preview URL first. `tests/`, `docs/` and other dev files are kept out of the deploy by `.vercelignore`.

## Where things are

See `ARCHITECTURE.md` for the file map. The design is in `docs/superpowers/specs/2026-10-21-viewfinder-redesign-design.md`.
