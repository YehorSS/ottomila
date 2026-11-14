// Real satellite imagery for each terrain square: Sentinel-2 cloudless 2016 by EOX (CC BY 4.0),
// fetched as Web Mercator tiles, stitched, and resampled onto the same lat/lon square as the heightmap.
// node tools/imagery.mjs [id ...]   → public/terrain/<id>-sat-{2048,1024}.webp
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';

const Z = 14, OUT = 2048;
const LAYER = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['ama-dablam', 'manaslu', 'everest', 'k2'];
mkdirSync('mock/tiles', { recursive: true });

const tx = lon => ((lon + 180) / 360) * 2 ** Z;
const ty = lat => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z; };

async function tile(x, y) {
  const f = `mock/tiles/${Z}-${x}-${y}.jpg`;
  if (!existsSync(f)) {
    const res = await fetch(`${LAYER}/${Z}/${y}/${x}.jpg`, { headers: { 'user-agent': 'terrain-demo-build' } });
    if (!res.ok) throw new Error(`tile ${x},${y}: ${res.status}`);
    writeFileSync(f, Buffer.from(await res.arrayBuffer()));
  }
  return f;
}

for (const id of ids) {
  const m = JSON.parse(readFileSync(`public/terrain/${id}.json`, 'utf8'));
  const north = m.lat + m.half, south = m.lat - m.half, west = m.lon - m.lonHalf, east = m.lon + m.lonHalf;
  const x0 = Math.floor(tx(west)), x1 = Math.floor(tx(east)), y0 = Math.floor(ty(north)), y1 = Math.floor(ty(south));
  const W = (x1 - x0 + 1) * 256, H = (y1 - y0 + 1) * 256;
  const parts = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) parts.push({ input: await tile(x, y), left: (x - x0) * 256, top: (y - y0) * 256 });
  const { data: mosaic, info } = await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).composite(parts).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // resample onto the heightmap's square: row 0 north, evenly spaced in latitude and longitude
  const out = Buffer.alloc(OUT * OUT * 3);
  for (let r = 0; r < OUT; r++) {
    const lat = north - ((north - south) * r) / (OUT - 1);
    const py = (ty(lat) - y0) * 256;
    for (let c = 0; c < OUT; c++) {
      const lon = west + ((east - west) * c) / (OUT - 1);
      const px = (tx(lon) - x0) * 256;
      const ix = Math.min(W - 2, Math.max(0, Math.floor(px))), iy = Math.min(H - 2, Math.max(0, Math.floor(py)));
      const fx = px - ix, fy = py - iy;
      for (let k = 0; k < 3; k++) {
        const a = mosaic[(iy * W + ix) * ch + k], b = mosaic[(iy * W + ix + 1) * ch + k], cc = mosaic[((iy + 1) * W + ix) * ch + k], d = mosaic[((iy + 1) * W + ix + 1) * ch + k];
        out[(r * OUT + c) * 3 + k] = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy;
      }
    }
  }
  const img = sharp(out, { raw: { width: OUT, height: OUT, channels: 3 } });
  await img.clone().webp({ quality: 82 }).toFile(`public/terrain/${id}-sat-2048.webp`);
  await img.clone().resize(1024).webp({ quality: 80 }).toFile(`public/terrain/${id}-sat-1024.webp`);
  console.log(id, `${parts.length} tiles`);
}
