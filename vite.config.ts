import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    watch: {
      // These trees are not inputs to frozen legacy browser tooling. Ignoring them
      // also prevents Godot's atomic project.godot*.tmp writes from crashing the
      // Windows file watcher when a developer-only Vite tool and Godot overlap.
      ignored: [
        '**/art/**',
        '**/docs/**',
        '**/experiments/**',
        '**/godot/**',
      ],
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
