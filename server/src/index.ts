import { createServer } from 'http'
import { Server } from 'socket.io'

const server = createServer()
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
  },
})

io.on('connection', (socket) => {
  console.log('a user connected')
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
)
