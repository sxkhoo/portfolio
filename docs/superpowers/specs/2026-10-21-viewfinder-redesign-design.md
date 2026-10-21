---
title: Viewfinder — portfolio redesign
status: implemented
owners: [index.html, css/site.css, css/viewfinder.css, js/]
last_verified: 2026-10-21
---

# Viewfinder — portfolio redesign

The whole site becomes a camera viewfinder looking down at Shi Xian's desk. A short opening finds him, pulls back to the desk, and labels every object like an object detector would. Each object is a section: click it and the camera dives into it, and the section opens *inside* that object.

Approved direction after a clickable mockup ("feels right — keep this direction and refine it"). The mockup is a throwaway reference, not a starting codebase (see §8).

## 1. Why

**The problem with the current site (commit `ab6b1f5`):**

- There's no single idea. Six horizontal "worlds" each have their own effect (hexagons, blueprint grid, robot mascots, coffee steam, candlesticks, moon), so the site reads as a collage.
- It looks like the stock AI-portfolio recipe: cream background, serif headings, pill buttons, soft cards, blur orbs and grain.
- There are six ways to navigate (arrows, dots, navbar, keys, drag, trackpad) for six thin slides. Work gets the same weight as Coffee.
- Mobile is broken: the side arrows cover card text, the dot bar covers cards, and the moon overlaps the Contact heading.

**What Shi Xian asked for:** an animation when you land on the site, then you press something and a full-page animation carries you into that section. He wants it very interactive.

**Why Viewfinder:** it ties the site's motion to his field. He builds machines that see (vision AI: circuit-board inspection, YOLO starfish detection), so the site behaves like one.

**Who it's for:**
- Primary: recruiters and hiring managers for vision-AI, ML and embedded internships. They skim, so they must get name, role and availability within about 3 seconds and reach Work in one click.
- Secondary: peers and friends.

## 2. Goals, non-goals, anti-goals

**Goals**
1. A memorable opening that establishes who he is in about 3.5 s.
2. The desk is the menu: five objects, five sections.
3. Camera zoom in and out between the desk and each section, with each section sitting on the surface of its object.
4. The same content as the current site, plus a GitHub link and a CV slot.
5. Every section has its own link, and browser Back/Forward behave.
6. It works on phones, with the desk rearranged vertically.
7. It's accessible: keyboard, screen reader, reduced motion. All text is real HTML.
8. It's fast.

**Non-goals**
- No framework, bundler or build step for the site itself.
- No CMS. Content stays in the repo's files.
- No real ML in the browser and no webcam. The detections are staged.
- No WebGL or 3D.
- No light/dark toggle.
- No analytics or tracking.
- No new long-form copy. Reuse the current text; short ledes are fine.
- No photo of the real desk for now. The scene is drawn (§4.1). Swapping in a real photo later is possible but out of scope.

**Anti-goals** (failure even if it technically works)
- An opening that gets in a recruiter's way: unskippable, replaying on every visit, or longer than about 4 s.
- Content that only exists after an animation, and so is invisible to Google, link previews, screen readers or no-JS visitors.
- Visible stutter during zooms on an ordinary laptop.
- Motion that ignores the visitor's "reduce motion" setting.
- Text that's hard to read over a busy background.
- Drifting back to the generic template look: cream, serif, pill cards, blur orbs.

## 3. Constraints

- **Hosting:** Vercel, static. The repo is `sxkhoo/portfolio` (public). `main` auto-deploys to https://portfolio-sage-pi-63.vercel.app. Keep the existing `vercel.json` (`cleanUrls: true`, `trailingSlash: false`).
- **Release:** build on a feature branch and review it on the Vercel preview. It goes live only when merged to `main`.
- **Stack:** plain HTML, CSS and JS. Native ES modules are fine.
  - GSAP core comes from cdnjs, pinned to an exact version with an SRI `integrity` hash. Use no paid or bonus plugins.
  - Fonts come from Google Fonts with `display=swap`.
  - Dev-only tooling for tests (e.g. a `package.json` with test dependencies) is allowed. It must not add a build step to the deployed site.
