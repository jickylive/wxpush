import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js'],
    exclude: [
      'node_modules/',
      'src/**/test/',  // 排除本地测试文件
      'dist/',
      'coverage/',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',        // 排除 CI 测试文件
        'src/**/test/',
        'src/index*.js',
        'src/ali-wxpush.js',
        'src/enc-wxpush.js',
        'src/wxpushskin.js'
      ]
    }
  }
});
