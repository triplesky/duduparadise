import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'DUDU Paradise',
        short_name: 'DUDU',
        description: 'DUDU Paradise',
        theme_color: '#ffffff',
        start_url: ".",
        display: "standalone",
        screenshots: [
          {
            src: "mobile-1.jpg",
            sizes: "1080x2280",
            type: "image/jpg",
            form_factor: "narrow",
            label: "Mobile view of Dudu Paradise"
          }
        ],
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    // 监听所有地址，这样局域网设备才能连接
    host: '0.0.0.0',
    // 默认端口 5173
    port: 5173,
  }
})
