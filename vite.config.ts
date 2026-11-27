/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import askHandler from './api/ask';

const localApi = (env: Record<string, string>) => ({
  name: 'local-api',
  configureServer(server: any) {
    if (!process.env.GROQ_API_KEY && env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY;
    if (!process.env.GROQ_MODEL && env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL;

    server.middlewares.use('/api/ask', (req: any, res: any) => {
      Promise.resolve(askHandler(req, res)).catch((error) => {
        console.error('[ask] error en dev:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Error interno del servidor.' }));
        }
      });
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      localApi(env),
      legacy({
        targets: ['chrome >= 49', 'android >= 4.4', 'last 2 versions'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime']
      }),
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: false },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Ayamonte Cofrade',
          short_name: 'Ayamonte Cofrade',
          description: 'Guía oficial de la Semana Santa de Ayamonte',
          theme_color: '#300050',
          background_color: '#300050',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '.',
          icons: [
            {
              src: 'icon-512.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    build: {
      target: 'es5',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
            ui: ['lucide-react']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [],
    }
  };
});
