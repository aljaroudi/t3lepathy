import type { DBSchema } from 'idb'
import type { createOpenAI } from '@ai-sdk/openai'
import type { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { createAnthropic } from '@ai-sdk/anthropic'
import type { FilePart, ImagePart, TextPart } from 'ai'

type Chat = {
	id: string
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
	id: string
	chatId: string
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

// Model options are not exported by the SDKs, so we need to infer them from the parameters of the create functions
type OpenAIModel = Parameters<ReturnType<typeof createOpenAI>>[0]
type GoogleModel = Parameters<ReturnType<typeof createGoogleGenerativeAI>>[0]
type AnthropicModel = Parameters<ReturnType<typeof createAnthropic>>[0]
type Capabilities =
	| 'image-input'
	| 'file-input'
	| 'text-output'
	| 'image-output'

type Model =
	| {
			provider: 'OpenAI'
			name: OpenAIModel
			title: string
			description: string
			capabilities: Set<Capabilities>
	  }
	| {
			provider: 'Google'
			name: GoogleModel
			title: string
			description: string
			capabilities: Set<Capabilities>
	  }
	| {
			provider: 'Anthropic'
			name: AnthropicModel
			title: string
			description: string
			capabilities: Set<Capabilities>
	  }

type Provider = Model['provider']

type ResponseLength = 'short' | 'medium' | 'open'

type JsonValue = string | number | boolean | Record | null
