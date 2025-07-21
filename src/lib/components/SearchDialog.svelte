<script lang="ts">
	import { PlusIcon, Search } from '@lucide/svelte'
	import { state as db } from '../db.svelte'

	let { onClose }: { onClose: () => void } = $props()
	let searchQuery = $state('')
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
>
	<div
		class="relative min-w-[60ch] rounded-xl bg-white/80 shadow-lg dark:bg-slate-800/80 dark:text-slate-200"
	>
		<div class="mx-2 flex items-center gap-2 border-b border-slate-200">
			<p
				class="flex items-center gap-2 text-lg text-slate-500 dark:text-slate-200"
			>
				<Search />
				<span class="text-slate-200">/</span>
				<PlusIcon size="1em" />
			</p>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				name="search"
				id="search"
				placeholder="Search..."
				class="w-full border-none bg-transparent p-2 outline-none focus:ring-0"
				bind:value={searchQuery}
				autofocus
				autocomplete="off"
			/>
			<button
				class="ml-auto cursor-pointer rounded bg-slate-100 px-2 py-1 text-xs text-slate-400 select-none dark:bg-slate-500 dark:text-slate-200"
				onclick={onClose}
			>
				ESC
			</button>
		</div>
		<div class="flex flex-col gap-2">
			{#if searchQuery.length}
				{@const filteredMessages = db.chats
					.filter(chat =>
						chat.title.toLowerCase().includes(searchQuery.toLowerCase())
					)
					.slice(0, 5)}
				{#if filteredMessages.length}
					{#each filteredMessages as chat}
						<button
							class="rounded-xl px-2 py-1 text-left"
							onclick={() => {
								db.setCurrentChat(chat.id)
								onClose()
							}}
						>
							{chat.title}
						</button>
					{/each}
				{:else}
					<p class="text-gray-500">No messages found</p>
				{/if}
			{:else}
				{#each db.chats.slice(0, 5) as chat}
					<button
						class="rounded-xl px-2 py-1 text-left"
						onclick={() => {
							db.setCurrentChat(chat.id)
							onClose()
						}}
					>
						{chat.title}
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
