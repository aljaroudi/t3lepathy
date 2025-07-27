import type { JsonValue } from './types'

export function persistedState<T extends JsonValue>(
	key: string,
	initialValue: T
) {
	let value = $state<T>(getStoredValue(key, initialValue))

	return {
		get value() {
			return value
		},
		set value(newValue: T) {
			localStorage.setItem(key, JSON.stringify(newValue))
			value = getStoredValue(key, newValue)
		},
	}
}

function getStoredValue<T extends JsonValue>(key: string, initialValue: T): T {
	try {
		const stored = localStorage.getItem(key)
		if (!stored) return initialValue
		if (typeof initialValue === 'number') return Number(stored) as T
		if (typeof initialValue === 'boolean') return (stored === 'true') as T
		return JSON.parse(stored) as T
	} catch (error) {
		console.error(`Error  ${key}`, error)
		return initialValue
	}
}
