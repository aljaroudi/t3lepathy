import { openDB } from "idb"
import type { Chat, Message, ChatDB, Model } from "./types"
import { generateResponse, generateTitle } from "./ai"

const dbPromise = openDB<ChatDB>("chat-db", 1, {
  upgrade(db) {
    db.createObjectStore("chats", { keyPath: "id" })
    const msgStore = db.createObjectStore("messages", { keyPath: "id" })
    msgStore.createIndex("chatId", "chatId")
  },
})

export let state = $state({
  chats: [] as Chat[],
  messages: [] as Message[],
  currentChatId: null as string | null,
})

export async function getChats() {
  const db = await dbPromise
  const chats = await db.getAll("chats")
  state.chats = chats.sort((a, b) => a.title.localeCompare(b.title))
}

export async function setCurrentChat(chatId: string) {
  const db = await dbPromise
  const messages = await db.getAllFromIndex("messages", "chatId", chatId)
  state.messages = messages.sort((a, b) => a.date.getTime() - b.date.getTime())
  state.currentChatId = chatId
}

export async function createChat(title: string) {
  const db = await dbPromise
  const chat: Chat = { id: crypto.randomUUID(), title, date: new Date() }
  await db.put("chats", chat)
  state.chats.push(chat)
  setCurrentChat(chat.id)
}

export async function renameChat(id: string, newTitle: string) {
  const db = await dbPromise
  const chat = await db.get("chats", id)
  if (!chat) return false
  chat.title = newTitle
  await db.put("chats", chat)

  const local = state.chats.find((c) => c.id === id)
  if (local) local.title = newTitle
  return true
}

export async function loadMessages(chatId: string) {
  const db = await dbPromise
  state.messages = await db.getAllFromIndex("messages", "chatId", chatId)
}

export async function addMessage(msg: Message, model: Model, apiKey: string) {
  const shouldAutoRename = state.messages.length === 0
  // 1. Add user message to db
  const db = await dbPromise
  await db.put("messages", msg)
  state.messages.push(msg)

  // 2. Get all messages for context
  const messages = state.messages.map((m) => ({
    content: m.content,
    role: m.role,
  }))

  // 3. Add a placeholder for the assistant message
  const messageId = crypto.randomUUID()
  const reply = {
    id: messageId,
    chatId: msg.chatId,
    content: "",
    role: "assistant" as const,
    date: new Date(),
  }
  await db.put("messages", reply)
  const msgIdx = state.messages.push(reply) - 1

  // 4. Update the message with the response
  const stream = generateResponse({ messages, model, apiKey })

  for await (const chunk of stream) {
    state.messages[msgIdx].content += chunk
    await db.put("messages", { ...state.messages[msgIdx] })
  }

  // 5. If it's a new chat, auto-rename it
  if (!shouldAutoRename) return
  const chat = state.chats.find((c) => c.id === msg.chatId)
  if (!chat) return
  const titleStream = generateTitle({ messages, model, apiKey })
  for await (const chunk of titleStream) {
    chat.title = chunk
    await db.put("chats", { ...chat })
  }
}
