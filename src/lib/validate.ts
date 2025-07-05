import type { Provider } from './types'

export function isValidApiKey(provider: Provider, apiKey: string) {
	switch (provider) {
		case 'OpenAI':
			return apiKey?.startsWith('sk-') && apiKey.length === 51
		case 'Google':
			return apiKey?.startsWith('AIza') && apiKey.length === 39
		case 'Anthropic':
			return apiKey?.startsWith('sk-') && apiKey.length === 51
	}
}
