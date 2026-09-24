import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

// `npm run dev` sırasında /api/uyumsoft'u Vercel fonksiyonu gibi çalıştırır
function yerelApi() {
  return {
    name: 'yerel-api',
    configureServer(server) {
      server.middlewares.use('/api/uyumsoft', async (req, res) => {
        let raw = ''
        for await (const chunk of req) raw += chunk
        let body = {}
        try { body = raw ? JSON.parse(raw) : {} } catch (e) { body = {} }
        const mod = await server.ssrLoadModule('/api/uyumsoft.js')
        const out = {
          statusCode: 200,
          setHeader: (k, v) => res.setHeader(k, v),
          status(c) { this.statusCode = c; return this },
          json(o) { res.statusCode = this.statusCode; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) },
        }
        await mod.default({ method: req.method, headers: req.headers, body }, out)
      })
    },
  }
}

export default defineConfig({
  plugins: [
    yerelApi(),
    react(),
    legacy({
      targets: ['Chrome >= 49', 'Android >= 6'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Zala Hatun Yağ Takip',
        short_name: 'Yağ Takip',
        description: 'Zeytinyağı üretim takip paneli',
        theme_color: '#5b6b3a',
        background_color: '#faf6ee',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
