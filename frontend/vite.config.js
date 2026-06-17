import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'react/jsx-dev-runtime', 'react/jsx-runtime'],
    force: true,
  },
  server: {
    port: 3000,
    strictPort: false,
    headers: { 'Cache-Control': 'no-store' },
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
        // Function form (not object) is required by Vite 8's rolldown bundler.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/katex/')) return 'katex';
          if (id.includes('/lucide-react/')) return 'icons';
          if (/[\\/](react|react-dom|react-router|react-router-dom|@remix-run[\\/]router|scheduler)[\\/]/.test(id)) return 'react';
          return undefined;
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
