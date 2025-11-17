import { defineConfig } from 'vite';

export default defineConfig({
  base: '/school-vakantie-map/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      // Proxy any /api/* request to the Rijksoverheid OpenData host to avoid CORS in dev
      '/api': {
        target: 'https://opendata.rijksoverheid.nl',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
