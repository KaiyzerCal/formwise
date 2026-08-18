import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Deliberately separate from vite.config.js rather than adding a `test` key
// there: the app config loads the Base44 vite plugin, which injects HMR,
// analytics and visual-edit agents meant for a running browser session. None
// of that should be attached to a unit test run.
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./src/*" mapping in jsconfig.json, which the
    // Base44 plugin applies during a normal build.
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    // repCounter persists calibration to localStorage, so the suite needs a
    // DOM. The pure geometry in poseUtils would run fine in node.
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
});
