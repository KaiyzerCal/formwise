import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  logLevel: 'error',
  resolve: {
    // Declared here on purpose, even though @base44/vite-plugin also injects
    // it (see its dist/index.js). Roughly 300 files import via "@/", so with
    // the alias supplied only by the plugin, removing or failing to load the
    // plugin breaks every one of those imports at once — before any
    // application code is even reached. Stating it explicitly means module
    // resolution is ours, matches the mapping already in jsconfig.json, and
    // keeps the plugin responsible only for the platform features it adds.
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});