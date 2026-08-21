import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// UI 全体が font-mono なので、フォント待ちがそのまま FOIT になる。
// woff2 は CSS を解析するまで発見されないため、ビルド時に実ファイル名を拾って
// <link rel="preload"> を head に差し込み、HTML 解析の時点で取得を始めさせる。
const PRELOAD_FONTS = /jetbrains-mono-latin-wght-normal-[^/]+\.woff2$/

function preloadFonts(): Plugin {
  let base = '/'
  return {
    name: 'preload-fonts',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle ?? {})
          .filter((file) => PRELOAD_FONTS.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href: `${base}${file}`,
              crossorigin: true,
            },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        // 既定の globPatterns には woff2 が含まれず、PWA でもフォントだけ毎回
        // ネットワーク取得になって FOIT の原因になるため明示的に含める
        globPatterns: ['**/*.{js,css,html,woff2}'],
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
        name: 'Brightness Contour',
        short_name: 'Brightness Contour',
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
