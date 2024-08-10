import { createServer } from 'http'
import { Server } from 'socket.io'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  User,
} from './types.js'

const server = createServer()
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: 'http://localhost:3001',
  },
})

io.use((socket, next) => {
  const username = socket.handshake.auth.username
  if (!username) {
    return next(new Error('invalid username'))
  }
  socket.data.username = username
  next()
})

io.on('connection', (socket) => {
  const users: User[] = []
  for (let [id, socket] of io.of('/').sockets) {
    users.push({
      userID: id,
      username: socket.data.username,
    })
  }
  socket.emit('users', users)

  // notify existing users
  socket.broadcast.emit('user connected', {
    userID: socket.id,
    username: socket.data.username,
  })

  socket.on('private message', ({ content, to }) => {
    socket.to(to).emit('private message', {
      content,
      from: socket.id,
    })
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit('user disconnected', socket.id)
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
)
