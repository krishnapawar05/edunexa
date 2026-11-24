import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose VITE_SHOW_DEMO_CREDENTIALS with default 'true' for showcase & dev deployments
    'import.meta.env.VITE_SHOW_DEMO_CREDENTIALS': JSON.stringify(
      process.env.VITE_SHOW_DEMO_CREDENTIALS !== undefined
        ? process.env.VITE_SHOW_DEMO_CREDENTIALS
        : 'true'
    ),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});