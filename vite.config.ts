import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      legacy({
        targets: ['chrome >= 49', 'android >= 4.4', 'last 2 versions'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime']
      }),
      react(),
    ],
    build: {
      target: 'es5',
      minify: 'terser',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
