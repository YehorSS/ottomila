import { describe, expect, it } from 'vitest';
import { clear, type Answers } from '../src/clearance';
import { oxygenShare } from '../src/oxygen';
import { FILES } from '../src/content/mountains';

describe('oxygen', () => {
  it('is all of it at sea level and about a third on Everest', () => {
    expect(oxygenShare(0)).toBeCloseTo(1, 5);
    expect(oxygenShare(8849)).toBeGreaterThan(0.31);
    expect(oxygenShare(8849)).toBeLessThan(0.35);
    expect(oxygenShare(5364)).toBeGreaterThan(oxygenShare(7920));
  });
});

const all: Answers[] = [];
for (const alt of [0, 1, 2, 3] as const) for (const eight of [false, true]) for (const weeks of [0, 1, 2] as const) for (const training of [0, 1, 2] as const) all.push({ alt, eight, weeks, training });

describe('clearance', () => {
  it('stamps every file for every combination, with a reason for each denial', () => {
    for (const a of all) {
      const r = clear(a);
      expect(Object.keys(r).sort()).toEqual([...FILES].sort());
      for (const f of FILES) if (!r[f].ok) expect(r[f].reason, JSON.stringify(a)).toBeDefined();
    }
  });

  it('denies everything to a beginner, each for a reason', () => {
    const r = clear({ alt: 0, eight: false, weeks: 0, training: 0 });
    expect(FILES.every(f => !r[f].ok)).toBe(true);
    expect(r['ama-dablam'].reason).toBe('alt');
  });

  it('clears levels I and II for someone with 6500 m, six weeks and steady training', () => {
    const r = clear({ alt: 2, eight: false, weeks: 1, training: 1 });
    expect(r['ama-dablam'].ok).toBe(true);
    expect(r.manaslu.ok).toBe(true);
    expect(r.everest.ok).toBe(false);
    expect(r.k2).toEqual({ ok: false, reason: 'eight' });
  });

  it('clears all four for a strong eight-thousander climber, K2 still by invitation', () => {
    const r = clear({ alt: 3, eight: true, weeks: 2, training: 2 });
    expect(FILES.every(f => r[f].ok)).toBe(true);
    expect(r.k2.invite).toBe(true);
  });

  it('never clears a level whose level below is denied', () => {
    for (const a of all) {
      const r = clear(a);
      for (let i = 1; i < FILES.length; i++) if (r[FILES[i]].ok) expect(r[FILES[i - 1]].ok, JSON.stringify(a)).toBe(true);
    }
  });

  it('treats an eight-thousander summit as having been above 8000 m', () => {
    expect(clear({ alt: 1, eight: true, weeks: 2, training: 2 }).everest.ok).toBe(true);
  });
});
