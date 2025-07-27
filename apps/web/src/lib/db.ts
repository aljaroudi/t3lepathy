import { openDB } from 'idb'
import type { Chat, ChatDB, Message, UUID } from './types'

const dbPromise = openDB<ChatDB>('chat-db', 1, {
	upgrade(db) {
		db.createObjectStore('chats', { keyPath: 'id' })
		const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
		msgStore.createIndex('chatId', 'chatId')
	},
})

export async function handleNewChat(chat: Chat) {
	const db = await dbPromise
	await db.put('chats', chat)
}

export async function handleNewMessage(message: Message) {
	const db = await dbPromise
	await db.put('messages', message)
}

export async function handleRenameChat(id: string, newTitle: string) {
	const db = await dbPromise
	const chat = await db.get('chats', id)
	if (!chat) throw new Error('Chat not found')
	chat.title = newTitle
	await db.put('chats', chat)
}

export async function handleDeleteChat(id: string) {
	const db = await dbPromise
	await db.delete('chats', id)
}

export async function handleUpdateMessage(message: Message) {
	const db = await dbPromise
	await db.put('messages', JSON.parse(JSON.stringify(message)))
}

export async function getMessages(chatId: string) {
	const db = await dbPromise
	const messages = await db.getAllFromIndex('messages', 'chatId', chatId)
	return messages.sort((a, b) => a.date - b.date)
}

export async function getChats() {
	const db = await dbPromise
	const chats = await db.getAll('chats')
	return chats.sort((a, b) => b.date - a.date)
}

export async function chatExists(chatId: UUID) {
	const db = await dbPromise
	const chat = await db.get('chats', chatId)
	return !!chat
}
