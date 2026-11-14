import { buildSurface } from './detail';

self.onmessage = (e: MessageEvent<{ id: number; h: Float32Array; n: number; m: number; cell: number; size: number; exag: number }>) => {
  const { id, h, n, m, cell, size, exag } = e.data;
  const s = buildSurface(h, n, m, cell, size, exag);
  (self as unknown as Worker).postMessage({ id, ...s }, [s.y.buffer, s.normal.buffer, s.ao.buffer]);
};
