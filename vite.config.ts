import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: {
        app: 'index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html'
      }
    }
  },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] }
});
