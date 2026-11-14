import { describe, expect, it } from 'vitest';
import { makeArea, toXZ, heightAt, SIZE } from '../src/terrain/geo';
import { placeCamps, cameraStops, damp } from '../src/terrain/camera';
import { MOUNTAINS } from '../src/content/mountains';

// a synthetic cone: 4000 m at the edges, 8000 m in the middle
const n = 65;
const hs = new Float32Array(n * n);
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
  const d = Math.hypot(r - 32, c - 32) / 32;
  hs[r * n + c] = 8000 - 4000 * Math.min(1, d);
}
const area = makeArea({ id: 'cone', n, min: 4000, max: 8000, sizeM: 20000, lat: 10, lon: 20, half: 0.09, lonHalf: 0.09 / Math.cos(10 * Math.PI / 180) }, hs);
const mountain = {
  ...MOUNTAINS.everest,
  height: 8000,
  summit: { lat: 10, lon: 20 },
  path: [[9.92, 20], [10, 20]] as [number, number][],
  camps: [5000, 6000, 7000, 8000].map((height, i) => ({ ...MOUNTAINS.everest.camps[i], height })),
};

describe('geo', () => {
  it('puts the centre of the area at the origin and reads its height', () => {
    const [x, z] = toXZ(area, 10, 20);
    expect(Math.abs(x)).toBeLessThan(1e-9);
    expect(Math.abs(z)).toBeLessThan(1e-9);
    expect(heightAt(area, 0, 0)).toBeGreaterThan(heightAt(area, SIZE / 3, 0));
  });
});

describe('camps', () => {
  it('sit on the route at their own height, climbing towards the summit', () => {
    const camps = placeCamps(area, mountain);
    expect(camps).toHaveLength(4);
    camps.forEach((p, i) => expect(Math.abs(p.metres - mountain.camps[i].height)).toBeLessThan(260));
    for (let i = 1; i < camps.length; i++) expect(Math.abs(camps[i].z)).toBeLessThan(Math.abs(camps[i - 1].z) + 1e-9);
  });
});

describe('camera stops', () => {
  it('starts with an overview, then one stop per camp looking at it', () => {
    const camps = placeCamps(area, mountain);
    const stops = cameraStops(area, camps);
    expect(stops).toHaveLength(camps.length + 1);
    stops.slice(1).forEach((s, i) => {
      const c = camps[i];
      expect(Math.hypot(s.target[0] - c.x, s.target[2] - c.z)).toBeLessThan(2);
      expect(s.pos[1]).toBeGreaterThan(c.y);
    });
  });

  it('damping reaches the target and never overshoots', () => {
    let v = 0;
    for (let i = 0; i < 300; i++) { const nv = damp(v, 10, 4, 1 / 60); expect(nv).toBeLessThanOrEqual(10); v = nv; }
    expect(v).toBeGreaterThan(9.99);
  });
});
