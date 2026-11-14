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
