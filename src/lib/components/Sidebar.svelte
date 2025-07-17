<script lang="ts">
	import { state as db } from '../db.svelte'
	import Panel from '../icons/Panel.svelte'
	import Plus from '../icons/Plus.svelte'
	import Gear from '../icons/Gear.svelte'
	import { dateToRelativeTime } from '../date'

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

	const groupedChats = $derived(
		Object.groupBy(db.chats, chat => dateToRelativeTime(chat.date))
	)
</script>

<aside
	class="flex flex-col gap-2 bg-gradient-to-b from-slate-100 to-slate-200 p-4 dark:bg-slate-800"
>
	<div class="my-1 flex items-center justify-between gap-2">
		<button
			class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-gray-200"
			style="transform: rotate(180deg)"
			onclick={onClose}
		>
			<Panel />
		</button>

		<h1 class="text-xl font-thin tracking-widest text-shadow-lg">T3lepathy</h1>
		<button
			class="flex cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-cyan-600 p-2 text-white hover:bg-cyan-600 hover:text-white dark:text-white"
			onclick={onCreateChat}
		>
			<Plus />
		</button>
	</div>
	<div class="flex max-h-[calc(100vh-10rem)] flex-col gap-2 overflow-y-auto">
		<div class="flex flex-col gap-2">
			{#each Object.entries(groupedChats) as [date, chats]}
				<div class="flex flex-col gap-2">
					<h2 class="text-sm font-thin">{date}</h2>
					{#each chats as chat}
						<button
							class="flex cursor-pointer truncate rounded-lg p-2 text-left hover:bg-white aria-pressed:bg-white aria-pressed:shadow-xs dark:text-slate-200 dark:aria-pressed:bg-slate-200 dark:aria-pressed:text-slate-800"
							aria-pressed={db.currentChatId === chat.id}
							onclick={() => onSelectChat(chat.id)}
						>
							{chat.title}
						</button>
					{/each}
				</div>
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
