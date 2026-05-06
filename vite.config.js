import { defineConfig } from 'vite';

export default defineConfig({
  base: '/aispel/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
    port: 3000,
  },
});
