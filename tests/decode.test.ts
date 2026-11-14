import { describe, expect, it } from 'vitest';
import { decodeHeights, encodeHeight } from '../src/terrain/decode';

describe('16-bit heightmaps', () => {
  it('round-trips heights within a fraction of a metre', () => {
    const min = 4268, max = 8849;
    const hs = [4268, 5364.4, 6065, 7920.7, 8849];
    const px = new Uint8ClampedArray(hs.length * 4);
    hs.forEach((h, i) => { const [r, g] = encodeHeight(h, min, max); px[i * 4] = r; px[i * 4 + 1] = g; px[i * 4 + 3] = 255; });
    const out = decodeHeights(px, hs.length, 1, min, max);
    hs.forEach((h, i) => expect(Math.abs(out[i] - h)).toBeLessThan(0.1));
  });
});
