import { describe, expect, it } from 'vitest';
import { FILES, MOUNTAINS, type Text } from '../src/content/mountains';
import { SOURCES } from '../src/content/sources';

const texts = (v: unknown): Text[] => {
  if (v && typeof v === 'object' && 'en' in v && 'it' in v && 'uk' in v) return [v as Text];
  if (Array.isArray(v)) return v.flatMap(texts);
  if (v && typeof v === 'object') return Object.values(v).flatMap(texts);
  return [];
};

describe('mountains', () => {
  it('has the four files in ladder order', () => {
    expect(FILES).toEqual(['ama-dablam', 'manaslu', 'everest', 'k2'].sort((a, b) => MOUNTAINS[a as keyof typeof MOUNTAINS].level - MOUNTAINS[b as keyof typeof MOUNTAINS].level));
    expect(FILES.map(f => MOUNTAINS[f].level)).toEqual([1, 2, 3, 4]);
  });

  for (const id of FILES) {
    const m = MOUNTAINS[id];
    it(`${id}: camps climb steadily and end on the summit`, () => {
      expect(m.camps.length).toBeGreaterThanOrEqual(4);
      for (let i = 1; i < m.camps.length; i++) {
        expect(m.camps[i].height).toBeGreaterThan(m.camps[i - 1].height);
        expect(m.camps[i].day).toBeGreaterThanOrEqual(m.camps[i - 1].day);
      }
      expect(m.camps[m.camps.length - 1].height).toBe(m.height);
    });

    it(`${id}: every text exists in Italian, English and Ukrainian`, () => {
      for (const t of texts(m)) for (const l of ['it', 'en', 'uk'] as const) expect(t[l].trim().length, JSON.stringify(t)).toBeGreaterThan(0);
    });

    it(`${id}: every source it cites is listed`, () => {
      expect(m.sources.length).toBeGreaterThan(0);
      for (const s of m.sources) expect(SOURCES[s], s).toBeDefined();
    });

    it(`${id}: has the sections a client asks about`, () => {
      for (const k of ['requirements', 'included', 'excluded', 'gear', 'risks'] as const) expect(m[k].length, k).toBeGreaterThanOrEqual(3);
      expect(m.priceFrom).toBeGreaterThan(1000);
    });
  }
});
