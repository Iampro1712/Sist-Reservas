const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Cuando esté listo Next.js, inicializamos el servidor
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Parsear la URL
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Inicializar Socket.io después de que el servidor HTTP esté creado
  // Por ahora comentamos Socket.io hasta que configuremos TypeScript en el servidor
  console.log('Socket.io y scheduler se inicializarán cuando se configure TypeScript')

  // Hacer disponibles globalmente cuando estén configurados
  // global.socketManager = socketManager
  // global.scheduler = scheduler

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Next.js server running`)
      console.log(`> APIs disponibles en /api/*`)
    })
})
