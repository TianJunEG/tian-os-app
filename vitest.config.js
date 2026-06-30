import { defineConfig } from 'vitest/config';

// Backend (Node) test config. The frontend has its own config under frontend/;
// scope this to the backend source dirs so the two suites stay independent.
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'utils/**/*.test.js',
      'routes/**/*.test.js',
      'middleware/**/*.test.js',
      'services/**/*.test.js',
      'shared/diagramEngine/tests/**/*.test.js',
      'shared/mathpath/**/*.test.js',
      'scripts/**/*.test.js',
      'shared/englishpath/**/*.test.js',
      'shared/rewards/**/*.test.js',
    ],
  },
});
