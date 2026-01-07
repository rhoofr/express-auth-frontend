import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // REMOVE OR COMMENT OUT PROXY IN PRODUCTION
  // Proxy is only needed for local development
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'https://express-auth-rkti.onrender.com',
  //       changeOrigin: true,
  //       secure: true,
  //       cookieDomainRewrite: 'localhost',
  //     },
  //   },
  // },
});
