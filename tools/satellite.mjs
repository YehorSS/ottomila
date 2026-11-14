// Real Sentinel-2 imagery (10 m, true colour) for each terrain square, read straight from the open COGs on AWS.
// Picks a cloud-free autumn scene that covers the whole square, reads only that window, and resamples it
// from UTM onto the heightmap's lat/lon grid. Licence: Copernicus Sentinel data, free with attribution.
// node tools/satellite.mjs [id ...]  → public/terrain/<id>-sat-{2048,1024}.webp + <id>-sat.json (scene id, date)
import { fromUrl } from 'geotiff';
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 2048;
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['ama-dablam', 'manaslu', 'everest', 'k2'];

/** Reflectance (L2A, offset 1000 since 2022, scale 1e-4) to display: a soft curve that leaves snow room to breathe. */
let OFFSET = 0;
const tone = v => { const x = Math.max(0, Math.min(1.2, (v - OFFSET) / 10000)); return Math.min(1, Math.pow(x / 1.05, 0.55)); };

/** WGS84 → UTM (northern hemisphere), Krüger series. */
function utm(lat, lon, zone) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, n = f / (2 - f);
  const A = (a / (1 + n)) * (1 + n * n / 4 + n ** 4 / 64);
  const al = [n / 2 - (2 * n * n) / 3 + (5 * n ** 3) / 16, (13 * n * n) / 48 - (3 * n ** 3) / 5, (61 * n ** 3) / 240];
  const phi = (lat * Math.PI) / 180, dl = ((lon - (zone * 6 - 183)) * Math.PI) / 180;
  const c = (2 * Math.sqrt(n)) / (1 + n);
  const t = Math.sinh(Math.atanh(Math.sin(phi)) - c * Math.atanh(c * Math.sin(phi)));
  const xi = Math.atan(t / Math.cos(dl)), eta = Math.atanh(Math.sin(dl) / Math.sqrt(1 + t * t));
  let E = eta, N = xi;
  al.forEach((aj, i) => { const j = i + 1; E += aj * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta); N += aj * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta); });
  return [500000 + k0 * A * E, k0 * A * N];
}

