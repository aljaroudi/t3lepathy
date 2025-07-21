<script lang="ts">
	import { PlusIcon, Search } from '@lucide/svelte'
	import { state as db } from '../db.svelte'

	let {
		showSearch = $bindable(false),
		searchQuery = $bindable(''),
	}: { showSearch: boolean; searchQuery: string } = $props()
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
>
	<div class="relative min-w-[60ch] rounded-xl bg-white shadow-lg">
		<div class="mx-2 flex items-center gap-2 border-b border-gray-200">
			<p class="flex items-center gap-2 text-lg text-gray-500">
				<Search />
				<span class="text-gray-200">/</span>
				<PlusIcon size="1em" />
			</p>
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-black"
				style="transform: rotate(45deg)"
				onclick={() => (showSearch = false)}
			>
				<PlusIcon size="1em" />
			</button>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				name="search"
				id="search"
				placeholder="Search..."
				class="w-full border-none p-2 outline-none focus:ring-0"
				bind:value={searchQuery}
				autofocus
				autocomplete="off"
			/>
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
								showSearch = false
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
							showSearch = false
						}}
					>
						{chat.title}
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
