import { defineConfig } from 'vite';

export default defineConfig({
  base: '/AIspel/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
    port: 3000,
  },
});
