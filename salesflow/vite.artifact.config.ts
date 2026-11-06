import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Single-file build for the hosted page: one JS bundle + one CSS file, inlined by
// scripts/build-artifact.mjs into a self-contained HTML document.
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
