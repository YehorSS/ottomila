// Watches frame times and trades resolution for smoothness.
const RATIOS = [1.75, 1.25, 1.0, 0.75];
const DEBRIS = [20000, 20000, 14000, 9000];
const WINDOW = 60;
const WARMUP = 90; // first frames carry texture uploads and shader compiles
const UP_AFTER_MS = 15000;

export class Governor {
  private level: number;
  private readonly top: number;
  private times: number[] = [];
  private lastChange = -Infinity;
  private seen = 0;
  private listeners: (() => void)[] = [];

  constructor(private readonly tier: 'high' | 'low') {
    this.top = tier === 'high' ? 0 : 2;
    this.level = this.top;
  }

  get pixelRatioCap(): number { return RATIOS[this.level]; }
  get debrisCount(): number { return this.tier === 'low' ? 6000 : DEBRIS[this.level]; }
  onChange(cb: () => void): void { this.listeners.push(cb); }

  /** One frame's duration in ms, and the time it ended. */
  frame(ms: number, now: number): void {
    if (!(ms > 0) || ++this.seen <= WARMUP) return;
    this.times.push(ms);
    if (this.times.length < WINDOW) return;
    const avg = this.times.reduce((a, b) => a + b, 0) / WINDOW;
    this.times = [];
    if (avg > 18 && this.level < RATIOS.length - 1) this.set(this.level + 1, now);
    // a steady 60 Hz frame is 16.7 ms, so "fast" means comfortably under the step-down line
    else if (avg < 17.5 && this.level > this.top && now - this.lastChange >= UP_AFTER_MS) this.set(this.level - 1, now);
  }

  private set(level: number, now: number): void {
    this.level = level;
    this.lastChange = now;
    this.listeners.forEach(cb => cb());
  }
}
