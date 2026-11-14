# Ottomila — expeditions to the eight-thousanders · design

Portfolio demo (2026-11-14). The site of a fictional expedition company from Bolzano that leads climbs on Everest, K2, Manaslu and Ama Dablam. The visual carries it: real terrain from satellite elevation data, drawn as a living topographic map. Booking is by phone only; no backend. Labelled as a demo on every page.

## Goals
- In 5 seconds a visitor feels the scale and the challenge: "this is serious, could I do it?". The copy presses on ambition without lying.
- Every mountain, height, camp and statistic is real and sourced; the company, its prices, dates and phone are invented and said to be.
- Smooth on an average laptop; usable on a phone; a still, readable page under reduced motion or without WebGL.

## Brand
- **OTTOMILA** (Italian "eight thousand"), Bolzano, South Tyrol. Phone `+39 0471 000 849` (fictional), shown large, every call button is `tel:`.
- Languages: Italian, English, Ukrainian. Default by browser (`it` → IT, `uk`/`ru` → UK, else EN), switch, choice in localStorage. Keys equal in all three (test).

## Look (mock C)
- Dark map ground (#0b0f0d), light ink (#e6e9e4), soft ink (#9aa39b), one accent: signal orange (#ff6d1f). No second accent.
- Terrain as a topographic map: hillshade in greys, 50 m contours thin, 500 m index contours orange, snow lighter above ~5600 m.
- Type: IBM Plex Sans Condensed (display and text) + IBM Plex Mono (labels, numbers, coordinates). Both have Cyrillic.
- Dossier language: file numbers, stamps (CLEARED / DENIED / BY INVITATION), coordinates, scale bar, legend. Square corners.

## Mountains (four "files")
| File | Mountain | Height | Region | Route shown | Level |
| --- | --- | --- | --- | --- | --- |
| 01 | Everest | 8849 m | Khumbu, Nepal | South Col | III |
| 02 | K2 | 8611 m | Karakoram, Pakistan | Abruzzi Spur | IV · by invitation |
| 03 | Manaslu | 8163 m | Gorkha, Nepal | Northeast Face (normal route) | II |
| 04 | Ama Dablam | 6812 m | Khumbu, Nepal | Southwest Ridge | I |

For each: summit coordinates, base camp and camps with heights (from sources), first ascent (year, who), season, typical days on the mountain, key facts. Sources are listed in the footer and in `src/content/sources.ts`.

## Pages
### Home `/`
1. **Card index** — four file tabs; the selected file's terrain fills the stage as a live topo map, with the summit pinned and its line ("8611 m · Abruzzi Spur · Level IV"). Switching a tab crossfades to the other mountain. First screen also says what the company does and shows the phone.
2. **The ladder** — levels I–IV: mountain, height, weeks, who we take. K2 stamped BY INVITATION.
3. **Clearance ("Допуск")** — the live thing. Four questions: highest altitude reached (under 5000 / 5000–6500 / 6500–8000 / over 8000), eight-thousander summited (no / yes), weeks available (4 / 6 / 9+), training per week (under 3 h / 3–6 h / over 6 h). Result: a stamp per file, CLEARED or DENIED with the one reason that blocks it, and a call button. Pure function, no data leaves the browser.
4. **How we climb** — guiding ratio, oxygen policy, acclimatisation rotations, turnaround times, our Sherpa and Balti partners paid and insured. No invented people, no reviews.
5. Questions (6–8), the phone again, footer with sources, picture credits, demo note, author link.

### File page `/everest`, `/k2`, `/manaslu`, `/ama-dablam`
- Desktop: the terrain is fixed on the left (or full-bleed behind), the dossier scrolls on the right. Phone: terrain on top, dossier below.
- **The climb**: scrolling moves the camera along the route, camp by camp. Each camp shows day, height, oxygen as a share of sea level (computed from the standard barometric formula, rounded), and two lines of what happens there.
- Then: who we take (requirements), season, dates and price "from" (invented, labelled), included / not included, gear list, the risks stated honestly with sourced figures, clearance for this file, call.

## Terrain
- Copernicus GLO-30 DEM, a 20 km square around each summit, baked offline (`tools/bake.mjs`) to a 16-bit greyscale PNG (768×768 desktop, 384×384 phone) plus JSON (min/max metres, bounds, size). Loaded only where shown.
- Drawn with three.js: one plane, heights in a vertex texture or baked into geometry, contour shader (derivative-based lines), hillshade, light snow tint. Vertical exaggeration 1.1.
- Camera paths: per file, a list of camera stops at the camps (position, target), eased with damping; home uses a slow orbit per mountain.
- One render loop, stopped when the canvas is off screen or the tab is hidden; quality governor (pixel ratio steps) like Tau Ceti; no WebGL → a pre-rendered still of the map.
- Reduced motion: no camera travel; camps switch with a fade.

## Pictures
At least four real photographs of the mountains from Wikimedia Commons / NASA (CC0, PD, CC BY, CC BY-SA), credited. Never presented as the company's own trips.

## Stack
Vite + TypeScript, no framework, three.js. Hash-free routing with one `index.html` per page (multi-page Vite build) so GitHub Pages serves each file page at its own path. Public repo `YehorSS/ottomila`, no assistant or tool credits. Deploy by GitHub Actions to `https://yehorss.github.io/ottomila/`.

## Checks
- Unit tests: clearance rules (every combination gives a stamp per file and a reason for each DENIED), oxygen formula (sea level 100%, 8849 m ≈ 33%), i18n key and placeholder parity, content completeness (every file has camps ascending in height and sources), heightmap decode (16-bit round trip).
- Screens at 1440 / 390 in all three languages, no horizontal scroll; design inspector 0 FAIL; FPS check in Chrome; reduced-motion and no-WebGL pages readable.

## Not doing
Online booking, payments, accounts, a blog, invented guides or reviews, live weather.
