import type { Mountain } from '../content/mountains';
import { heightAt, toXZ, worldY, type Area } from './geo';

export interface Point { x: number; y: number; z: number; metres: number }
export interface Stop { pos: [number, number, number]; target: [number, number, number] }

/** The route as a dense line on the ground, from base camp to the summit. */
export function routeLine(a: Area, m: Pick<Mountain, 'path' | 'summit'>, samples = 400): Point[] {
  const pts = m.path.map(([lat, lon]) => toXZ(a, lat, lon));
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((s, d) => s + d, 0);
  const out: Point[] = [];
  for (let k = 0; k <= samples; k++) {
    let d = (k / samples) * total, i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const t = seg[i] ? d / seg[i] : 0;
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, z = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    const metres = heightAt(a, x, z);
    out.push({ x, z, metres, y: worldY(metres) });
  }
  return out;
}

/** Each camp goes where the route first reaches its height; the last one is the summit itself. */
export function placeCamps(a: Area, m: Pick<Mountain, 'path' | 'summit' | 'camps'>): Point[] {
  const line = routeLine(a, m);
  const out: Point[] = [];
  let from = 0;
  m.camps.forEach((camp, i) => {
    if (i === m.camps.length - 1) {
      const [x, z] = toXZ(a, m.summit.lat, m.summit.lon);
      const metres = heightAt(a, x, z);
      out.push({ x, z, metres, y: worldY(metres) });
      return;
    }
    let j = line.findIndex((p, k) => k >= from && p.metres >= camp.height);
    // the smoothed terrain can sit lower than a camp's height; then take the highest point still ahead
    if (j < 0) { j = from; for (let k = from; k < line.length - 1; k++) if (line[k].metres > line[j].metres) j = k; }
    from = Math.min(line.length - 2, j + 1);
    out.push(line[j]);
  });
  return out;
}

/** An overview of the whole route, then one stop behind and above each camp, looking up the route. */
export function cameraStops(a: Area, camps: Point[]): Stop[] {
  const top = camps[camps.length - 1], first = camps[0];
  const cx = camps.reduce((s, p) => s + p.x, 0) / camps.length, cz = camps.reduce((s, p) => s + p.z, 0) / camps.length;
  const cy = camps.reduce((s, p) => s + p.y, 0) / camps.length;
  let ox = first.x - top.x, oz = first.z - top.z;
  const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
  // the overview looks down steeply, like a map on a table
  // far enough back to hold the whole route, whatever its length
  const span = Math.max(4, ...camps.map(p => Math.hypot(p.x - cx, p.z - cz))) * 2;
  const stops: Stop[] = [{ pos: [cx + ox * span * 1.0 - oz * span * 0.3, cy + span * 2.1, cz + oz * span * 1.0 + ox * span * 0.3], target: [cx, cy - 0.3, cz] }];
  camps.forEach((c, i) => {
    const next = camps[Math.min(i + 1, camps.length - 1)], prev = camps[Math.max(i - 1, 0)];
    let dx = (i < camps.length - 1 ? next.x - c.x : c.x - prev.x), dz = (i < camps.length - 1 ? next.z - c.z : c.z - prev.z);
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const px = c.x - dx * 4.6 - dz * 2.2, pz = c.z - dz * 4.6 + dx * 2.2;
    // stay above the ground under the camera as well as above the camp
    const py = Math.max(c.y, worldY(heightAt(a, px, pz))) + 3.4;
    stops.push({ pos: [px, py, pz], target: [c.x + dx * 0.7, c.y + 0.15, c.z + dz * 0.7] });
  });
  return stops;
}

/** Frame-rate independent easing towards a target. */
export const damp = (cur: number, target: number, lambda: number, dt: number) => target + (cur - target) * Math.exp(-lambda * Math.min(dt, 0.1));
