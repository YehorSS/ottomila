import {
  ColorManagement, LinearSRGBColorSpace, BufferGeometry, CatmullRomCurve3, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, TubeGeometry, Vector3, WebGLRenderer,
} from 'three';
import type { FileId, Mountain } from '../content/mountains';
import { loadHeights, type AreaMeta } from './decode';
import { makeArea, SIZE, EXAG, type Area } from './geo';
import { cameraStops, damp, placeCamps, routeLine, type Point, type Stop } from './camera';
import { drawStill, topoMaterial } from './material';
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

export interface TerrainView {
  show(m: Mountain, labels: string[]): Promise<void>;
  setStop(i: number): void;
  setLabels(labels: string[]): void;
  /** slow turn around the overview, for the home page */
  setOrbit(on: boolean): void;
  readonly camps: Point[];
}

export function mountTerrain(canvas: HTMLCanvasElement, overlay: HTMLElement, opts: { reduced: boolean; small: boolean; shift?: number }): TerrainView {
  let renderer: WebGLRenderer | null = null;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch { renderer = null; }

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.05, 200);
  const material = topoMaterial();
  let terrain: Mesh | null = null, route: Mesh | null = null;
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
        t += dt * 0.05;
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
      overlay.appendChild(el);
      return el;
    });
    placePins();
  }

  async function show(m: Mountain, labels: string[]) {
    const area = await loadArea(m.id, opts.small);
    camps = placeCamps(area, m);
    stops = cameraStops(area, camps);
    if (!renderer) {
      // no WebGL: a flat hillshade map with the camps on it
      const still = document.createElement('canvas');
      still.className = 'still';
      drawStill(still, area.h, area.n);
      overlay.querySelector('.still')?.remove();
      overlay.prepend(still);
      return;
    }
    if (terrain) { scene.remove(terrain); terrain.geometry.dispose(); }
    if (route) { scene.remove(route); route.geometry.dispose(); }
    const geo = new PlaneGeometry(SIZE, SIZE, area.n - 1, area.n - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) pos.setY(i, (area.h[i] / 1000) * EXAG);
    geo.computeVertexNormals();
    terrain = new Mesh(geo, material);
    scene.add(terrain);
    const line = routeLine(area, m, 600).map(p => new Vector3(p.x, p.y + 0.03, p.z));
    route = new Mesh(new TubeGeometry(new CatmullRomCurve3(line), 800, 0.02, 6) as BufferGeometry, new MeshBasicMaterial({ color: '#ff6d1f' }));
    scene.add(route);
    setLabels(labels);
    first = true;
    fit();
    request();
  }

  if (renderer) { renderer.outputColorSpace = LinearSRGBColorSpace; renderer.toneMapping = 0; renderer.setClearColor('#0b0f0d'); }

  return {
    show,
    setStop(i) { stop = Math.max(0, Math.min(stops.length - 1, i)); request(); },
    setLabels,
    setOrbit(on) { orbit = on; request(); },
    get camps() { return camps; },
  };
}
