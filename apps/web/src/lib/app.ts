import { ui, responseLength, titleModel, apiKeys } from './state.svelte'
import * as db from './db'
import type { LLMMessage, Message, ResponseLength, UUID } from './types'
import {
	expectsImage,
	generateResponse,
	generateTitle,
	genImage,
	MODELS,
	type Model,
} from 'shared'

export async function setCurrentChat(id: UUID) {
	const messages = await db.getMessages(id)
	ui.setCurrentChatId(id, messages)
}

export async function addChat(title: string, id?: UUID) {
	const chat = ui.handleNewChat({
		id: id ?? crypto.randomUUID(),
		title,
		date: Date.now(),
	})
	await db.handleNewChat(chat)
	return chat.id
}

export async function renameChat(id: string, newTitle: string) {
	ui.handleRenameChat(id, newTitle)
	await db.handleRenameChat(id, newTitle)
}

export async function deleteChat(id: string) {
	// index of current chat
	const currentChatIndex = ui.chats.findIndex(c => c.id === id)

	ui.deleteChat(id)
	await db.handleDeleteChat(id)

	// select next chat
	// if the current index has a chat, select it. Otherwise create a new one
	const chatId = ui.chats[currentChatIndex]?.id
	if (chatId) await setCurrentChat(chatId)
	else await addChat('New chat')
}

export async function addMessage(
	msg: Extract<Message, { role: 'user' }>,
	model: Model,
	grounding: boolean
) {
	const apiKey = apiKeys.value[model.provider]
	if (!apiKey.length) throw new Error('API key not found')
	// 0. Check if chat exists
	if (!(await db.chatExists(msg.chatId))) {
		await addChat('New chat', msg.chatId)
	}

	// 1. Add user message to db
	const txtPart = msg.content.find(m => m.type === 'text')?.text
	if (!txtPart) return
	const shouldAutoRename = ui.messages.length === 0
	const titlePromise = shouldAutoRename
		? generateTitle({ message: txtPart, ...getTitleModel() })
		: null

	await db.handleNewMessage(msg)
	ui.handleNewMessage(msg)

	// 2. Get all messages for context
	const history = ui.messages.map(m =>
		m.role === 'assistant'
			? {
					role: 'assistant' as const,
					content: m.content.filter(part => part.type !== 'image'),
				}
			: { role: 'user' as const, content: m.content }
	)

	// 3. Add a placeholder for the assistant message
	const messageId = crypto.randomUUID()
	const reply: LLMMessage = {
		id: messageId,
		chatId: msg.chatId,
		content: [],
		role: 'assistant',
		date: Date.now(),
		tokens: 0,
		model: model.name,
	}
	await db.handleNewMessage(reply)
	const msgIdx = ui.handleNewMessage(reply)

	// 4. Requested an image?
	const imageRequested = await expectsImage({ prompt: txtPart, model, apiKey })
	if (imageRequested) {
		const { image } = await genImage({ message: txtPart, apiKey })
		const { message } = ui.addContent(msgIdx, {
			type: 'image',
			image: `data:${image.mediaType};base64,${image.base64}`,
			mediaType: image.mediaType,
		})
		await db.handleUpdateMessage(message)
	} else {
		const contentIdx = ui.addContent(msgIdx, { type: 'text', text: '' }).index

		await generateResponse({
			messages: history,
			model,
			maxSentences: LENGTH_IN_SENTENCES[responseLength.value],
			grounding,
			onStepFinish: async ({ inputTokens, outputTokens }) => {
				ui.messages[msgIdx - 1].tokens = inputTokens ?? null
				await db.handleUpdateMessage(ui.messages[msgIdx - 1])
				ui.messages[msgIdx].tokens = outputTokens ?? null
				await db.handleUpdateMessage(ui.messages[msgIdx])
			},
			onChunk: async chunk => {
				// @ts-expect-error - we know it's a text part
				ui.messages[msgIdx].content[contentIdx].text += chunk
			},
			apiKey,
		})
		await db.handleUpdateMessage(ui.messages[msgIdx])
	}

	if (!titlePromise) return
	const title = await titlePromise
	await db.handleRenameChat(msg.chatId, title)
	ui.handleRenameChat(msg.chatId, title)
}

const LENGTH_IN_SENTENCES: Record<ResponseLength, number | null> = {
	short: 3,
	medium: 10,
	open: null,
}

function getTitleModel() {
	const titleModelId = titleModel.value
	const model = MODELS.find(m => m.name === titleModelId)
	if (!model) throw new Error('Title model not found')
	const apiKey = apiKeys.value[model.provider]
	if (!apiKey) throw new Error('API key not found')
	return { model, apiKey }
}
