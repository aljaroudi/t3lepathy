import { openDB } from 'idb'
import type {
	Chat,
	Message,
	ChatDB,
	Model,
	Provider,
	ResponseLength,
} from './types'
import { generateResponse, generateTitle } from './ai'

const dbPromise = openDB<ChatDB>('chat-db', 1, {
	upgrade(db) {
		db.createObjectStore('chats', { keyPath: 'id' })
		const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
		msgStore.createIndex('chatId', 'chatId')
	},
})

export let state = $state({
	chats: [] as Chat[],
	messages: [] as Message[],
	currentChatId: null as string | null,

	get apiKeys(): Record<Provider, string> {
		const keys = localStorage.getItem('apiKeys')
		if (!keys) return {} as Record<Provider, string>
		return JSON.parse(keys) as Record<Provider, string>
	},
	set apiKeys(value: Record<Provider, string>) {
		localStorage.setItem('apiKeys', JSON.stringify(value))
	},

	responseLength:
		(localStorage.getItem('responseLength') as ResponseLength) || 'medium',
	setResponseLength(value: ResponseLength) {
		localStorage.setItem('responseLength', value)
	},

	async init() {
		const db = await dbPromise
		// get chats
		const chats = await db.getAll('chats')
		this.chats = chats.sort((a, b) => b.date.getTime() - a.date.getTime())
		// get keys
		const keys = await db.getAll('apiKeys')
		this.apiKeys = keys.reduce(
			(acc, key) => {
				acc[key.provider] = key.value
				return acc
			},
			{} as Record<Provider, string>
		)
	},

	async setCurrentChat(chatId: string) {
		const db = await dbPromise
		const messages = await db.getAllFromIndex('messages', 'chatId', chatId)
		this.messages = messages.sort((a, b) => a.date.getTime() - b.date.getTime())
		this.currentChatId = chatId
	},

	async addChat(title: string) {
		const db = await dbPromise
		const chat: Chat = { id: crypto.randomUUID(), title, date: new Date() }
		await db.put('chats', chat)
		this.chats.push(chat)
		await this.setCurrentChat(chat.id)
		return chat.id
	},

	async renameChat(id: string, newTitle: string) {
		const db = await dbPromise
		const chat = await db.get('chats', id)
		if (!chat) return false
		chat.title = newTitle
		await db.put('chats', chat)
		const local = this.chats.find(c => c.id === id)
		if (local) local.title = newTitle
		return true
	},

	async loadMessages(chatId: string) {
		const db = await dbPromise
		this.messages = await db.getAllFromIndex('messages', 'chatId', chatId)
	},

	async addMessage(
		msg: Extract<Message, { role: 'user' }>,
		model: Model,
		apiKey: string,
		responseLength: ResponseLength
	) {
		const shouldAutoRename = this.messages.length === 0
		const db = await dbPromise
		// 1. Add user message to db
		await db.put('messages', msg)
		this.messages.push(msg)

		// 2. Get all messages for context
		const chatHistory = this.messages.map(m =>
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
		const msgIdx = this.messages.push(reply) - 1

		// 4. Update the message with the response
		const stream = generateResponse({
			messages: chatHistory,
			model,
			apiKey,
			maxWords: LENGTH_IN_SENTENCES[responseLength],
		})

		for await (const chunk of stream) {
			if (this.messages[msgIdx].role === 'user') continue
			this.messages[msgIdx].content += chunk
			await db.put('messages', { ...this.messages[msgIdx] })
		}

		// 5. If it's a new chat, auto-rename it
		if (!shouldAutoRename) return
		const firstMessage = msg.content.find(m => m.type === 'text')?.text
		if (!firstMessage) return

		const chat = this.chats.find(c => c.id === msg.chatId)
		if (!chat) return
		chat.title = ''
		const titleStream = generateTitle({ message: firstMessage, model, apiKey })
		for await (const chunk of titleStream) {
			chat.title += chunk
			await db.put('chats', { ...chat })
		}
	},
})

const LENGTH_IN_SENTENCES: Record<ResponseLength, number | null> = {
	short: 3,
	medium: 10,
	open: null,
}
