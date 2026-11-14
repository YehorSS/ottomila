import type { AreaMeta } from './decode';

/** The terrain square is SIZE km across; heights are stretched by EXAG so ridges read at a distance. */
export const SIZE = 20;
export const EXAG = 1.1;

export interface Area extends AreaMeta { h: Float32Array }
export const makeArea = (meta: AreaMeta, h: Float32Array): Area => ({ ...meta, h });

/** km from the centre of the square: x east, z south (row 0 of the map is north). */
export function toXZ(a: Area, lat: number, lon: number): [number, number] {
  return [((lon - a.lon) / a.lonHalf) * (SIZE / 2), ((a.lat - lat) / a.half) * (SIZE / 2)];
}

/** Terrain height in metres at a point, bilinear. */
export function heightAt(a: Area, x: number, z: number): number {
  const n = a.n;
  const fc = Math.max(0, Math.min(n - 1.001, (x / SIZE + 0.5) * (n - 1)));
  const fr = Math.max(0, Math.min(n - 1.001, (z / SIZE + 0.5) * (n - 1)));
  const c = Math.floor(fc), r = Math.floor(fr), u = fc - c, v = fr - r;
  const h = a.h;
  return (h[r * n + c] * (1 - u) + h[r * n + c + 1] * u) * (1 - v) + (h[(r + 1) * n + c] * (1 - u) + h[(r + 1) * n + c + 1] * u) * v;
}

export const worldY = (metres: number) => (metres / 1000) * EXAG;
