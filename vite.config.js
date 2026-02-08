import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import { resolve } from 'path'

function orderflowRouteRewritePlugin() {
  const rewrites = {
    // Main app entry (Vercel serves /app from /app/index.html)
    '/app': '/app/index.html',
    '/app/': '/app/index.html',

    // Public landing rewrites (mirror vercel.json)
    '/priser': '/landing-pages/priser.html',
    '/how-it-works': '/landing-pages/how-it-works.html',
    '/search-engine': '/landing-pages/search-engine.html',
    '/business-scanner': '/landing-pages/search-engine.html',
    '/blog': '/landing-pages/blog.html'
  }

  const rewriteMiddleware = (req, _res, next) => {
    const rawUrl = req.url || '/'
    const qIndex = rawUrl.indexOf('?')
    const path = qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex)
    const query = qIndex === -1 ? '' : rawUrl.slice(qIndex)

    const dest = rewrites[path]
    if (dest) req.url = dest + query

    next()
  }

  return {
    name: 'orderflow-route-rewrites',
    configureServer(server) {
      server.middlewares.use(rewriteMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteMiddleware)
    }
  }
}

export default defineConfig({
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'partials'),
    }),
    orderflowRouteRewritePlugin(),
  ],
  server: {
    port: 8080,
    open: true
  }
})
