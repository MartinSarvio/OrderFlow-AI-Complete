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
    '/blog': '/landing-pages/blog.html',

    // Legal, company, support & tools (mirror vercel.json)
    '/privacy': '/public/legal/privacy.html',
    '/terms': '/public/legal/terms.html',
    '/om-os': '/public/pages/company/om-os.html',
    '/karriere': '/public/pages/company/karriere.html',
    '/help-center': '/public/pages/support/help-center.html',
    '/tools/image-generator': '/tools/image-generator.html'
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
