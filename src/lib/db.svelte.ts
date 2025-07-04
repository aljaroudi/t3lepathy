import { openDB } from 'idb'
import type { Chat, Message, ChatDB, Model, Provider } from './types'
import { generateResponse, generateTitle } from './ai'

const dbPromise = openDB<ChatDB>('chat-db', 1, {
	upgrade(db) {
		db.createObjectStore('chats', { keyPath: 'id' })
		const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
		msgStore.createIndex('chatId', 'chatId')
		db.createObjectStore('apiKeys', { keyPath: 'provider' })
	},
})

export let state = $state({
	chats: [] as Chat[],
	messages: [] as Message[],
	currentChatId: null as string | null,
	apiKeys: {} as Record<Provider, string>,
})

export async function initDB() {
	const db = await dbPromise
	// get chats
	const chats = await db.getAll('chats')
	state.chats = chats.sort((a, b) => b.date.getTime() - a.date.getTime())
	// get keys
	const keys = await db.getAll('apiKeys')
	state.apiKeys = keys.reduce(
		(acc, key) => {
			acc[key.provider] = key.value
			return acc
		},
		{} as Record<Provider, string>
	)
}

export async function setCurrentChat(chatId: string) {
	const db = await dbPromise
	const messages = await db.getAllFromIndex('messages', 'chatId', chatId)
	state.messages = messages.sort((a, b) => a.date.getTime() - b.date.getTime())
	state.currentChatId = chatId
}

export async function createChat(title: string) {
	const db = await dbPromise
	const chat: Chat = { id: crypto.randomUUID(), title, date: new Date() }
	await db.put('chats', chat)
	state.chats.push(chat)
	setCurrentChat(chat.id)
	return chat.id
}

export async function renameChat(id: string, newTitle: string) {
	const db = await dbPromise
	const chat = await db.get('chats', id)
	if (!chat) return false
	chat.title = newTitle
	await db.put('chats', chat)

	const local = state.chats.find(c => c.id === id)
	if (local) local.title = newTitle
	return true
}

export async function loadMessages(chatId: string) {
	const db = await dbPromise
	state.messages = await db.getAllFromIndex('messages', 'chatId', chatId)
}

export async function addMessage(
	/** Message where role is 'user' */
	msg: Extract<Message, { role: 'user' }>,
	model: Model,
	apiKey: string
) {
	const shouldAutoRename = state.messages.length === 0
	const db = await dbPromise
	// 1. Add user message to db
	await db.put('messages', msg)
	state.messages.push(msg)

	// 2. Get all messages for context
	const chatHistory = state.messages.map(m =>
		m.role === 'assistant'
			? { role: 'assistant' as const, content: m.content }
			: { role: 'user' as const, content: m.content }
	)

	// 3. Add a placeholder for the assistant message
	const messageId = crypto.randomUUID()
	const reply = {
		id: messageId,
		chatId: msg.chatId,
		content: '',
		role: 'assistant' as const,
		date: new Date(),
	} satisfies Message
	await db.put('messages', reply)
	const msgIdx = state.messages.push(reply) - 1

	// 4. Update the message with the response
	const stream = generateResponse({ messages: chatHistory, model, apiKey })

	for await (const chunk of stream) {
		if (state.messages[msgIdx].role === 'user') continue
		state.messages[msgIdx].content += chunk
		await db.put('messages', { ...state.messages[msgIdx] })
	}

	// 5. If it's a new chat, auto-rename it
	if (!shouldAutoRename) return
	const firstMessage = msg.content.find(m => m.type === 'text')?.text
	if (!firstMessage) return

	const chat = state.chats.find(c => c.id === msg.chatId)
	if (!chat) return
	chat.title = ''
	const titleStream = generateTitle({ message: firstMessage, model, apiKey })
	for await (const chunk of titleStream) {
		chat.title += chunk
		await db.put('chats', { ...chat })
	}
}

export async function setApiKey(provider: Provider, apiKey: string) {
	const db = await dbPromise
	await db.put('apiKeys', {
		provider: provider,
		value: apiKey,
	})
	state.apiKeys[provider] = apiKey
}

export async function getApiKey(provider: Provider) {
	const db = await dbPromise
	const apiKey = await db.get('apiKeys', provider)
	return apiKey?.value
}

export async function deleteApiKey(provider: Provider) {
	const db = await dbPromise
	await db.delete('apiKeys', provider)
	delete state.apiKeys[provider]
}