- **Browsers:** current Chrome, Edge, Firefox and Safari, including iOS Safari 16.4+.
- **Performance budget:**
  - HTML, CSS, JS and the inline scene, excluding the photo: ≤ 250 KB transferred.
  - `pfp.jpg` is 576 KB (2560×1697). Serve responsive WebP at 1280w and 2048w, with the large one ≤ 250 KB (film grain made 2560w too heavy).
  - Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
  - No frames over 50 ms during a zoom in a Chrome performance trace on a 2020-era laptop.
- **Repo hygiene:** add `.superpowers/` (brainstorm mockups) to `.gitignore`.

## 4. The experience

### 4.1 Look

**Scene:** a top-down "flat lay" of a desk, drawn as inline SVG.
- Surfaces: walnut wood, a charcoal felt mat, a warm lamp falloff, soft drop shadows.
- Objects:
  - an open laptop whose screen shows an inspection UI: a code pane, plus a green PCB with "ok 0.98" and "defect 0.93" boxes
  - a V60 dripper on a mug, with the coffee bed and bloom visible
  - a gooseneck kettle
  - a phone showing a candlestick chart
  - an Instax-Wide-style polaroid of `pfp.jpg` with washi tape and the handwritten caption "ksx · somewhere cold"
  - the back of an envelope with a violet "ksx" wax seal
  - a basketball, partly off-frame
  - a guitar pick, a pencil, and coffee beans

**Type:**
- Inter Tight for display and body text.
- JetBrains Mono for the HUD, labels and metadata.
- Caveat for handwritten accents only.

**Colour**

| Role | Value |
|---|---|
| HUD ink | `#F2EFE8` |
| AF / lock | `#C8FF3E` |
| REC dot | `#FF453A` |
| Work | `#6A8DFF` |
| Coffee | `#F4A940` |
| Trade | `#34D399` |
| About | `#FF7A9A` |
| Contact | `#B79BFF` (seal `#5B3FC4`, letter ink `#1E2B4F`) |
| Decor boxes | `#A3A9B1` |

**HUD** (screen-space, decorative, `aria-hidden`):
- Four corner brackets.
- Top-left: "● REC", a running timecode, "CAM 01".
- Top-centre: "DETECT · yolo-ksx-v11n · N obj".
- Top-right: "ISO 400 ƒ/1.8 1/125 AWB" and a battery.
- Bottom-centre: a focus-distance scale with a moving marker, plus a zoom readout ("1.0×").
- Bottom-right: a hint line.
- Centre: a crosshair, hidden inside sections.
- Dark top and bottom scrims keep the HUD readable over bright frames. They're turned off on the light Contact section.

**Identity block** (bottom-left of the desk):
- the pill "● open to internships · SG / remote"
- the name "Khoo Shi Xian"
- the line "Computer Engineering @ NUS · Vision AI & ML"
- GitHub and CV links (new, §4.5)

**Removed from the current site:** the theme toggle, horizontal glide, journey dots, prev/next arrows, the mobile hamburger, all four particle canvases, the work-tab theme glows, and the robot/wizard/starfish/coffee mascots.

### 4.2 Detection boxes

Each desk object gets an axis-aligned box, the way a YOLO-style detector draws them:
- a 1.5 px border in the section colour, with heavier corner ticks
- a filled label tab reading "class confidence"
- a "→ SECTION" tag under the bottom-right corner

| Object | Label | Opens |
|---|---|---|
| Laptop | `laptop 0.97` | Work |
| V60 | `v60_dripper 0.94` | Coffee |
| Phone | `cell_phone 0.91` | Trade |
| Polaroid | `polaroid 0.96` | About |
| Envelope | `envelope 0.99` | Contact |
| Basketball (decor) | `sports_ball 0.88`, hover → "weekends → basketball" | — |
| Guitar pick (decor) | `guitar_pick 0.41`, hover → "low conf. it plays guitar" | — |

- Decor boxes are dashed grey and don't navigate.
- Hovering or focusing a box makes it glow and dims the others to about 30%.
- On desktop, the pointer over the desk becomes a small AF reticle. It grows and rotates over a box.
- Labels "scramble" in: random glyphs resolve into the text.

### 4.3 Opening (first visit only)

Target is 3.5–3.8 s total. The mockup runs 3.7 s.

