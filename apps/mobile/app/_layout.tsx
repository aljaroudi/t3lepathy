import { Stack } from 'expo-router'

import { ThemeProvider } from '@react-navigation/native'
import { useLayoutEffect, useRef, useState } from 'react'
import { THEME } from '~/lib/constants'
import { useColorScheme } from '~/lib/useColorScheme'
import '../global.css'


export default function RootLayout() {
	const hasMounted = useRef(false)
	const [isLoaded, setIsLoaded] = useState(false)
	const { colorScheme } = useColorScheme()

	useLayoutEffect(() => {
		if (hasMounted.current) return
		setIsLoaded(true)
		hasMounted.current = true
	}, [])

	if (!isLoaded) return null

	return (
		<ThemeProvider value={THEME[colorScheme]}>
			<Stack />
		</ThemeProvider>
	)
}

export { ErrorBoundary } from 'expo-router'
