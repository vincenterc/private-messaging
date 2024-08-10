import { createServer } from 'http'
import { Server } from 'socket.io'
import crypto from 'crypto'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  User,
} from './types.js'
import { InMemorySessionStore } from './sessionStore.js'

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

const randomId = () => crypto.randomBytes(8).toString('hex')

const sessionStore = new InMemorySessionStore()

io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID
  if (sessionID) {
    // find existing session
    const session = sessionStore.findSession(sessionID)
    if (session) {
      socket.data.sessionID = sessionID
      socket.data.userID = session.userID
      socket.data.username = session.username
      return next()
    }
  }
  const username = socket.handshake.auth.username
  if (!username) {
    return next(new Error('invalid username'))
  }
  // create new session
  socket.data.sessionID = randomId()
  socket.data.userID = randomId()
  socket.data.username = username
  next()
})

io.on('connection', (socket) => {
  // persist session
  sessionStore.saveSession(socket.data.sessionID, {
    userID: socket.data.userID,
    username: socket.data.username,
    connected: true,
  })

  // emit session details
  socket.emit('session', {
    sessionID: socket.data.sessionID,
    userID: socket.data.userID,
  })

  // join the "userID" room
  socket.join(socket.data.userID)

  const users: User[] = []
  sessionStore.findAllSessions().forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
    })
  })
  socket.emit('users', users)

  // notify existing users
  socket.broadcast.emit('user connected', {
    userID: socket.data.userID,
    username: socket.data.username,
    connected: true,
  })

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on('private message', ({ content, to }) => {
    socket.to(to).to(socket.data.userID).emit('private message', {
      content,
      from: socket.data.userID,
      to,
    })
  })

  socket.on('disconnect', async () => {
    const matchingSockets = await io.in(socket.data.userID).fetchSockets()
    const isDisconnected = matchingSockets.length === 0
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit('user disconnected', socket.data.userID)
      // update the connection status of the session
      sessionStore.saveSession(socket.data.sessionID, {
        userID: socket.data.userID,
        username: socket.data.username,
        connected: false,
      })
    }
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
)