| Time | What happens |
|---|---|
| 0–0.5 s | Black frame with "CAM 01 / SENSOR OK". Corner brackets and HUD fade in. |
| 0.5–1.3 s | The camera is framed on the polaroid's photo so it fills the screen, heavily blurred and over-exposed. An AF reticle hunts three spots (blur steps down each time), then locks on his face: it turns lime, pulses, and the image snaps sharp. |
| 1.3–1.9 s | The reticle grows into a face box "person 0.99", which scrambles to "khoo_shi_xian 0.99". The name slides up word by word, large, over the sky. The status pill and subtitle appear. |
| 1.9–2.9 s | Pull back. The camera zooms out from the photo to the whole desk, rolling 6° so the tilted polaroid is revealed, with a slight blur pulse. The face box tracks the face and fades. The name block shrinks into its bottom-left spot. |
| 2.8–3.7 s | A lime scan line sweeps down. Each box pops in as the line passes it, and the object count goes to 7. |

**Rules**
- Any click, tap or key skips straight to the end state.
- The opening plays once per visitor, remembered in `localStorage` under a versioned key. Wrap storage access in try/catch; if storage fails, play the opening. Returning visitors start at the desk with only the scan-line reveal (≤ 1 s).
- A small "↺ replay intro" control sits in the HUD.
- Deep links (§4.6) never play the opening.
- Wait for fonts and the photo before starting, up to 2.5 s, holding on the black "CAM 01" frame.

### 4.4 Zooming into a section

**Triggers:** clicking or tapping a box, keys 1–5 on the desk, or arriving via a deep link.

**Sequence** (mockup values; ±20% is fine):
1. The box locks lime for about 0.3 s while the other boxes fade.
2. The camera moves for about 1.05 s with an expo in-out ease, until the object's *zoom target* covers the viewport. Blur pulses 0 → 7 px → 0, and the zoom readout counts up.
3. At about 1.0 s the section fades in (about 0.45 s) and its content staggers upward.

**Zoom targets** (the surface each section sits on; zoom values at 1440×900):

| Section | Zoom target | Zoom | Overlay |
|---|---|---|---|
| Work | Laptop screen | ~3.7× | Navy tint ~88%; the inspection UI shows faintly behind |
| Coffee | Coffee bed in the V60 | ~16× | Brown tint ~84%; bloom bubbles visible |
| Trade | Phone screen, counter-rotated 10° to upright | ~12× | Near-black green tint; big candlesticks behind the cards |
| About | Polaroid photo, counter-rotated 6° | ~6.5× | Photo visible on the right; dark gradient on the left under the text |
| Contact | Envelope, counter-rotated 5° | ~5× | Cream paper tint ~86%; dark ink text; HUD switches to dark ink; faint wax seal behind the heading |

**Camera maths** (proven in the mockup), measured with the camera at rest:
- Scale: `s = max(vw / (w·k), vh / (h·k)) · 1.015`. Here `k` is the SVG's screen scale, and `w`, `h` are the target's own unrotated size.
- Translate so the target's centre lands on the viewport centre.
- Rotate by minus the object's tilt.
- Set `transform-origin` at the target's centre.
- The detection box being opened tracks its object each frame during the move.

**Out:** Esc, the "◂ DESK" button, or browser Back. The section fades (0.25 s), the camera returns (about 0.95 s) with a blur pulse, and the scan line re-reveals the boxes (about 0.5 s).

**Hop:** ←/→ keys (wrapping around) or the bottom chip bar (WORK · COFFEE · TRADE · ABOUT · CONTACT).
- The mockup zooms all the way out and back in, which takes about 2 s and feels slow.
- Make it one continuous camera move instead: pull back partway, pan, push in. Target 1.2–1.5 s.

### 4.5 Sections: same content as now

All text comes verbatim from the current `index.html` at `ab6b1f5` unless noted, restyled to the new look.

- **Work.** Heading "Work", lede "I build machines that can see."
  - Four project cards styled as detection crops, each with a label tab such as `venture_corp 0.98`:
    - Venture Corp
    - Wizard Battle
    - Starfish Detection
    - StudyJio
  - Each card keeps its current title, TL;DR, bullet points and tech pills.
  - Keep the line "Also built: FPGA OLED mini-game (Verilog) · Java CLI chatbot…".
  - The cute SVG mascots are dropped.
