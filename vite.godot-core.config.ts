import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'godot/build/web',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/host/webCoreHost.ts'),
      name: 'DeathstalkerCoreBundle',
      formats: ['iife'],
      fileName: () => 'deathstalker-core-host.js',
    },
  },
});

