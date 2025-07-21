<script lang="ts">
	import { state as db } from '../db.svelte'
	import Panel from '../icons/Panel.svelte'
	import { dateToRelativeTime } from '../date'
	import { PlusIcon, SearchIcon, Settings, Trash2Icon } from '@lucide/svelte'
	import ActionButton from './ActionButton.svelte'

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

	let searchQuery = $state('')
	const groupedChats = $derived(
		Object.groupBy(
			db.chats.filter(chat =>
				chat.title.toLowerCase().includes(searchQuery.toLowerCase())
			),
			chat => dateToRelativeTime(chat.date)
		)
	)
</script>

<aside
	class="flex max-h-dvh flex-col gap-4 bg-linear-to-b from-slate-100 to-slate-200 p-4 dark:bg-slate-800 dark:from-cyan-950 dark:to-slate-950"
>
	<div class="my-1 flex items-center justify-between gap-2">
		<button
			class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-gray-200"
			style="transform: rotate(180deg)"
			onclick={onClose}
		>
			<Panel />
		</button>

		<h1
			class="w-full text-center text-xl font-thin tracking-widest text-shadow-lg"
		>
			T3lepathy
		</h1>

		<button
			class="mt-auto size-10 cursor-pointer"
			aria-label="Settings"
			title="Settings"
			aria-pressed={showDialog}
			style="border-radius: 50%"
			aria-busy={Object.keys(db.apiKeys).length === 0}
			onclick={onShowDialog}
		>
			<Settings size="1em" class="hover:animate-spin" />
		</button>
	</div>
	<!-- search box -->
	<div
		class="flex w-full items-center gap-1 border-b border-slate-200 pb-2 text-sm"
	>
		<span class="p-2">
			<SearchIcon size="1.2em" class="text-slate-400" />
		</span>
		<input
			type="text"
			placeholder="Search"
			class="w-full border-none bg-transparent p-0 outline-none focus:ring-0"
			bind:value={searchQuery}
		/>
		<ActionButton id="submit" type="submit" onclick={onCreateChat}>
			<PlusIcon size="1em" />
		</ActionButton>
	</div>
	<div
		class="flex flex-col gap-2 overflow-y-auto scroll-smooth"
		style="max-height: calc(100dvh - 8rem)"
	>
		<div class="flex flex-col gap-2">
			{#each Object.entries(groupedChats) as [date, chats]}
				<div class="flex flex-col gap-2">
					<h2 class="text-xs font-thin">{date}</h2>
					{#each chats as chat}
						<button
							class="flex cursor-pointer rounded-lg p-2 text-left hover:bg-white aria-pressed:bg-white aria-pressed:shadow-xs dark:text-slate-200 dark:aria-pressed:bg-slate-200 dark:aria-pressed:text-slate-800"
							aria-pressed={db.currentChatId === chat.id}
							onclick={() => onSelectChat(chat.id)}
						>
							<span class="block w-full truncate" style="min-width: 0;">
								{chat.title}
							</span>
							{#if db.currentChatId === chat.id}
								<!-- svelte-ignore node_invalid_placement_ssr -->
								<button
									class="ml-auto cursor-pointer rounded-lg p-1 hover:bg-slate-200"
									onclick={() => db.deleteChat(chat.id)}
								>
									<Trash2Icon size="1em" />
								</button>
							{/if}
						</button>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</aside>
