import type { Chat, Message, ResponseLength } from './types'
import type { ImagePart, TextPart, Model, Provider } from 'shared'
import { persistedState } from './persisted-state.svelte'

export const ui = createState()

export const responseLength = persistedState<ResponseLength>(
	'responseLength',
	'medium'
)

export const systemPrompt = persistedState<string>(
	'systemPrompt',
	'You are a friendly assistant!'
)

export const currentModelId = persistedState<Model['name']>(
	'currentModel',
	'gemini-2.5-flash-lite'
)

export const titleModel = persistedState<Model['name']>(
	'titleModel',
	'gemini-2.5-flash-lite'
)

export const apiKeys = persistedState<Record<Provider, string>>('apiKeys', {
	OpenAI: '',
	Google: '',
	Anthropic: '',
})

function createState() {
	let stateChats = $state<Chat[]>([])
	let stateMessages = $state<Message[]>([])
	let currentChatId = $state<Chat['id']>(crypto.randomUUID())

	return {
		get chats() {
			return stateChats
		},
		set chats(chats: Chat[]) {
			stateChats = chats
		},
		get messages() {
			return stateMessages
		},
		set messages(messages: Message[]) {
			stateMessages = messages
		},
		get currentChatId() {
			return currentChatId
		},
		setCurrentChatId(id: Chat['id'], messages: Message[]) {
			currentChatId = id
			stateMessages = messages
		},
		handleNewChat(chat: Chat) {
			stateChats.unshift(chat)
			currentChatId = chat.id
			stateMessages = []
			return chat
		},
		handleNewMessage(message: Message) {
			const idx = stateMessages.push(message) - 1
			return idx
		},
		addContent(messageIndex: number, content: TextPart | ImagePart) {
			const index = stateMessages[messageIndex].content.push(content) - 1
			return { index, message: stateMessages[messageIndex] }
		},
		appendContent(messageIndex: number, contentIndex: number, text: string) {
			if (stateMessages[messageIndex].content[contentIndex].type !== 'text')
				throw new Error('Content is not a text part')
			stateMessages[messageIndex].content[contentIndex].text += text
			return stateMessages[messageIndex]
		},
		updateContentText(
			messageIndex: number,
			contentIndex: number,
			text: string
		) {
			// Ensure reactivity by replacing the entire content object
			stateMessages[messageIndex].content[contentIndex] = { type: 'text', text }
			return stateMessages[messageIndex]
		},
		handleRenameChat(id: string, newTitle: string) {
			const index = stateChats.findIndex(c => c.id === id)
			if (index === -1) throw new Error('Chat not found')
			stateChats[index].title = newTitle
			return stateChats[index]
		},
		deleteChat(id: string) {
			const index = stateChats.findIndex(c => c.id === id)
			if (index === -1) throw new Error('Chat not found')
			stateChats.splice(index, 1)
		},
	}
}
