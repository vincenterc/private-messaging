import { Redis } from 'ioredis'
import { Message } from './types.js'

abstract class MessageStore<T> {
  abstract saveMessage(message: Message): void
  abstract findMessagesForUser(userID: string): T
}

export class InMemoryMessageStore extends MessageStore<Message[]> {
  messages: Message[]

  constructor() {
    super()
    this.messages = []
  }

  saveMessage(message: Message): void {
    this.messages.push(message)
  }

  findMessagesForUser(userID: string): Message[] {
    return this.messages.filter(
      ({ from, to }) => from === userID || to === userID,
    )
  }
}

const CONVERSATION_TTL = 24 * 60 * 60

export class RedisMessageStore extends MessageStore<Promise<Message[]>> {
  redisClient: Redis

  constructor(redisClient: Redis) {
    super()
    this.redisClient = redisClient
  }

  saveMessage(message: Message): void {
    const value = JSON.stringify(message)
    this.redisClient
      .multi()
      .rpush(`message:${message.from}`, value)
      .rpush(`message:${message.to}`, value)
      .expire(`message:${message.from}`, CONVERSATION_TTL)
      .expire(`message:${message.to}`, CONVERSATION_TTL)
      .exec()
  }

  findMessagesForUser(userID: string): Promise<Message[]> {
    return this.redisClient
      .lrange(`message:${userID}`, 0, -1)
      .then((results) => results.map((result) => JSON.parse(result) as Message))
  }
}
