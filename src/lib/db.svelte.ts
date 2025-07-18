import { openDB } from 'idb'
import type {
	Chat,
	Message,
	ChatDB,
	Model,
	Provider,
	ResponseLength,
	LLMMessage,
} from './types'
import { expectsImage, generateResponse, generateTitle, genImage } from './ai'
import type { ImagePart, TextPart } from 'ai'

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
		return getApiKeys()
	},
	set apiKeys(value: Record<Provider, string>) {
		localStorage.setItem('apiKeys', JSON.stringify(value))
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
		this.messages = messages.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		)
		this.currentChatId = chatId
	},

	async addChat(title: string) {
		const db = await dbPromise
		const chat: Chat = { id: crypto.randomUUID(), title, date: new Date() }
		await db.put('chats', chat)
		this.chats.unshift(chat)

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
		responseLength: ResponseLength,
		grounding: boolean
	) {
		const db = await dbPromise

		const firstMessage = msg.content.find(m => m.type === 'text')?.text
		if (!firstMessage) return

		const shouldAutoRename = this.messages.length === 0

		const titlePromise = shouldAutoRename
			? generateTitle({ message: firstMessage })
			: null
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
			content: [] as Array<TextPart | ImagePart>,
			role: 'assistant' as const,
			date: new Date(),
		} satisfies LLMMessage
		await db.put('messages', reply)
		const msgIdx = this.messages.push(reply) - 1

		// 4. Requested an image?
		const imageRequested = await expectsImage({ message: msg, model })
		if (imageRequested) {
			const image = await genImage({
				message: firstMessage,
				ratio: '1:1',
				size: '1024x1024',
			})
			this.messages[msgIdx].content.push({
				type: 'image',
				image: `data:${image.image.mimeType};base64,${image.image.base64}`,
				mimeType: image.image.mimeType,
			})
			const clone = JSON.parse(JSON.stringify(this.messages[msgIdx]))
			await db.put('messages', clone)
			return
		}

		// 4. Update the message with the response
		const stream = generateResponse({
			messages: chatHistory,
			model,
			maxWords: LENGTH_IN_SENTENCES[responseLength],
			grounding,
		})

		/** index of the text part of the response */
		const txtResponseIdx =
			this.messages[msgIdx].content.push({ type: 'text', text: '' }) - 1

		for await (const chunk of stream) {
			if (this.messages[msgIdx].role === 'user') continue
			if (this.messages[msgIdx].content[txtResponseIdx].type !== 'text')
				continue
			this.messages[msgIdx].content[txtResponseIdx].text += chunk

			// Deep clone the message to avoid IDB DataCloneError (e.g., from proxies or non-cloneable objects)
			const messageToStore = JSON.parse(JSON.stringify(this.messages[msgIdx]))
			await db.put('messages', messageToStore)
		}

		if (!titlePromise) return
		const chat = this.chats.find(c => c.id === msg.chatId)
		if (!chat) return
		chat.title = await titlePromise
		await db.put('chats', { ...chat })
	},

	async deleteChat(id: string) {
		const db = await dbPromise
		const tx = db.transaction('messages', 'readwrite')
		const index = tx.store.index('chatId')
		for await (const cursor of index.iterate(id)) {
			await cursor.delete()
		}
		await tx.done
		await db.delete('chats', id)
		this.chats = this.chats.filter(c => c.id !== id)
		if (this.currentChatId === id) this.currentChatId = null
	},
})

const LENGTH_IN_SENTENCES: Record<ResponseLength, number | null> = {
	short: 3,
	medium: 10,
	open: null,
}

export function getApiKeys() {
	const keys = localStorage.getItem('apiKeys')
	if (!keys) return {} as Record<Provider, string>
	return JSON.parse(keys) as Record<Provider, string>
}

export function persistedState<T extends string>(key: string, initialValue: T) {
	let value = $state<T>((localStorage.getItem(key) as T) || initialValue)

	return {
		get value() {
			return value
		},
		set value(newValue: T) {
			value = newValue
			localStorage.setItem(key, newValue)
		},
	}
}

export const systemPrompt = persistedState<string>(
	'systemPrompt',
	'You are a friendly assistant!'
)

export const titleModel = persistedState<Model['name']>(
	'titleModel',
	'gemini-2.0-flash-lite'
)
