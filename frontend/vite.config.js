import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serviceProxy = (target, resource) => ({
  target,
  changeOrigin: true,
  rewrite: (path) => path.replace(`/api/${resource}`, `/${resource}`),
});

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/users': serviceProxy('http://localhost:8080', 'users'),
      '/api/hotels': serviceProxy('http://localhost:8081', 'hotels'),
      '/api/ratings': serviceProxy('http://localhost:8082', 'ratings'),
    },
  },
});
