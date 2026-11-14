import { describe, expect, it } from 'vitest';
import { Governor } from '../src/terrain/quality';

/** Feeds n frames of `ms` each, starting at t0; returns the end time. */
const feed = (g: Governor, ms: number, n: number, t0 = 0) => { for (let i = 0; i < n; i++) g.frame(ms, t0 + i * ms); return t0 + n * ms; };
const warm = (g: Governor) => feed(g, 16.7, 90);

describe('Governor', () => {
  it('starts at full quality on the high tier', () => {
    const g = new Governor('high');
    expect(g.pixelRatioCap).toBe(1.75);
    expect(g.debrisCount).toBe(20000);
  });

  it('starts light on the low tier', () => {
    const g = new Governor('low');
    expect(g.pixelRatioCap).toBe(1.0);
    expect(g.debrisCount).toBe(6000);
  });

  it('ignores the warm-up while textures upload and shaders compile', () => {
    const g = new Governor('high');
    feed(g, 40, 90);
    expect(g.pixelRatioCap).toBe(1.75);
  });

  it('ignores frame times that are not positive', () => {
    const g = new Governor('high');
    const t = warm(g);
    feed(g, 0, 600, t);
    feed(g, -5, 600, t);
    expect(g.pixelRatioCap).toBe(1.75);
  });

  it('steps down once after a slow second', () => {
    const g = new Governor('high');
    let changes = 0;
    g.onChange(() => changes++);
    feed(g, 25, 60, warm(g));
    expect(g.pixelRatioCap).toBe(1.25);
    expect(changes).toBe(1);
  });

  it('stays put at 14 ms', () => {
    const g = new Governor('high');
    feed(g, 14, 600, warm(g));
    expect(g.pixelRatioCap).toBe(1.75);
  });

  it('never goes below the floor', () => {
    const g = new Governor('high');
    feed(g, 40, 3000, warm(g));
    expect(g.pixelRatioCap).toBe(0.75);
  });

  it('steps back up on a 60 Hz screen once frames are steady, not sooner than 15 s', () => {
    const g = new Governor('high');
    let t = feed(g, 25, 60, warm(g));
    expect(g.pixelRatioCap).toBe(1.25);
    t = feed(g, 16.7, 300, t); // 5 s steady
    expect(g.pixelRatioCap).toBe(1.25);
    feed(g, 16.7, 900, t); // 15 s more
    expect(g.pixelRatioCap).toBe(1.75);
  });
});
