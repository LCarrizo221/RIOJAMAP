import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const CLIENT_URL = 'https://6fbrnqmj-5173.brs.devtunnels.ms';
const SERVER_URL = 'https://6fbrnqmj-3003.brs.devtunnels.ms';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: SERVER_URL,
          changeOrigin: true,
          secure: true
        }
      },
      cors: {
        origin: [CLIENT_URL, 'http://localhost:5173'],
        credentials: true
      }
    }
  };
});
