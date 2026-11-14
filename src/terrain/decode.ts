// Heightmaps ship as PNGs with the height in 16 bits: red is the high byte, green the low byte.
export function encodeHeight(h: number, min: number, max: number): [number, number] {
  const v = Math.round(((h - min) / (max - min)) * 65535);
  return [v >> 8, v & 255];
}

export function decodeHeights(rgba: Uint8ClampedArray, w: number, h: number, min: number, max: number): Float32Array {
  const out = new Float32Array(w * h), k = (max - min) / 65535;
  for (let i = 0; i < w * h; i++) out[i] = min + ((rgba[i * 4] << 8) | rgba[i * 4 + 1]) * k;
  return out;
}

export interface AreaMeta { id: string; n: number; min: number; max: number; sizeM: number; lat: number; lon: number; half: number; lonHalf: number }

/** Loads a baked heightmap through an image and a 2D canvas. */
export async function loadHeights(url: string, meta: AreaMeta): Promise<Float32Array> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  // no colour management: the bytes are data, not colours
  const ctx = cv.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
  ctx.drawImage(img, 0, 0);
  return decodeHeights(ctx.getImageData(0, 0, img.width, img.height).data, img.width, img.height, meta.min, meta.max);
}
