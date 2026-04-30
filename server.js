const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server: SocketIOServer } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Store io instance globally for API routes
  global.__socketio__ = io

  io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
      if (data && data.role) socket.join(data.role)
      if (data && data.userId) socket.join(`user_${data.userId}`)
    })

    socket.on('disconnect', () => {})
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`\n🏠 PropertyCRM ready → http://${hostname}:${port}`)
      console.log(`📊 Mode: ${dev ? 'development' : 'production'}`)
      console.log(`🔌 Socket.io: active`)
      console.log(`\n📌 Demo Accounts:`)
      console.log(`   Admin  → admin@propertycrm.com / admin123`)
      console.log(`   Agent  → ahmed@propertycrm.com / agent123`)
      console.log(`   Agent  → sara@propertycrm.com / agent123`)
      console.log(`   Agent  → bilal@propertycrm.com / agent123\n`)
      console.log(`💡 First run: visit http://${hostname}:${port}/api/seed (POST) to seed demo data\n`)
    })
})
