import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        globIgnores: ['opencv.js'],
        runtimeCaching: [
          {
            urlPattern: /\/opencv\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'opencv-cache',
            },
          },
        ],
      },
      manifest: {
        name: 'Brightness Contour Tool',
        short_name: 'ContourTool',
        description: '画像の輝度等高線・Cannyエッジ検出ツール',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        lang: 'ja',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
