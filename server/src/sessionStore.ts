import { Session } from './types.js'

abstract class SessionStore {
  abstract findSession(id: string): Session | undefined
  abstract saveSession(id: string, session: Session): void
  abstract findAllSessions(): Session[]
}

export class InMemorySessionStore extends SessionStore {
  sessions: Map<string, Session>

  constructor() {
    super()
    this.sessions = new Map()
  }

  findSession(id: string): Session | undefined {
    return this.sessions.get(id)
  }

  saveSession(id: string, session: Session): void {
    this.sessions.set(id, session)
  }

  findAllSessions(): Session[] {
    return [...this.sessions.values()]
  }
}
