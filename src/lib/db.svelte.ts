import { openDB } from "idb"
import type { Chat, Message, ChatDB } from "./types"

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
  state.chats = await db.getAll("chats")
}

export async function setCurrentChat(chatId: string) {
  const db = await dbPromise
  state.messages = await db.getAllFromIndex("messages", "chatId", chatId)
  state.currentChatId = chatId
}

export async function createChat(title: string) {
  const db = await dbPromise
  const chat: Chat = { id: crypto.randomUUID(), title }
  await db.put("chats", chat)
  state.chats.push(chat)
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

export async function addMessage(msg: Message) {
  const db = await dbPromise
  await db.put("messages", msg)
  state.messages.push(msg)
}
