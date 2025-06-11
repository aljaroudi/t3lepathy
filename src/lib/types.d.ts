import type { DBSchema } from "idb"

export type Chat = {
  id: string
  title: string
}

export type Message = {
  id: string
  chatId: string
  content: string
  role: "user" | "assistant"
  date: Date
}

export interface ChatDB extends DBSchema {
  chats: {
    key: string
    value: Chat
  }
  messages: {
    key: string
    value: Message
    indexes: { chatId: string }
  }
}
