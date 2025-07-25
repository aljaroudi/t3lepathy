import { ui, responseLength } from './state.svelte'
import * as db from './db'
import type { LLMMessage, Message, Model, ResponseLength } from './types'
import { expectsImage, generateResponse, generateTitle, genImage } from './ai'

export async function setCurrentChat(id: string) {
	const messages = await db.getMessages(id)
	ui.setCurrentChatId(id, messages)
}

export async function addChat(title: string) {
	const chat = ui.handleNewChat({
		id: crypto.randomUUID(),
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
	ui.deleteChat(id)
	await db.handleDeleteChat(id)
}

export async function addMessage(
	msg: Extract<Message, { role: 'user' }>,
	model: Model,
	grounding: boolean
) {
	// 1. Add user message to db
	const txtPart = msg.content.find(m => m.type === 'text')?.text
	if (!txtPart) return
	const shouldAutoRename = ui.messages.length === 0
	const titlePromise = shouldAutoRename
		? generateTitle({ message: txtPart })
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
	const imageRequested = await expectsImage({ message: msg, model })
	if (imageRequested) {
		const image = await genImage({ message: txtPart })
		const { message } = ui.addContent(msgIdx, {
			type: 'image',
			image: `data:${image.image.mimeType};base64,${image.image.base64}`,
			mimeType: image.image.mimeType,
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
				ui.messages[msgIdx - 1].tokens = inputTokens
				await db.handleUpdateMessage(ui.messages[msgIdx - 1])
				ui.messages[msgIdx].tokens = outputTokens
				await db.handleUpdateMessage(ui.messages[msgIdx])
			},
			onChunk: async chunk => {
				// @ts-expect-error - we know it's a text part
				ui.messages[msgIdx].content[contentIdx].text += chunk
			},
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
