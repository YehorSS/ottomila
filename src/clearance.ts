import type { FileId } from './content/mountains';

export interface Answers {
  /** 0: under 5000 m, 1: 5000–6500, 2: 6500–8000, 3: over 8000 */
  alt: 0 | 1 | 2 | 3;
  eight: boolean;
  /** 0: 4 weeks, 1: 6, 2: 9 or more */
  weeks: 0 | 1 | 2;
  /** 0: under 3 h a week, 1: 3–6 h, 2: over 6 h */
  training: 0 | 1 | 2;
}
export type Reason = 'alt' | 'eight' | 'weeks' | 'training';
export interface Stamp { ok: boolean; reason?: Reason; invite?: boolean }

/** Which files someone could open today; each level also needs the one below it. */
export function clear(a: Answers): Record<FileId, Stamp> {
  const alt = a.eight ? 3 : a.alt;
  const ama: Stamp = alt < 1 ? { ok: false, reason: 'alt' } : { ok: true };
  const manaslu: Stamp = !ama.ok ? { ok: false, reason: ama.reason } : alt < 2 ? { ok: false, reason: 'alt' }
    : a.weeks < 1 ? { ok: false, reason: 'weeks' } : a.training < 1 ? { ok: false, reason: 'training' } : { ok: true };
  // Everest: an eight-thousander, or 6500–8000 m with the hardest training
  const everest: Stamp = !manaslu.ok ? { ok: false, reason: manaslu.reason } : a.weeks < 2 ? { ok: false, reason: 'weeks' }
    : alt === 3 || a.training === 2 ? { ok: true } : { ok: false, reason: 'training' };
  const k2: Stamp = !a.eight ? { ok: false, reason: 'eight' } : !everest.ok ? { ok: false, reason: everest.reason }
    : a.training < 2 ? { ok: false, reason: 'training' } : { ok: true, invite: true };
  return { 'ama-dablam': ama, manaslu, everest, k2 };
}
