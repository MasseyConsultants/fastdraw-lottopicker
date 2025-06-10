import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://api.robertwmassey.com'
          : 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}); 