- **Coffee.** Heading "Brew log", kicker "Filter coffee".
  - A table with columns #, bean, origin, method, rating.
  - Keep the `COFFEES` array workflow: one line per coffee, documented in the README.
  - The method filter appears only when there's more than one method, as now.
- **Trade.** Heading "Market hours", with three cards:
  - Equities: Moomoo, since Oct 2024
  - Crypto: Binance, since Nov 2024 · active
  - Playbook: process over P&L
  - Keep the current copy, including "Student account, learning first."
- **About.**
  - Lede: "Malaysian in Singapore. Basketball on weekends, ML papers on weeknights."
  - "🇲🇾 → 🇸🇬 · NUS · Tsinghua exchange"
  - Background, Education, Toolbox pills, and languages.
- **Contact.**
  - Heading "Let's build something that sees."
  - Email button (khooshixian@gmail.com), LinkedIn, phone number, and "Singapore · replies within a day".
  - A Caveat signature, "— Shi Xian".
  - Footer: "© 2026 Khoo Shi Xian · Short, on purpose."
- **New links:**
  - GitHub (https://github.com/sxkhoo) in the identity block and in Contact.
  - CV: a plain link to `cv.pdf`. It stays out of the HTML until the PDF is added to the repo, and the README documents the one-line change to add it. No runtime check for the file.

### 4.6 URLs and history

- Routes: `/` is the desk. `/#work`, `/#coffee`, `/#trade`, `/#about` and `/#contact` are the sections. The old `#home` and `#top` map to the desk.
- Opening a section pushes a history entry. Back zooms out to the desk, and Forward zooms back in.
- Loading a deep link skips the opening. The page renders already in the section (camera at that zoom, short fade-in). Esc or Back then goes to the desk with the box reveal.

### 4.7 Phones and small screens

- Portrait and narrow screens get a vertical arrangement of the same drawn objects, stacked to fill a tall frame.
  - All five section objects must be visible without scrolling at 390×844.
  - The mockup's letterboxed landscape desk is only a placeholder.
- There are no hover states, so labels are always visible. Tap targets are at least 44×44 px. Decor labels are hidden (their quips need hover).
- The HUD is trimmed: camera settings, focus scale and model line are hidden. Corners, REC/timecode and the hint stay.
- Sections are a single column that scrolls inside the section. The chip bar scrolls sideways if needed, and "◂ DESK" is always reachable.
- The opening frames the photo for portrait: face centred, name above it.

### 4.8 Accessibility

- **Real HTML:** all section content is in `index.html` at load. Sections are in the DOM, visually hidden until opened, never generated on demand. The coffee rows may still render from `COFFEES`.
- **No JS:** the page reads as a normal stacked document (identity, then sections in order). The viewfinder is progressive enhancement; for example, a `js` class on `<html>` switches camera mode on.
- **Keyboard:**
  - Tab moves through the desk boxes in a sensible order, Work first.
  - Enter opens a box, and focus moves to the section heading.
  - Esc returns focus to the box that opened it.
  - Focus rings are visible.
- **Screen readers:**
  - Boxes are buttons named like "Open Work (laptop)".
  - The scene and HUD are `aria-hidden`.
  - A visually hidden "Skip to content" link leads to a plain list of sections.
- **Reduced motion** (`prefers-reduced-motion: reduce`):
  - No opening; show the desk immediately.
  - No camera zoom, blur, scan line or text scramble.
  - Sections open and close with a ≤ 200 ms fade.
- **Contrast:** body text is at least 4.5:1 against its overlay.

### 4.9 Performance notes from the mockup

- Animate only transform, opacity and filter on the camera layer. Avoid layout reads in per-frame callbacks except box tracking.
- Big zooms (Coffee, about 16×) re-rasterise the SVG every frame. SVG filters are out entirely: drop-shadow filters made zoom frames 100–250 ms, so shadows are a pre-blurred sprite image (`img/shadow.png`) and radial gradients in their own layer.

### 4.10 Edge cases

- **Input during a camera move:** new navigation (clicks, 1–5, ←/→, chips) is ignored. A browser Back/Forward that arrives mid-move is applied when the move finishes, so the URL and the view never disagree.
- **Resize or rotation:**
  - Mid-move: snap to the end of the current transition, then re-fit the camera to the new size.
  - In a section: keep the same object framed.
  - On the desk: re-place the boxes.
- **Unknown hash** (`/#foo`): show the desk.
- **Photo fails to load** (or isn't ready after 2.5 s): skip the AF and face beats. Go straight to the desk reveal, with the polaroid showing a plain placeholder.
- **GSAP fails to load** (blocked or offline): the site runs in the same static mode as reduced motion, fully usable.
- **Landscape aspect ratios from 4:3 to 21:9:** all five section objects and their labels stay on screen.
- **Background tab:** GSAP's lag smoothing is fine. Nothing may depend on wall-clock timers finishing mid-animation.

### 4.11 SEO and sharing

- Keep the current `<title>` and meta description.
- Add Open Graph and Twitter tags with `og:url` set to https://portfolio-sage-pi-63.vercel.app and a 1200×630 `og:image` of the desk.
- Replace the favicon with a viewfinder corner-bracket icon.

## 5. Acceptance checks

These become the automated tests: unit tests for pure logic, plus browser end-to-end tests.

1. **First visit** (no storage flag): the opening plays, the desk is interactive within 4 s, and any key or click skips straight to the desk.
2. **Second visit:** no opening, only the scan-line reveal.
3. **`/#work`** loads straight into Work with no opening. The same holds for every section.
4. **Each of the five boxes** opens its section and updates the hash. Back returns to the desk; Forward reopens the section.
5. **Keys:** 1–5 open sections from the desk, Esc returns, and ←/→ hop with wrap-around.
6. **Focus:** opening a section focuses its heading, and closing returns focus to its box.
7. **Reduced motion:** no opening, open/close are fades of ≤ 200 ms, and no camera transform is ever applied.
8. **No JS:** every section's text is visible on the page.
9. **390×844:** the desk is vertical, all five section objects are visible without scrolling, and tapping opens sections.
10. **Content parity:** every content string in the current `index.html` appears in the new page, apart from removed UI chrome.
11. **Quality:** no console errors, Lighthouse mobile Performance ≥ 90 and Accessibility ≥ 95, and a GitHub link is present.
12. **Robustness:**
    - Spam-clicking boxes and mashing keys during moves never leaves the camera, URL and visible section out of sync.
    - With the GSAP request blocked, every section is still reachable.
    - Resizing while zoomed keeps the object framed.
    - With the photo blocked, the desk is still reached in under 4 s.

## 6. Decided in conversation

- Concept is Viewfinder: opening, then desk as menu, then zoom into sections. The object-to-section mapping is in §4.2.
- The desk is a drawing, not a photo.
- The look is a dark camera style. Contact is the cream letter.
- The light/dark toggle is removed.
- Stack stays plain HTML/CSS/JS on Vercel, plus GSAP. It replaces the current site at the same URL.
- The opening plays once per visitor and is skippable. Deep links skip it.
- Every section has its own link. Back zooms out, and the arrows hop between sections.
- Content stays the same as now, plus GitHub and CV links.
- Must-haves: real HTML text, full keyboard use, reduced motion handled, fast.
- Phones get a vertically stacked desk with tap-to-zoom.

**Builder's calls already made** (marked so they can be challenged):
- The "↺ replay intro" control.
- The versioned storage key.
- The CV link is added by hand once the PDF exists.
- Static fallback when GSAP doesn't load.
- The mascots are dropped.
- Hop is a single camera move.
- The OG image and favicon.
- Branch, preview, then merge as the release path.
- Dev-only test tooling is allowed.

## 7. Left to the builder

- File and module structure, and the state-machine implementation.
- Exact easings and timings, within ±20% of the values above.
- Illustration detail and polish, and the portrait desk arrangement.
- Section layouts and HUD micro-details.
- Test tooling, as long as §5 is covered automatically.
- OG image production.
- The wording of the decor hover quips.

## 8. References

- **Clickable mockup** (throwaway, not committed): `.superpowers/brainstorm/75423-1792567087/content/viewfinder-flow.html`.
  - It's served by the brainstorm companion and loads the photo from `/files/pfp.jpg`.
  - It shows the opening, the desk, the zoom maths, the per-section overlays and the HUD.
  - It doesn't cover: no-JS, accessibility, history, the mobile layout, real section content.
- **Current site:** commit `ab6b1f5` (`index.html`, `styles.css`, `script.js`).
