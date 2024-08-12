import cluster from 'cluster'
import http from 'http'
import sticky from '@socket.io/sticky'
import { availableParallelism } from 'os'
import { Server } from 'socket.io'
import crypto from 'crypto'
import { Redis } from 'ioredis'
import redisAdapter from '@socket.io/redis-adapter'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  User,
  Message,
} from './types.js'
import { RedisMessageStore } from './message-store.js'
import { RedisSessionStore } from './sessionStore.js'

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`)

  const server = http.createServer()

  // setup sticky sessions
  sticky.setupMaster(server, {
    loadBalancingMethod: 'least-connection',
  })

  const PORT = process.env.PORT || 3000

  server.listen(PORT, () =>
    console.log(`server listening at http://localhost:${PORT}`),
  )

  const numCPUs = availableParallelism()

  // create one worker per available core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork()
  })
} else {
  console.log(`Worker ${process.pid} started`)

  const server = http.createServer()
  const redisClient = new Redis()
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: 'http://localhost:3001',
    },
    adapter: redisAdapter.createAdapter(redisClient, redisClient.duplicate()),
  })

  // setup connection with the primary process
  sticky.setupWorker(io)

  const randomId = () => crypto.randomBytes(8).toString('hex')

  const messageStore = new RedisMessageStore(redisClient)

  const sessionStore = new RedisSessionStore(redisClient)

  io.use(async (socket, next) => {
    const sessionID = socket.handshake.auth.sessionID
    if (sessionID) {
      // find existing session
      const session = await sessionStore.findSession(sessionID)
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

  io.on('connection', async (socket) => {
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

    // fetch existing users
    const users: User[] = []
    const [messages, sessions] = await Promise.all([
      messageStore.findMessagesForUser(socket.data.userID),
      sessionStore.findAllSessions(),
    ])
    const messagePerUser: Map<string, Message[]> = new Map()
    messages.forEach((message) => {
      const { from, to } = message
      const otherUser = socket.data.userID === from ? to : from
      if (messagePerUser.has(otherUser)) {
        messagePerUser.get(otherUser)!.push(message)
      } else {
        messagePerUser.set(otherUser, [message])
      }
    })
    sessions.forEach((session) => {
      users.push({
        userID: session.userID,
        username: session.username,
        connected: session.connected,
        messages: messagePerUser.get(session.userID) || [],
      })
    })
    socket.emit('users', users)

    // notify existing users
    socket.broadcast.emit('user connected', {
      userID: socket.data.userID,
      username: socket.data.username,
      connected: true,
      messages: [],
    })

    // forward the private message to the right recipient (and to other tabs of the sender)
    socket.on('private message', ({ content, to }) => {
      const message = {
        content,
        from: socket.data.userID,
        to,
      }
      socket.to(to).to(socket.data.userID).emit('private message', message)
      messageStore.saveMessage(message)
    })

    // notify users upon disconnection
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
}
