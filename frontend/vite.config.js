import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    // Dev only: forward API calls to the backend so the app can use
    // same-origin relative URLs (/api) in both dev and production.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
