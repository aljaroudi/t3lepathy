<script lang="ts">
	import { state as db } from '../db.svelte'
	import Panel from '../icons/Panel.svelte'
	import Plus from '../icons/Plus.svelte'
	import Gear from '../icons/Gear.svelte'

	let {
		onClose,
		onCreateChat,
		onSelectChat,
		showDialog,
		onShowDialog,
	}: {
		onClose: () => void
		onCreateChat: () => void
		onSelectChat: (chatId: string) => void
		showDialog: boolean
		onShowDialog: () => void
	} = $props()
</script>

<aside
	class="flex flex-col gap-2 border-r border-gray-200 bg-gray-100 p-4 dark:border-slate-200 dark:bg-slate-800"
>
	<div class="my-1 flex items-center gap-2">
		<button
			class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-gray-200"
			style="transform: rotate(180deg)"
			onclick={onClose}
		>
			<Panel />
		</button>

		<h1 class="font-mono text-xl font-bold">T3lepathy</h1>
	</div>
	<button
		class="flex cursor-pointer items-center justify-center rounded-xl bg-blue-500 p-2 text-white hover:bg-blue-600"
		onclick={onCreateChat}
	>
		<Plus />
	</button>
	<div class="flex max-h-[calc(100vh-10rem)] flex-col gap-2 overflow-y-auto">
		<div class="flex flex-col gap-2">
			{#each db.chats as chat}
				<button
					class="flex cursor-pointer truncate rounded-xl p-2 text-left hover:bg-slate-200 aria-pressed:bg-slate-200 aria-pressed:shadow-xs dark:text-slate-200 dark:aria-pressed:bg-slate-200 dark:aria-pressed:text-slate-800"
					aria-pressed={db.currentChatId === chat.id}
					onclick={() => onSelectChat(chat.id)}
				>
					{chat.title}
				</button>
			{/each}
		</div>
	</div>
	<button
		class="mt-auto w-fit cursor-pointer rounded-xl p-2 shadow-xs hover:animate-spin"
		aria-label="Settings"
		title="Settings"
		aria-pressed={showDialog}
		style="border-radius: 50%"
		aria-busy={Object.keys(db.apiKeys).length === 0}
		onclick={onShowDialog}
	>
		<Gear />
	</button>
</aside>
