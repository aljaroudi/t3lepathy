import type { DBSchema } from 'idb'
import type { FilePart, ImagePart, TextPart } from 'shared'

type Chat = {
	id: UUID
	title: string
	date: number
}

type UserContextMessage = {
	role: 'user'
	content: Array<TextPart | ImagePart | FilePart>
}
type LLMContextMessage = {
	role: 'assistant'
	content: Array<TextPart | ImagePart | FilePart>
}
type ContextMessage = UserContextMessage | LLMContextMessage

type MessageBase = {
	id: UUID
	chatId: UUID
	date: number
	tokens: number | null
	model: Model['name']
}
type UserMessage = UserContextMessage & MessageBase
type LLMMessage = LLMContextMessage & MessageBase
type Message = UserMessage | LLMMessage

type ApiKey = {
	provider: Provider
	value: string
}

interface ChatDB extends DBSchema {
	chats: {
		key: string
		value: Chat
	}
	messages: {
		key: string
		value: Message
		indexes: { chatId: string }
	}
	apiKeys: {
		key: string
		value: ApiKey
	}
}

type ResponseLength = 'short' | 'medium' | 'open'

type JsonValue = string | number | boolean | Record | null

type UUID = `${string}-${string}-${string}-${string}-${string}`
