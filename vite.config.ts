import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/admin': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/tournaments': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/coupons': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/recording': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/points': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/flick-shorts': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://fieldfflix-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
