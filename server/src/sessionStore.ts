import { Redis } from 'ioredis'
import { Session } from './types.js'

abstract class SessionStore<T, U> {
  abstract findSession(id: string): T
  abstract saveSession(id: string, session: Session): void
  abstract findAllSessions(): U
}

export class InMemorySessionStore extends SessionStore<
  Session | undefined,
  Session[]
> {
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

const SESSION_TTL = 24 * 60 * 60
const mapSession = ([userID, username, connected]: (string | null)[]) =>
  userID
    ? { userID, username: username || '', connected: connected === 'true' }
    : undefined

export class RedisSessionStore extends SessionStore<
  Promise<Session | undefined>,
  Promise<Session[]>
> {
  redisClient: Redis

  constructor(redisClient: Redis) {
    super()
    this.redisClient = redisClient
  }

  findSession(id: string): Promise<Session | undefined> {
    return this.redisClient
      .hmget(`session:${id}`, 'userID', 'username', 'connected')
      .then(mapSession)
  }

  saveSession(id: string, { userID, username, connected }: Session): void {
    this.redisClient
      .multi()
      .hset(`session:${id}`, { userID, username, connected })
      .expire(`session:${id}`, SESSION_TTL)
      .exec()
  }

  async findAllSessions(): Promise<Session[]> {
    // first, we fetch all the keys with the SCAN command
    const keys: Set<string> = new Set()
    let nextIndex = 0
    do {
      const [nextIndexAsStr, results] = await this.redisClient.scan(
        nextIndex,
        'MATCH',
        'session:*',
        'COUNT',
        '100',
      )
      nextIndex = parseInt(nextIndexAsStr, 10)
      results.forEach((s) => keys.add(s))
    } while (nextIndex != 0)

    // and then we retrieve the session details with multiple HMGET commands
    const commands: string[][] = []
    keys.forEach((key) => {
      commands.push(['hmget', key, 'userID', 'username', 'connected'])
    })
    return this.redisClient
      .multi(commands)
      .exec()
      .then((results) =>
        results
          ? results
              .map(([err, results]) => {
                const session = results as (string | null)[]
                return err ? undefined : mapSession(session)
              })
              .filter((v) => !!v)
          : [],
      )
  }
}
