import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/mockData.js',
        'dist/',
      ],
    },
    // Exclude files
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'coverage',
      '**/*.config.js',
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});