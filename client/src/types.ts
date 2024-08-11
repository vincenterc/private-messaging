export interface IncomingMessageType {
  content: string
  from: string
  to: string
}

export interface IncomingUserType {
  userID: string
  username: string
  connected: boolean
  messages: IncomingMessageType[]
}

export interface Message {
  fromSelf: boolean
  content: string
}

export interface UserType {
  userID: string
  username: string
  self: boolean
  connected: boolean
  messages: Message[]
  hasNewMessages: boolean
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
  users: (users: IncomingUserType[]) => void
  'user connected': (user: IncomingUserType) => void
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
