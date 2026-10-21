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
- **Add the CV:** put the PDF in the repo root as `cv.pdf`, then uncomment both `cv.pdf` links in `index.html` (identity block and Contact).
- **Images:** regenerate the photo sizes and the shadow sprite with `node tests/scripts/images.mjs` (from `pfp.jpg`). Re-render the link-preview image with `node tests/scripts/og.mjs` while the local server runs.

## Tests

```bash
cd tests && npm install && npx playwright install chromium webkit && npm test
```

Unit tests (`node:test`) cover the pure modules; Playwright covers the page in Chromium and WebKit. Timing budgets only mean something on an idle machine, so they run separately:

```bash
cd tests && PERF=1 npx playwright test -g "long frames|hop is one move|within 4s" --project=chromium --workers=1
```

For Lighthouse, run the audit preview from the repo root in one terminal:

```bash
python3 tests/scripts/serve.py
```

Then audit it from another terminal:

```bash
npx lighthouse@12.8.2 http://127.0.0.1:4174 --form-factor=mobile --only-categories=performance,accessibility --quiet --chrome-flags="--headless"
```

This preview enables gzip and the four security headers from `vercel.json`. The simple development server on port 4173 sends uncompressed text, so use port 4174 for performance measurements. Both serve the same site files without a build step.

## Verification status

Verified locally on 2026-10-21:

- 30 unit tests and 130 Chromium/WebKit browser checks passed (2 frame-check cases intentionally skipped in the ordinary suite). All 3 isolated Chromium timing checks passed, with the desk interactive in about 2.9 s.
- Lighthouse 12.8.2 mobile on the compressed audit preview: Performance **92, 93, 93**; Accessibility **100** in all three sequential runs.
- Gzipped site code: 31,504 bytes; including pinned GSAP: 59,704 bytes against the 250,000-byte budget. The large photo is 243,184 bytes against its 250,000-byte budget.
- Real CDN/font loading and all five sections worked at desktop and phone sizes with no console errors; all four security headers were verified. A stalled font server still permits first paint and the desk.

Manual checks on a real phone and in real Safari remain part of release review.

## Deploy

Vercel deploys `main` automatically; pull requests get a preview URL first. Pushing, opening a pull request, and merging require explicit user confirmation. `tests/`, `docs/` and other dev files are kept out of the deploy by `.vercelignore`.

## Where things are

See `ARCHITECTURE.md` for the file map. The design is in `docs/superpowers/specs/2026-10-21-viewfinder-redesign-design.md`.
