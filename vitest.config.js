import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/test/',
        'src/index*.js',
        'src/ali-wxpush.js',
        'src/enc-wxpush.js',
        'src/wxpushskin.js'
      ]
    }
  }
});
