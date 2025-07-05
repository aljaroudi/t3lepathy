import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { ContextMessage, Model, Provider } from './types'

function getModel(model: Model, apiKey: string) {
	switch (model.provider) {
		case 'OpenAI':
			return createOpenAI({ apiKey })(model.name)
		case 'Google':
			return createGoogleGenerativeAI({ apiKey })(model.name)
		case 'Anthropic':
			return createAnthropic({ apiKey })(model.name)
	}
}

export function generateResponse({
	messages,
	model,
	apiKey,
	maxWords,
}: {
	messages: ContextMessage[]
	model: Model
	apiKey: string
	maxWords: number | null
}) {
	const systemPrompt = 'You are a friendly assistant!'
	const result = streamText({
		model: getModel(model, apiKey),
		system: maxWords
			? systemPrompt + ` You will respond in ${maxWords} words.`
			: systemPrompt,
		messages,
		seed: Math.floor(Math.random() * 1_000_000),
	})
	return result.textStream
}

export function generateTitle({
	message,
	model,
	apiKey,
}: {
	message: string
	model: Model
	apiKey: string
}) {
	return streamText({
		model: getModel(model, apiKey),
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
	},
	{
		provider: 'OpenAI',
		title: 'GPT-4o',
		name: 'gpt-4o',
	},
	{
		provider: 'Google',
		title: 'Gemini 1.5 Flash',
		name: 'gemini-1.5-flash',
	},
	{
		provider: 'Google',
		title: 'Gemini 1.5 Pro',
		name: 'gemini-1.5-pro',
	},
	{
		provider: 'Anthropic',
		title: 'Claude 3.5 Sonnet',
		name: 'claude-3-5-sonnet-20240620',
	},
] satisfies Model[]

export const PROVIDERS = ['Google', 'OpenAI', 'Anthropic'] satisfies Provider[]
