import type { Provider } from './types'

export function isValidApiKey(provider: Provider, apiKey: string) {
	if (!apiKey?.length) return true
	switch (provider) {
		case 'OpenAI':
			return apiKey?.startsWith('sk-')
		case 'Google':
			return apiKey?.startsWith('AIza') && apiKey.length === 39
		case 'Anthropic':
			return apiKey?.startsWith('sk-') && apiKey.length === 51
	}
}
