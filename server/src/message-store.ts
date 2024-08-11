import { Message } from './types.js'

abstract class MessageStore {
  abstract saveMessage(message: Message): void
  abstract findMessagesForUser(userID: string): Message[]
}

export class InMemoryMessageStore extends MessageStore {
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
