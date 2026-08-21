import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/admin': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/tournaments': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/coupons': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/recording': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/points': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/flick-shorts': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://fieldflicks-production-alb-2092326229.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
