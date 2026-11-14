# Ottomila Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for tracking. Execute task by task, test first.

**Goal:** A static IT/EN/UK site for a fictional expedition company with four mountain files drawn as live topographic maps from real elevation data, a clearance quiz, and phone booking.

**Architecture:** Vite multi-page build (home + four file pages from one template), TypeScript without a framework, three.js for the terrain. Content (mountains, camps, sources) lives in typed modules; pure logic (clearance, oxygen, camera path) is unit-tested. Heightmaps are baked offline from Copernicus tiles into 16-bit PNGs.

**Tech Stack:** Vite 8, TypeScript 5.9, three 0.187, Vitest 4.1 + jsdom, sharp (bake), geotiff (bake).

**Spec:** `docs/spec.md`

## Global Constraints
- Base path `/ottomila/`; pages `/`, `/everest/`, `/k2/`, `/manaslu/`, `/ama-dablam/`.
- Palette: ground #0b0f0d, ink #e6e9e4, soft #9aa39b, accent #ff6d1f only. Fonts IBM Plex Sans Condensed + IBM Plex Mono.
- Languages it / en / uk; localStorage key `om-lang`; keys and `{placeholders}` equal (test).
- Phone `+39 0471 000 849`, every call link `tel:+390471000849`. Prices, dates, phone and company marked as fictional on every page.
- Every fact about a mountain has an entry in `src/content/sources.ts`.
- No assistant or tool credits in commits or files.
- Reduced motion: no camera travel. No WebGL: still image of the map.

## Review Focus
1. A file page opened directly (deep link) on GitHub Pages loads its own heightmap and text, not the home's. (Task 6 build check)
2. Clearance with the lowest answers clears nothing but Level I and says why for each DENIED; with the highest, K2 still says "by invitation, call". (Task 2 test)
3. Language switch on a file page re-renders camp labels in the 3D overlay, not only the text column. (Task 6 manual check)
4. Tab hidden or canvas scrolled away → no frames drawn. (Task 4 check in Chrome)
5. Phone layout: terrain and dossier never overlap; no horizontal scroll at 390 px in Ukrainian (longest strings). (Task 7 screens)

---

### Task 1: Scaffold, content and facts
**Files:** `package.json`, `vite.config.ts` (multi-page inputs), `tsconfig.json`, `src/content/{mountains.ts,sources.ts}`, `src/i18n.ts`, `tests/{content,i18n}.test.ts`
**Produces:** `type FileId = 'everest'|'k2'|'manaslu'|'ama-dablam'`; `MOUNTAINS: Record<FileId, Mountain>` with `{ no, level, height, summit:{lat,lon}, region:Text, route:Text, firstAscent:{year, by:Text}, season:Text, weeks, group, priceFrom /*EUR, fictional*/, camps: Camp[], requirements: Text[], included: Text[], excluded: Text[], gear: Text[], risks: Text[], sources: string[] }`, `Camp = { name:Text, height, day, lat, lon, note:Text }`; `t(lang, key, vars)`.
- [ ] Research each mountain's facts (heights, camps, first ascents, risk figures) from reliable sources; record URLs in `sources.ts`.
- [ ] Tests: every file has ≥4 camps with strictly rising heights ending at the summit height; every Text has it/en/uk non-empty; every `sources` id exists; i18n parity. FAIL → implement → PASS → commit.

### Task 2: Clearance and oxygen
**Files:** `src/clearance.ts`, `src/oxygen.ts`, `tests/{clearance,oxygen}.test.ts`
**Produces:** `oxygenShare(heightM): number` (barometric, sea level 1.0); `clear(answers): Record<FileId, { ok: boolean; reason?: ReasonKey }>` with rules: Ama Dablam needs ≥5000 m and ≥4 weeks; Manaslu needs ≥6000 m (6500 band) and ≥6 weeks and training ≥3 h; Everest needs an 8000er or ≥6500–8000 band with training >6 h, and 9+ weeks; K2 needs an 8000er, 9+ weeks, training >6 h, and is always "by invitation" (ok means "call us").
- [ ] Tests: 8849 m → 0.32–0.34; every answer combination returns four results; lowest answers deny all four, each with a reason; mid answers clear I and II; full answers clear all four, K2 with the invitation note. FAIL → implement → PASS → commit.

### Task 3: Terrain bake
**Files:** `tools/bake.mjs`, `public/terrain/<id>-{768,384}.png` + `<id>.json`, `src/terrain/decode.ts`, `tests/decode.test.ts`
**Produces:** `decodeHeights(rgba: Uint8ClampedArray, w, h, min, max): Float32Array` (16-bit in R=hi, G=lo).
- [ ] Download tiles: N27E086 (Everest, Ama Dablam), N28E086, N35E076 (K2), N28E084 (Manaslu); crop 20 km squares; write 16-bit PNG and JSON {min,max,sizeM,bounds}.
- [ ] Test decode round-trip within 0.2 m. FAIL → implement → PASS → commit (PNGs ≤ 1.2 MB each).

### Task 4: Terrain renderer
**Files:** `src/terrain/{scene.ts,material.ts,camera.ts,quality.ts}`, `tests/camera.test.ts`
**Produces:** `mountTerrain(canvas, opts) → { show(id), goTo(stop:number), setLang(), destroy() }`; `cameraStops(mountain, area): Stop[]`; contour material (50/500 m), hillshade, snow tint; one rAF loop, IntersectionObserver + visibility stop; governor copied from Tau Ceti; `webglcontextlost` → still.
- [ ] Tests: stops are ordered by camp, each stop looks at its camp, damping converges. Then look in Chrome at all four mountains. Commit.

### Task 5: Home
**Files:** `index.html`, `src/home.ts`, `src/ui/{header,footer,clearance-form}.ts`, `src/styles/*.css`
- [ ] Card index with tabs, ladder, clearance form with stamps, how we climb, FAQ, call, footer with sources and credits. Run design-taste-frontend draw for type steps within the mock C direction; screens at 1440/390.
- [ ] Commit.

### Task 6: File pages
**Files:** `file.html` template → `everest/index.html`, … via Vite inputs, `src/file.ts`
- [ ] Sticky terrain + scrolling dossier; scroll position → camp stop; overlay labels in current language; sections per spec; clearance for this file.
- [ ] Build check: `dist/ottomila/k2/index.html` loads `terrain/k2-*.png`. Commit.

### Task 7: Pictures, polish, checks
- [ ] ≥4 credited mountain photos; reduced-motion and no-WebGL paths; inspector 0 FAIL on home and one file; screens in it/en/uk at 1440 and 390; FPS in Chrome. Commit.

### Task 8: Deploy and record
- [ ] Repo `YehorSS/ottomila`, Pages via Actions, live check of all five paths.
- [ ] GEKKO-MO: add a WEB record. Obsidian: `Ottomila — горы.md`, `Все проекты.md`.
