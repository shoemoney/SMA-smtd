import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/three/')) return 'three';
          if (id.includes('/echarts/') || id.includes('/zrender/')) return 'charts';
        },
      },
    },
  },
  server: { host: '127.0.0.1' },
});
