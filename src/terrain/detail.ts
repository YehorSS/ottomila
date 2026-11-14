// Detail the data cannot give, drawn from what it does give: smooth heights between the 30 m samples,
// and how much sky each point sees (deep gullies darker, ridges open).

const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

/** Four neighbours along a line; past the ends they continue the slope instead of repeating the edge. */
function four(get: (i: number) => number, i: number, n: number): [number, number, number, number] {
  const a = get(Math.min(n - 1, i)), b = get(Math.min(n - 1, i + 1));
  const before = i - 1 >= 0 ? get(i - 1) : 2 * a - b;
  const after = i + 2 <= n - 1 ? get(i + 2) : 2 * b - a;
  return [before, a, b, after];
}

/** Catmull-Rom resample of an n×n grid onto m×m; original points are kept exactly where they line up. */
export function upsample(h: Float32Array, n: number, m: number): Float32Array {
  const k = (n - 1) / (m - 1);
  const rows = new Float32Array(n * m);
  for (let r = 0; r < n; r++) for (let j = 0; j < m; j++) {
    const x = j * k, c = Math.min(n - 2, Math.floor(x)), t = x - c;
    rows[r * m + j] = cr(...four(i => h[r * n + i], c, n), t);
  }
  const out = new Float32Array(m * m);
  for (let i = 0; i < m; i++) {
    const y = i * k, r = Math.min(n - 2, Math.floor(y)), t = y - r;
    for (let j = 0; j < m; j++) out[i * m + j] = cr(...four(q => rows[q * m + j], r, n), t);
  }
  return out;
}

/** Horizon-based sky visibility per cell, 0 (closed in) to 1 (open sky). cell = metres between samples. */
export function occlusion(h: Float32Array, n: number, cell: number): Float32Array {
  const out = new Float32Array(n * n);
  const dirs = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
  const steps = [1, 2, 4, 8, 16, 32];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const h0 = h[r * n + c];
    let shut = 0;
    for (const [dx, dy] of dirs) {
      let best = 0;
      for (const s of steps) {
        const rr = Math.round(r + dy * s), cc = Math.round(c + dx * s);
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) break;
        const rise = (h[rr * n + cc] - h0) / (s * cell * Math.hypot(dx, dy));
        if (rise > best) best = rise;
      }
      shut += best / Math.sqrt(1 + best * best); // sine of the horizon angle
    }
    out[r * n + c] = Math.max(0, Math.min(1, 1 - shut / dirs.length));
  }
  return out;
}

export interface Surface { y: Float32Array; normal: Float32Array; ao: Float32Array }

/** The whole terrain mesh data on an m×m grid: world heights, normals and sky visibility. Heavy, so it runs in a worker. */
export function buildSurface(h: Float32Array, n: number, m: number, cellM: number, size: number, exag: number): Surface {
  const hs = upsample(h, n, m);
  const ao = upsample(occlusion(h, n, cellM), n, m).map(v => Math.max(0, Math.min(1, v)));
  const y = hs.map(v => (v / 1000) * exag);
  const normal = new Float32Array(m * m * 3), d = size / (m - 1);
  for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) {
    const i = r * m + c;
    const c0 = Math.max(0, c - 1), c1 = Math.min(m - 1, c + 1), r0 = Math.max(0, r - 1), r1 = Math.min(m - 1, r + 1);
    // a heightfield's normal: (-dy/dx, 1, -dy/dz); rows run along +z, columns along +x
    const nx = -(y[r * m + c1] - y[r * m + c0]) / ((c1 - c0) * d), nz = -(y[r1 * m + c] - y[r0 * m + c]) / ((r1 - r0) * d);
    const l = Math.hypot(nx, 1, nz);
    normal[i * 3] = nx / l; normal[i * 3 + 1] = 1 / l; normal[i * 3 + 2] = nz / l;
  }
  return { y, normal, ao };
}
