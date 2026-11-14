import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// one built page per file, so GitHub Pages serves /ottomila/k2/ directly
const FILES = ['everest', 'k2', 'manaslu', 'ama-dablam'];

export default defineConfig({
  base: '/ottomila/',
  build: { rollupOptions: { input: { home: resolve(__dirname, 'index.html'), ...Object.fromEntries(FILES.map(f => [f, resolve(__dirname, `${f}/index.html`)])) } } },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
});
