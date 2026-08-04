import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Dev server proxies /api to promptcut-server so the SPA needs no CORS setup.
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
