import {
  ColorManagement, LinearSRGBColorSpace, BufferGeometry, TextureLoader, NoColorSpace, RepeatWrapping, type Texture, CatmullRomCurve3, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, TubeGeometry, Vector3, WebGLRenderer,
} from 'three';
import type { FileId, Mountain } from '../content/mountains';
import { loadHeights, type AreaMeta } from './decode';
import { makeArea, SIZE, EXAG, type Area } from './geo';
import { cameraStops, damp, placeCamps, routeLine, type Point, type Stop } from './camera';
import { drawStill, topoMaterial } from './material';
import { buildSurface, type Surface } from './detail';
import { BufferAttribute } from 'three';
import { Governor } from './quality';

const BASE = import.meta.env.BASE_URL;
// the map colours are written as sRGB and shown as is
ColorManagement.enabled = false;
const cache = new Map<FileId, Promise<Area>>();

/** Heightmap of one mountain, fetched once per page. */
export function loadArea(id: FileId, small: boolean): Promise<Area> {
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      const meta: AreaMeta = await (await fetch(`${BASE}terrain/${id}.json`)).json();
      const n = small ? 384 : 768;
      const h = await loadHeights(`${BASE}terrain/${id}-${n}.png`, meta);
      return makeArea({ ...meta, n }, h);
    })());
  }
  return cache.get(id)!;
}

const sats = new Map<FileId, Promise<Texture | null>>();
/** The satellite image draped on the terrain; null if it fails to load (the plain map stays). */
export const satUrl = (id: FileId, small: boolean) => `${BASE}terrain/${id}-sat-${small ? 1024 : 2048}.webp`;
function loadSat(id: FileId, small: boolean): Promise<Texture | null> {
  if (!sats.has(id)) sats.set(id, new TextureLoader().loadAsync(satUrl(id, small)).then(t => { t.colorSpace = NoColorSpace; t.anisotropy = 8; return t; }, () => null));
  return sats.get(id)!;
}

