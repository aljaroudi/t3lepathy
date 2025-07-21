import type { DBSchema } from 'idb'
import type { createOpenAI } from '@ai-sdk/openai'
import type { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { createAnthropic } from '@ai-sdk/anthropic'
import type { FilePart, ImagePart, TextPart } from 'ai'

export type Chat = {
	id: string
	title: string
	date: Date
}

export type UserContextMessage = {
	role: 'user'
	content: Array<TextPart | ImagePart | FilePart>
}
export type LLMContextMessage = {
	role: 'assistant'
	content: Array<TextPart | ImagePart>
}
export type ContextMessage = UserContextMessage | LLMContextMessage

type MessageBase = { id: string; chatId: string; date: Date }
type UserMessage = ContextMessage & MessageBase
type LLMMessage = ContextMessage & MessageBase
export type Message = UserMessage | LLMMessage

type ApiKey = {
	provider: Provider
	value: string
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

export type Model =
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
