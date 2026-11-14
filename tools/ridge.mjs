// Traces a ridge down from a summit on the baked terrain, keeping to a bearing, then walks downhill to a base-camp height.
// node tools/ridge.mjs <id> <bearing deg, 0 = north, 90 = east> <ridge stop m> <base m>  → prints a path for mountains.ts
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const [id, bearingArg, stopArg, baseArg] = process.argv.slice(2);
const meta = JSON.parse(readFileSync(`public/terrain/${id}.json`, 'utf8'));
const { data, info } = await sharp(`public/terrain/${id}-768.png`).raw().toBuffer({ resolveWithObject: true });
const n = info.width, ch = info.channels;
const H = (r, c) => meta.min + ((data[(r * n + c) * ch] << 8) | data[(r * n + c) * ch + 1]) * (meta.max - meta.min) / 65535;
const toRC = (lat, lon) => [Math.round((meta.lat + meta.half - lat) / (2 * meta.half) * (n - 1)), Math.round((lon - (meta.lon - meta.lonHalf)) / (2 * meta.lonHalf) * (n - 1))];
const toLL = (r, c) => [+(meta.lat + meta.half - 2 * meta.half * r / (n - 1)).toFixed(4), +(meta.lon - meta.lonHalf + 2 * meta.lonHalf * c / (n - 1)).toFixed(4)];
const SUMMITS = { k2: [35.8825, 76.5133], 'ama-dablam': [27.8617, 86.8614], manaslu: [28.5497, 84.5597], everest: [27.9881, 86.925] };

const b = (Number(bearingArg) * Math.PI) / 180, want = [-Math.cos(b), Math.sin(b)]; // row grows south, col grows east
let [r, c] = toRC(...SUMMITS[id]);
// settle on the highest pixel nearby: the smoothed summit is not always on the coordinate
for (let k = 0; k < 6; k++) { let best = [r, c]; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (H(r + dr, c + dc) > H(...best)) best = [r + dr, c + dc]; [r, c] = best; }
const path = [toLL(r, c)];
const seen = new Set([`${r},${c}`]);
const step = 3;
// along the ridge: of the neighbours that lead roughly the right way, keep the highest
while (H(r, c) > Number(stopArg)) {
  let best = null, bh = -Infinity;
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * 2 * Math.PI, dr = Math.round(-Math.cos(ang) * step), dc = Math.round(Math.sin(ang) * step);
    if (dr * want[0] + dc * want[1] < step * 0.35) continue;
    const nr = r + dr, nc = c + dc;
    if (nr < 1 || nc < 1 || nr >= n - 1 || nc >= n - 1 || seen.has(`${nr},${nc}`)) continue;
    const h = H(nr, nc);
    if (h < H(r, c) && h > bh) { bh = h; best = [nr, nc]; }
  }
  if (!best) break;
  [r, c] = best; seen.add(`${r},${c}`); path.push(toLL(r, c));
}
// then straight down the slope to base camp
while (H(r, c) > Number(baseArg)) {
  let best = null, bh = H(r, c);
  for (let dr = -step; dr <= step; dr += step) for (let dc = -step; dc <= step; dc += step) {
    const nr = r + dr, nc = c + dc;
    if (nr < 1 || nc < 1 || nr >= n - 1 || nc >= n - 1) continue;
    if (H(nr, nc) < bh) { bh = H(nr, nc); best = [nr, nc]; }
  }
  if (!best) break;
  [r, c] = best; path.push(toLL(r, c));
}
// keep about a dozen points, base camp first
const rev = path.reverse(), keep = rev.filter((_, i) => i % Math.max(1, Math.round(rev.length / 12)) === 0);
if (keep[keep.length - 1] !== rev[rev.length - 1]) keep.push(rev[rev.length - 1]);
console.log(JSON.stringify(keep), 'from', Math.round(H(...toRC(...keep[0]))), 'm');
