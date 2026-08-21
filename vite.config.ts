import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'https://api.fieldflicks.com';

/** Backend route prefixes used by the admin panel (local dev proxy → AWS API). */
const API_PROXY_PREFIXES = [
  '/admin',
  '/auth',
  '/tournaments',
  '/coupons',
  '/recording',
  '/points',
  '/flick-shorts',
  '/turfs',
  '/cameras',
  '/file-service',
  '/pricing',
] as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      API_PROXY_PREFIXES.map((prefix) => [
        prefix,
        {
          target: API_TARGET,
          changeOrigin: true,
          secure: true,
        },
      ]),
    ),
  },
});
