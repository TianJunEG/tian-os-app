import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:5001',
    },
    watch: {
      ignored: ['**/playwright-report-pilot/**', '**/test-results/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split heavy/stable vendors into their own cacheable chunks so the app
        // code stays small and KaTeX (with its fonts) loads in parallel and is
        // cached across deploys instead of re-downloaded with every app change.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          katex: ['katex'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['**/tests/e2e/**'],
  }
})