/** Tiles of one satellite pass that together cover the square: same day, autumn, clear, no empty edges. */
async function bestPass(m) {
  const west = m.lon - m.lonHalf, east = m.lon + m.lonHalf, south = m.lat - m.half, north = m.lat + m.half;
  const body = {
    collections: ['sentinel-2-l2a'], limit: 200, datetime: '2019-09-15T00:00:00Z/2025-12-31T00:00:00Z',
    intersects: { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] },
    query: { 'eo:cloud_cover': { lt: 6 } },
  };
  const j = await (await fetch('https://earth-search.aws.element84.com/v1/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
  const days = new Map();
  for (const f of j.features) {
    if (!/-(10|11)-/.test(f.properties.datetime) || (f.properties['s2:nodata_pixel_percentage'] ?? 0) > 1) continue;
    const d = f.properties.datetime.slice(0, 10);
    days.set(d, [...(days.get(d) ?? []), f]);
  }
  const inside = (f, la, lo) => f.bbox[0] <= lo && f.bbox[2] >= lo && f.bbox[1] <= la && f.bbox[3] >= la;
  const grid = [];
  for (let i = 0; i <= 8; i++) for (let k = 0; k <= 8; k++) grid.push([south + ((north - south) * i) / 8, west + ((east - west) * k) / 8]);
  const passes = [...days.values()].filter(fs => grid.every(([la, lo]) => fs.some(f => inside(f, la, lo))));
  passes.sort((x, y) => Math.max(...x.map(f => f.properties['eo:cloud_cover'])) - Math.max(...y.map(f => f.properties['eo:cloud_cover'])));
  if (!passes.length) throw new Error(`no clear pass for ${m.id}`);
  return passes[0];
}

for (const id of ids) {
  const m = JSON.parse(readFileSync(`public/terrain/${id}.json`, 'utf8'));
  const pass = await bestPass(m);
  const north = m.lat + m.half, south = m.lat - m.half, west = m.lon - m.lonHalf, east = m.lon + m.lonHalf;
  const sources = [];
  for (const scene of pass) {
    // processing baseline 04.00+ adds 1000 to every value
    OFFSET = Number(scene.properties['s2:processing_baseline'] ?? '0') >= 4 ? 1000 : 0;
    const epsg = scene.properties['proj:epsg'] ?? Number(String(scene.properties['proj:code']).split(':')[1]);
    const zone = epsg % 100;
    // the 16-bit reflectance bands, toned here so bright snow keeps its detail (the ready-made TCI clips it)
    const imgs = await Promise.all(['red', 'green', 'blue'].map(async b => (await fromUrl(scene.assets[b].href)).getImage()));
    const img = imgs[0];
    const [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution();
    const corners = [[north, west], [north, east], [south, west], [south, east], [m.lat, west], [m.lat, east], [north, m.lon], [south, m.lon]].map(([la, lo]) => utm(la, lo, zone));
    const px = corners.map(([e]) => (e - ox) / rx), py = corners.map(([, nn]) => (nn - oy) / ry);
    const x0 = Math.max(0, Math.floor(Math.min(...px)) - 2), x1 = Math.min(img.getWidth(), Math.ceil(Math.max(...px)) + 2);
    const y0 = Math.max(0, Math.floor(Math.min(...py)) - 2), y1 = Math.min(img.getHeight(), Math.ceil(Math.max(...py)) + 2);
    if (x1 - x0 < 4 || y1 - y0 < 4) continue;
    const bands = await Promise.all(imgs.map(async im => (await im.readRasters({ window: [x0, y0, x1, y1] }))[0]));
    const data = new Uint8Array((x1 - x0) * (y1 - y0) * 3);
    for (let i = 0; i < bands[0].length; i++) {
      if (bands[0][i] === 0) continue; // empty edge stays 0
      for (let k = 0; k < 3; k++) data[i * 3 + k] = Math.max(1, Math.round(255 * tone(bands[k][i])));
    }
    sources.push({ zone, ox, oy, rx, ry, x0, y0, W: x1 - x0, H: y1 - y0, data });
  }
  const out = Buffer.alloc(OUT * OUT * 3);
  for (let r = 0; r < OUT; r++) {
    const lat = north - ((north - south) * r) / (OUT - 1);
    for (let c = 0; c < OUT; c++) {
      const lon = west + ((east - west) * c) / (OUT - 1);
      // first tile that has real data here (0,0,0 is the tile's empty edge)
      for (const S of sources) {
        const [e, nn] = utm(lat, lon, S.zone);
        const fx = (e - S.ox) / S.rx - S.x0, fy = (nn - S.oy) / S.ry - S.y0;
        if (fx < 0 || fy < 0 || fx > S.W - 2 || fy > S.H - 2) continue;
        const ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
        const q = (yy, xx, k) => S.data[((iy + yy) * S.W + ix + xx) * 3 + k];
        if (q(0, 0, 0) + q(0, 0, 1) + q(0, 0, 2) === 0) continue;
        for (let k = 0; k < 3; k++) out[(r * OUT + c) * 3 + k] = (q(0, 0, k) * (1 - u) + q(0, 1, k) * u) * (1 - v) + (q(1, 0, k) * (1 - u) + q(1, 1, k) * u) * v;
        break;
      }
    }
  }
  const pic = sharp(out, { raw: { width: OUT, height: OUT, channels: 3 } });
  await pic.clone().webp({ quality: 84 }).toFile(`public/terrain/${id}-sat-2048.webp`);
  await pic.clone().resize(1024).webp({ quality: 82 }).toFile(`public/terrain/${id}-sat-1024.webp`);
  const date = pass[0].properties.datetime.slice(0, 10);
  writeFileSync(`public/terrain/${id}-sat.json`, JSON.stringify({ scenes: pass.map(f => f.id), date }));
  console.log(id, date, pass.map(f => f.id).join(' + '), 'cloud', Math.max(...pass.map(f => f.properties['eo:cloud_cover'])).toFixed(2));
}
