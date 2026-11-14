import { describe, expect, it } from 'vitest';
import { occlusion, upsample } from '../src/terrain/detail';

const grid = (n: number, f: (r: number, c: number) => number) => { const a = new Float32Array(n * n); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) a[r * n + c] = f(r, c); return a; };

describe('upsample', () => {
  it('keeps the original heights where the grids meet and stays smooth between', () => {
    const n = 9, h = grid(n, (r, c) => 1000 + r * 10 + c * c);
    const m = 17, u = upsample(h, n, m);
    // every second point of the fine grid sits on an original point
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) expect(u[(r * 2) * m + c * 2]).toBeCloseTo(h[r * n + c], 3);
    // a linear ramp stays linear between nodes
    const ramp = upsample(grid(n, (r) => r * 10), n, m);
    expect(ramp[1 * m + 4]).toBeCloseTo(5, 3);
  });
});

describe('occlusion', () => {
  it('darkens a pit and leaves a peak open', () => {
    const n = 33;
    const pit = occlusion(grid(n, (r, c) => Math.hypot(r - 16, c - 16) * 40), n, 30);
    const peak = occlusion(grid(n, (r, c) => -Math.hypot(r - 16, c - 16) * 40), n, 30);
    expect(pit[16 * n + 16]).toBeLessThan(0.6);
    expect(peak[16 * n + 16]).toBeGreaterThan(0.95);
    for (const v of pit) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  });
});
