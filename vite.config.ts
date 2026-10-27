/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const API_CACHE = 'supabase-api'

export default defineConfig({
  define: {
    // Vercel sets VERCEL_GIT_COMMIT_SHA at build time; shown in the app so a deploy is easy to spot.
    __APP_VERSION__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/pwa.ts so the page reloads into a new version (the injected script does not).
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Chore Quest',
        short_name: 'Chore Quest',
        description: 'Chores as a base-defense game: every chore is a monster attacking your base.',
        theme_color: '#2b2d42',
        background_color: '#2b2d42',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The plugin only adds these for autoUpdate when it injects the register script itself;
        // with injectRegister: false they must be set here, or a new worker waits until every tab closes.
        skipWaiting: true,
        clientsClaim: true,
        // Phaser makes the main chunk bigger than Workbox's 2 MB default.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Last known family state stays readable offline (NFR-7). Cleared on sign-out.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && (url.pathname.startsWith('/rest/v1/') || url.pathname === '/auth/v1/user'),
            handler: 'NetworkFirst',
            options: {
              cacheName: API_CACHE,
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
})
