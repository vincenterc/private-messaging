export interface Message {
  content: string
  from: string
  to: string
}

export interface User {
  userID: string
  username: string
  connected: boolean
  messages: Message[]
}

export interface Session {
  userID: string
  username: string
  connected: boolean
}

export interface ClientToServerEvents {
  'private message': ({ content, to }: { content: string; to: string }) => void
}

export interface ServerToClientEvents {
  session: ({
    sessionID,
    userID,
  }: {
    sessionID: string
    userID: string
  }) => void
  users: (users: User[]) => void
  'user connected': (user: User) => void
  'user disconnected': (id: string) => void
  'private message': ({
    content,
    from,
    to,
  }: {
    content: string
    from: string
    to: string
  }) => void
}

export interface InterServerEvents {}

export interface SocketData {
  sessionID: string
  userID: string
  username: string
}