// the heavy mesh maths runs off the main thread, once per mountain; switching back is instant
let worker: Worker | null = null, jobs = 0;
const waiting = new Map<number, (s: Surface) => void>();
const surfaces = new Map<string, Promise<Surface>>();
function surface(id: FileId, area: Area, m: number): Promise<Surface> {
  const key = `${id}-${m}`;
  if (!surfaces.has(key)) surfaces.set(key, new Promise<Surface>(done => {
    const cell = area.sizeM / (area.n - 1);
    try {
      worker ??= new Worker(new URL('./build.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<Surface & { id: number }>) => { waiting.get(e.data.id)?.(e.data); waiting.delete(e.data.id); };
      const job = ++jobs;
      waiting.set(job, done);
      worker.postMessage({ id: job, h: area.h.slice(), n: area.n, m, cell, size: SIZE, exag: EXAG });
    } catch {
      done(buildSurface(area.h, area.n, m, cell, SIZE, EXAG));
    }
  }));
  return surfaces.get(key)!;
}

let detailTex: Promise<(Texture | null)[]> | null = null;
/** The three close-range textures, shared by every mountain; repeated, mipmapped. */
function loadDetail(): Promise<(Texture | null)[]> {
  detailTex ??= Promise.all(['rock', 'snow', 'field'].map(n => new TextureLoader().loadAsync(`${BASE}terrain/detail-${n}.webp`).then(t => {
    t.colorSpace = NoColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 8; return t;
  }, () => null)));
  return detailTex;
}

export interface TerrainView {
  show(m: Mountain, labels: string[]): Promise<void>;
  setStop(i: number): void;
  setLabels(labels: string[]): void;
  /** slow turn around the overview, for the home page */
  setOrbit(on: boolean): void;
  /** fetch and build these mountains in the background, so switching to them is quick */
  preload(ids: FileId[]): void;
  readonly camps: Point[];
}

export function mountTerrain(canvas: HTMLCanvasElement, overlay: HTMLElement, opts: { reduced: boolean; small: boolean; shift?: number; onPick?: (i: number) => void }): TerrainView {
  let renderer: WebGLRenderer | null = null;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch { renderer = null; }

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.05, 200);
  const material = topoMaterial();
  let terrain: Mesh | null = null, route: Mesh | null = null;
  let held = false;
  let stops: Stop[] = [], stop = 0, orbit = false, camps: Point[] = [], pins: HTMLElement[] = [];
  const cur = { pos: new Vector3(0, 20, 20), target: new Vector3() };
  let first = true;
  const gov = new Governor(opts.small ? 'low' : 'high');

  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 44 : 32;
    // on wide screens the dossier covers the left; centre the map in what is left
    if (w > 900 && opts.shift) camera.setViewOffset(w, h, -opts.shift * w, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer?.setPixelRatio(Math.min(devicePixelRatio, gov.pixelRatioCap));
    renderer?.setSize(w, h, false);
  };
  gov.onChange(fit);
  new ResizeObserver(() => { fit(); request(); }).observe(canvas);

  // one frame pending at most; the loop sleeps when the view is still, hidden or scrolled away
  let raf = 0, last = performance.now(), visible = true, t = 0;
  // the clock restarts with each request, so a long sleep never reads as a slow frame
  const request = () => { if (!raf && renderer && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); request(); } }).observe(canvas);
  document.addEventListener('visibilitychange', () => { last = performance.now(); request(); });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); renderer = null; canvas.hidden = true; });

  const v = new Vector3();
  function placePins() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const active = stop === 0 ? camps.length - 1 : stop - 1;
    // the summit and the current camp claim their place first; any label that would overlap them is hidden
    const order = [...new Set([camps.length - 1, active, ...camps.keys()])];
    const taken: [number, number, number, number][] = [];
    for (const i of order) {
      const el = pins[i], c = camps[i];
      if (!el || !c) continue;
      v.set(c.x, c.y, c.z).project(camera);
      const x = ((v.x + 1) / 2) * w, y = ((1 - v.y) / 2) * h;
      // near the right edge the label turns to the left of its dot
      const lw = el.offsetWidth || 120, left = x + lw > w - 8;
      const box: [number, number, number, number] = left ? [x - lw, y - 10, x + 6, y + 26] : [x - 6, y - 10, x + lw, y + 26];
      const inView = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      const clash = taken.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      el.classList.toggle('left', left);
      el.style.transform = `translate(${left ? Math.max(4, x - lw) : x}px, ${y}px)`;
      el.classList.toggle('hide', !inView || clash);
      el.classList.toggle('on', i === active);
      if (inView && !clash) taken.push(box);
    }
  }

  function frame(now: number) {
    raf = 0;
    if (!renderer) return;
    const ms = Math.max(0, now - last), dt = Math.min(0.1, ms / 1000);
    last = now;
    gov.frame(ms, now);
    const s = stops[stop];
    let moving = false;
    if (s) {
      const p = new Vector3(...s.pos), q = new Vector3(...s.target);
      // a narrow stage needs the overview further back to hold the whole route
      if (stop === 0 && camera.aspect < 1.3) p.sub(q).multiplyScalar(1.3 / Math.max(0.6, camera.aspect)).add(q);
      if (orbit && stop === 0 && !opts.reduced) {
        // the turn pauses under the cursor so a pin can be clicked
        if (!held) t += dt * 0.05;
        const ox = p.x - q.x, oz = p.z - q.z;
        p.x = q.x + ox * Math.cos(t) - oz * Math.sin(t);
        p.z = q.z + ox * Math.sin(t) + oz * Math.cos(t);
        moving = true;
      }
      if (first || opts.reduced) { cur.pos.copy(p); cur.target.copy(q); first = false; }
      else {
        const k = 2.2;
        cur.pos.set(damp(cur.pos.x, p.x, k, dt), damp(cur.pos.y, p.y, k, dt), damp(cur.pos.z, p.z, k, dt));
        cur.target.set(damp(cur.target.x, q.x, k, dt), damp(cur.target.y, q.y, k, dt), damp(cur.target.z, q.z, k, dt));
        moving ||= cur.pos.distanceToSquared(p) > 1e-5 || cur.target.distanceToSquared(q) > 1e-5;
      }
      camera.position.copy(cur.pos);
      camera.lookAt(cur.target);
    }
    renderer.render(scene, camera);
    placePins();
    if (moving) request();
  }

  function setLabels(labels: string[]) {
    overlay.querySelectorAll('.pin').forEach(p => p.remove());
    pins = labels.map((text, i) => {
      const el = document.createElement('div');
      el.className = 'pin' + (i === labels.length - 1 ? ' summit' : '');
      el.innerHTML = text;
      if (opts.onPick) {
        el.addEventListener('click', () => opts.onPick!(i));
        el.addEventListener('pointerenter', () => { held = true; });
        el.addEventListener('pointerleave', () => { held = false; });
      }
      overlay.appendChild(el);
      return el;
    });
    placePins();
  }

  const M = opts.small ? 512 : 1024;
  let shown: FileId | null = null;

  async function show(m: Mountain, labels: string[]) {
    shown = m.id;
    const [area, sat, detail] = await Promise.all([loadArea(m.id, opts.small), renderer ? loadSat(m.id, opts.small) : Promise.resolve(null), renderer ? loadDetail() : Promise.resolve([])]);
    camps = placeCamps(area, m);
    stops = cameraStops(area, camps);
    if (!renderer) {
      // no WebGL: a flat hillshade map with the camps on it
      // the satellite image as a flat map; the drawn relief if even that is missing
      const still = document.createElement('img');
      still.className = 'still';
      still.alt = '';
      still.src = satUrl(m.id, opts.small);
      still.onerror = () => { const cv = document.createElement('canvas'); cv.className = 'still'; drawStill(cv, area.h, area.n); still.replaceWith(cv); };
      overlay.querySelector('.still')?.remove();
      overlay.prepend(still);
      return;
    }
    // a finer, smooth mesh than the data grid, and each point's open sky for the gullies
    const surf = await surface(m.id, area, M);
    if (shown !== m.id) return; // another mountain was picked while this one was building
    if (route) { scene.remove(route); route.geometry.dispose(); }
    // one grid for every mountain: only heights, normals and sky change
    if (!terrain) {
      const g = new PlaneGeometry(SIZE, SIZE, M - 1, M - 1);
      g.rotateX(-Math.PI / 2);
      g.setAttribute('ao', new BufferAttribute(new Float32Array(M * M), 1));
      terrain = new Mesh(g, material);
      terrain.frustumCulled = false; // heights change under a fixed bounding sphere
      scene.add(terrain);
    }
    const geo = terrain.geometry;
    const pos = geo.getAttribute('position') as BufferAttribute, nor = geo.getAttribute('normal') as BufferAttribute, aoA = geo.getAttribute('ao') as BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 1] = surf.y[i];
    (nor.array as Float32Array).set(surf.normal); (aoA.array as Float32Array).set(surf.ao);
    pos.needsUpdate = nor.needsUpdate = aoA.needsUpdate = true;
    const [rock, snow, field] = detail;
    Object.assign(material.uniforms.uRock, { value: rock ?? null }); Object.assign(material.uniforms.uSnowT, { value: snow ?? null }); Object.assign(material.uniforms.uField, { value: field ?? null });
    material.uniforms.uHasDetail.value = rock && snow && field ? 1 : 0;
    material.uniforms.uSat.value = sat;
    material.uniforms.uTexel.value = 1 / (opts.small ? 1024 : 2048);
    material.uniforms.uHasSat.value = sat ? 1 : 0;
    const line = routeLine(area, m, 600).map(p => new Vector3(p.x, p.y + 0.03, p.z));
    route = new Mesh(new TubeGeometry(new CatmullRomCurve3(line), 800, 0.02, 6) as BufferGeometry, new MeshBasicMaterial({ color: '#ff6d1f' }));
    scene.add(route);
    setLabels(labels);
    first = true;
    fit();
    request();
  }

  if (renderer) { renderer.outputColorSpace = LinearSRGBColorSpace; renderer.toneMapping = 0; renderer.setClearColor('#000000', 0); }

  return {
    show,
    setStop(i) { stop = Math.max(0, Math.min(stops.length - 1, i)); request(); },
    setLabels,
    preload(ids) {
      // one after another, so the visible mountain never waits behind them
      void ids.reduce<Promise<unknown>>((p, id) => p.then(() => Promise.all([loadArea(id, opts.small).then(a => renderer ? surface(id, a, M) : null), renderer ? loadSat(id, opts.small) : null])), Promise.resolve());
    },
    setOrbit(on) { orbit = on; request(); },
    get camps() { return camps; },
  };
}
