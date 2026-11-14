// Bakes a 20 km square of Copernicus GLO-30 terrain around each summit into 16-bit PNGs (R = high byte, G = low byte).
// Tiles are expected in mock/dem/ (download from copernicus-dem-30m.s3.amazonaws.com). node tools/bake.mjs
import { fromFile } from 'geotiff';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const HALF = 0.09; // degrees of latitude: about 10 km each way
const AREAS = {
  // centres shifted from the summit where a tile edge would cut the view
  'ama-dablam': { lat: 27.858, lon: 86.852 },
  manaslu: { lat: 28.565, lon: 84.585 },
  everest: { lat: 27.9881, lon: 86.885 },
  k2: { lat: 35.8700, lon: 76.5133 },
};
const SIZES = [768, 384];

const cache = new Map();
async function tile(lat, lon) {
  const name = `N${String(lat).padStart(2, '0')}_00_E${String(lon).padStart(3, '0')}_00`;
  if (!cache.has(name)) {
    const img = await (await fromFile(`mock/dem/${name}.tif`)).getImage();
    const [data] = await img.readRasters();
    cache.set(name, { data, w: img.getWidth(), h: img.getHeight() });
  }
  return cache.get(name);
}

async function height(lat, lon) {
  const tl = Math.floor(lat), tn = Math.floor(lon);
  const t = await tile(tl, tn);
  const y = (tl + 1 - lat) * t.h, x = (lon - tn) * t.w;
  const x0 = Math.min(t.w - 2, Math.floor(x)), y0 = Math.min(t.h - 2, Math.floor(y));
  const fx = x - x0, fy = y - y0, d = t.data, w = t.w;
  return (d[y0 * w + x0] * (1 - fx) + d[y0 * w + x0 + 1] * fx) * (1 - fy) + (d[(y0 + 1) * w + x0] * (1 - fx) + d[(y0 + 1) * w + x0 + 1] * fx) * fy;
}

mkdirSync('public/terrain', { recursive: true });
for (const [id, a] of Object.entries(AREAS)) {
  const lonHalf = HALF / Math.cos(a.lat * Math.PI / 180);
  const N = SIZES[0];
  const hs = new Float32Array(N * N);
  let min = Infinity, max = -Infinity;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const h = await height(a.lat + HALF - (2 * HALF * r) / (N - 1), a.lon - lonHalf + (2 * lonHalf * c) / (N - 1));
    hs[r * N + c] = h; if (h < min) min = h; if (h > max) max = h;
  }
  min = Math.floor(min); max = Math.ceil(max);
  for (const n of SIZES) {
    const px = Buffer.alloc(n * n * 3);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const h = hs[Math.round(r * (N - 1) / (n - 1)) * N + Math.round(c * (N - 1) / (n - 1))];
      const v = Math.round(((h - min) / (max - min)) * 65535);
      const i = (r * n + c) * 3;
      px[i] = v >> 8; px[i + 1] = v & 255; px[i + 2] = 0;
    }
    await sharp(px, { raw: { width: n, height: n, channels: 3 } }).png({ compressionLevel: 9, palette: false }).toFile(`public/terrain/${id}-${n}.png`);
  }
  const meta = { id, n: N, min, max, sizeM: Math.round(2 * HALF * 111320), lat: a.lat, lon: a.lon, half: HALF, lonHalf };
  writeFileSync(`public/terrain/${id}.json`, JSON.stringify(meta));
  console.log(id, { min, max });
}
