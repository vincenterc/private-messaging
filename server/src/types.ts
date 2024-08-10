export interface User {
  userID: string
  username: string
}

export interface ClientToServerEvents {
  'private message': ({ content, to }: { content: string; to: string }) => void
}

export interface ServerToClientEvents {
  users: (users: User[]) => void
  'user connected': (user: User) => void
  'user disconnected': (id: string) => void
  'private message': ({
    content,
    from,
  }: {
    content: string
    from: string
  }) => void
}

export interface InterServerEvents {}

export interface SocketData {
  username: string
}
