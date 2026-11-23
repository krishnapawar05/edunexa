import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from repo root as well as client folder
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const clientEnv = loadEnv(mode, __dirname, '');
  const mergedEnv = { ...rootEnv, ...clientEnv, ...process.env };

  const enableDemo = mergedEnv.VITE_ENABLE_DEMO_CREDENTIALS;

  return {
    plugins: [react()],
    envDir: path.resolve(__dirname, '..'),
    define: {
      // Injects VITE_ENABLE_DEMO_CREDENTIALS into bundle if provided in build environment
      'import.meta.env.VITE_ENABLE_DEMO_CREDENTIALS': JSON.stringify(
        enableDemo !== undefined ? enableDemo : ''
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
  };
});
