// Close-range detail for the terrain from CC0 photo textures (Poly Haven): each packed as
// R = brightness around its mean (128 = no change), G/B = surface normal x/y. The satellite colour stays; these only add grain and relief.
// node tools/detail-tex.mjs   (sources in mock/detail/*-diff.jpg and *-nor.jpg)
import sharp from 'sharp';

const N = 1024;
const SETS = { rock: 'rock_face_04', snow: 'snow_02', field: 'snow_field_aerial' };

for (const [name, id] of Object.entries(SETS)) {
  const lum = await sharp(`mock/detail/${id}-diff.jpg`).resize(N, N).greyscale().raw().toBuffer();
  const nor = await sharp(`mock/detail/${id}-nor.jpg`).resize(N, N).removeAlpha().raw().toBuffer();
  let mean = 0, dev = 0;
  for (const v of lum) mean += v;
  mean /= lum.length;
  for (const v of lum) dev += (v - mean) ** 2;
  dev = Math.sqrt(dev / lum.length) || 1;
  const out = Buffer.alloc(N * N * 3);
  for (let i = 0; i < N * N; i++) {
    // brightness as a normalised deviation, so every texture pushes with the same strength
    out[i * 3] = Math.max(0, Math.min(255, 128 + ((lum[i] - mean) / dev) * 40));
    out[i * 3 + 1] = nor[i * 3];
    out[i * 3 + 2] = nor[i * 3 + 1];
  }
  await sharp(out, { raw: { width: N, height: N, channels: 3 } }).webp({ quality: 88 }).toFile(`public/terrain/detail-${name}.webp`);
  console.log(name, id);
}
