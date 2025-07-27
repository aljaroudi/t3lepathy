import { useState } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { Button } from '@/components/ui/button'

import { Text } from '~/components/ui/text'

export default function Index() {
	const [count, setCount] = useState(0)

	return (
		<>
			<Stack.Screen options={{ title: 'Home' }} />
			<View className="flex-1 items-center justify-center gap-2 dark:bg-cyan-950 dark:text-cyan-200">
				<Text className="text-2xl font-bold dark:text-cyan-50">
					Edit app/index.tsx
				</Text>
				<Button
					className="dark:bg-cyan-50"
					onPress={() => setCount(prev => prev + 1)}
				>
					<Text className="dark:text-cyan-950">Count: {count}</Text>
				</Button>
			</View>
		</>
	)
}
