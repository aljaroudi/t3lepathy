import {
	generateText,
	streamText,
	experimental_generateImage as generateImage,
} from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { ContextMessage, Model, Provider } from './types'
import { getApiKeys } from './db.svelte'

function getModel(model: Model) {
	const apiKey = getApiKeys()[model.provider]
	switch (model.provider) {
		case 'OpenAI':
			return createOpenAI({ apiKey })(model.name)
		case 'Google':
			return createGoogleGenerativeAI({ apiKey })(model.name)
		case 'Anthropic':
			return createAnthropic({ apiKey })(model.name)
	}
}

export async function genImage({
	message,
	ratio,
	size,
}: {
	message: string
	ratio: `${number}:${number}`
	size: `${number}x${number}`
}) {
	const apiKey = getApiKeys()['OpenAI']
	if (!apiKey) throw new Error('No API key found')
	return generateImage({
		model: createOpenAI({ apiKey }).image('dall-e-3'),
		prompt: message,
		size,
		aspectRatio: ratio,
		seed: getSeed(),
		maxRetries: 1,
	})
}

export function generateResponse({
	messages,
	model,
	maxWords,
}: {
	messages: ContextMessage[]
	model: Model
	maxWords: number | null
}) {
	const systemPrompt = 'You are a friendly assistant!'
	const result = streamText({
		model: getModel(model),
		system: maxWords
			? systemPrompt + ` You will respond in ${maxWords} sentences.`
			: systemPrompt,
		// @ts-expect-error - TODO: update types
		messages,
		seed: getSeed(),
	})
	return result.textStream
}

export async function expectsImage({
	message,
	model,
}: {
	message: ContextMessage
	model: Model
}): Promise<boolean> {
	return generateText({
		model: getModel(model),
		system:
			"You are a helpful assistant that can determine if a message expects an image. If it does, return 'true'. If it doesn't, return 'false'. If you are not sure, return 'false'.",
		messages: [{ role: 'user', content: message.content }],
	}).then(result => result.text.includes('true'))
}

export function generateTitle({
	message,
	model,
}: {
	message: string
	model: Model
}) {
	return streamText({
		model: getModel(model),
		system:
			"Generate a short, descriptive title (max 5 words) for this conversation based on the user's first message. The title should capture the main topic or purpose of the discussion.",
		messages: [{ role: 'user', content: message }],
	}).textStream
}

export const MODELS = [
	{
		provider: 'OpenAI',
		title: 'GPT-4o Mini',
		name: 'gpt-4o-mini',
		description: 'Smallest, fast, cost-efficient',
	},
	{
		provider: 'OpenAI',
		title: 'GPT-4o',
		name: 'gpt-4o',
		description: 'Balanced performance and cost',
	},
	{
		provider: 'Google',
		title: 'Gemini 1.5 Flash',
		name: 'gemini-1.5-flash',
		description: 'Fastest, cost-efficient Gemini',
	},
	{
		provider: 'Google',
		title: 'Gemini 1.5 Pro',
		name: 'gemini-1.5-pro',
		description: 'Balanced Gemini performance/cost',
	},
	{
		provider: 'Anthropic',
		title: 'Claude 3.5 Sonnet',
		name: 'claude-3-5-sonnet-20240620',
		description: 'Balanced Claude performance/cost',
	},
] satisfies Model[]

export const PROVIDERS = ['Google', 'OpenAI', 'Anthropic'] satisfies Provider[]

function getSeed() {
	return Math.floor(Math.random() * 1_000_000)
}
