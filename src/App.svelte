<script lang="ts">
	import 'highlight.js/styles/atom-one-dark.min.css'
	import { MODELS, PROVIDERS } from './lib/ai'
	import { state as db, responseLength } from './lib/db.svelte'
	import type { Model } from './lib/types'
	import Panel from './lib/icons/Panel.svelte'
	import Search from './lib/icons/Search.svelte'
	import { convertFileToBase64 } from './lib/storage'
	import Sidebar from './lib/components/Sidebar.svelte'
	import Plus from './lib/icons/Plus.svelte'
	import Arrow from './lib/icons/Arrow.svelte'
	import { isValidApiKey } from './lib/validate'
	import * as Select from './lib/components/ui/select/index'
	import '@fontsource-variable/ibm-plex-sans'
	import { LoaderCircleIcon } from '@lucide/svelte'
	import Bubble from './lib/components/Bubble.svelte'

	void db.init()

	let currentModel = $state<Model['name']>('gemini-1.5-flash')
	let showDialog = $state(false)
	let showSidebar = $state(true)
	let showSearch = $state(false)
	let searchQuery = $state('')
	let loading = $state(false)

	async function sendMessage(message: string, files: File[]) {
		const chatId = db.currentChatId || (await db.addChat('New chat'))

		const model = MODELS.find(m => m.name === currentModel)
		if (!model) return alert('Invalid model')
		const apiKey = db.apiKeys[model.provider]
		if (!apiKey) return alert('No API key found for this model')
		// User

		loading = true
		await db
			.addMessage(
				{
					id: crypto.randomUUID(),
					chatId,
					content: [
						{ type: 'text' as const, text: message },
						...(await Promise.all(files.map(convertFileToBase64))),
					],
					role: 'user',
					date: new Date(),
				},
				model,
				responseLength.responseLength
			)
			.finally(() => (loading = false))
	}
</script>

<main
	class="grid h-dvh w-full transition-all duration-300 ease-in-out dark:bg-slate-800 dark:text-slate-100"
	data-sidebar={showSidebar}
	style="grid-template-columns: var(--sidebar-width) 1fr"
>
	{#if showSidebar}
		<Sidebar
			onClose={() => (showSidebar = false)}
			onCreateChat={() => db.addChat('New chat')}
			onSelectChat={chatId => db.setCurrentChat(chatId)}
			{showDialog}
			onShowDialog={() => (showDialog = true)}
		/>
	{:else}
		<div
			class="mx-3 my-4 flex h-fit w-fit items-center gap-2 rounded-lg bg-slate-200/50 p-1 backdrop-blur-sm"
			style="z-index: 10"
		>
			<button
				class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-gray-200"
				style="transform: rotate(180deg)"
				onclick={() => (showSidebar = true)}
			>
				<Panel />
			</button>
			<button
				class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-gray-200"
				onclick={() => db.addChat('New chat')}
			>
				<Plus />
			</button>
		</div>
	{/if}
	<section class="relative flex h-dvh w-full flex-col gap-2 px-4">
		<div
			class="overflow-y-auto"
			style="scroll-padding-bottom: 120px; padding-bottom: calc(120px + 1rem);"
		>
			<div
				class="mx-auto flex w-full flex-1 flex-col gap-4"
				style="width: var(--content-width)"
			>
				{#each db.messages as message}
					<Bubble {message} />
				{/each}
				{#if loading}
					<div class="flex animate-spin items-center justify-center">
						<LoaderCircleIcon />
					</div>
				{/if}
			</div>
		</div>
		<!-- Floating input form -->
		<form
			class="absolute right-2 bottom-0 left-2 z-20 mx-auto flex w-full flex-col gap-2 rounded-t-xl border border-b-0 border-slate-200 bg-white/80 p-2 shadow-xs backdrop-blur-xs dark:border-slate-200/20 dark:bg-slate-800/80"
			style="height: 120px; width: calc(var(--content-width) + 1rem)"
			onsubmit={e => {
				e.preventDefault()
				const formData = new FormData(e.currentTarget)
				const message = formData.get('message') as string
				const files = formData
					.getAll('file')
					.filter(f => f instanceof File && f.name !== '') as File[]
				if (!message.trim()) return
				sendMessage(message.trim(), files)
				const messageInput = e.currentTarget.querySelector('input')
				if (messageInput) messageInput.value = ''
			}}
		>
			<input
				name="message"
				type="text"
				class="border-none bg-transparent p-2 outline-none focus:ring-0 dark:text-slate-200"
				placeholder="Type your message..."
				minLength={1}
				required
				autocomplete="off"
				spellcheck="false"
			/>
			<div class="flex gap-2 px-2 py-1">
				<Select.Root type="single" required bind:value={currentModel}>
					<Select.Trigger
						class="w-[180px] cursor-pointer border-none shadow-none hover:bg-cyan-100 dark:hover:bg-cyan-900"
					>
						{MODELS.filter(m => m.name === currentModel)[0].title}
					</Select.Trigger>
					<Select.Content>
						{#each PROVIDERS as provider}
							{@const keyIsSet = db.apiKeys[provider]?.length}
							<Select.Group>
								<Select.Label class="text-base">{provider}</Select.Label>
								{#each MODELS.filter(model => model.provider === provider) as model}
									<Select.Item value={model.name} disabled={!keyIsSet}>
										<div class="flex flex-col gap-2 pl-2">
											<span>{model.title}</span>
											<span class="text-xs text-gray-500">
												{model.description}
											</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Group>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={responseLength.responseLength}>
					<Select.Trigger
						class="w-[100px] cursor-pointer border-none capitalize shadow-none hover:bg-cyan-100 dark:hover:bg-cyan-900"
					>
						{responseLength.responseLength}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="short">
							<div class="flex flex-col gap-2">
								<span>Short</span>
								<span class="text-xs text-gray-500">Up to 3 sentences</span>
							</div>
						</Select.Item>
						<Select.Item value="medium">
							<div class="flex flex-col gap-2">
								<span>Medium</span>
								<span class="text-xs text-gray-500">Up to 5 sentences</span>
							</div>
						</Select.Item>
						<Select.Item value="open">
							<div class="flex flex-col gap-2">
								<span>Open</span>
								<span class="text-xs text-gray-500">No limit</span>
							</div>
						</Select.Item>
					</Select.Content>
				</Select.Root>

				<button
					type="button"
					class="rounded-full p-2 hover:bg-gray-200 dark:border-slate-200 dark:bg-slate-200 dark:hover:bg-slate-200"
					onclick={() => document.getElementById('file')?.click()}
				>
					📎
				</button>
				<input type="file" name="file" id="file" class="hidden" multiple />
				<button
					type="submit"
					class="ml-auto flex size-10 cursor-pointer items-center justify-center rounded-full bg-cyan-700 text-lg text-white"
				>
					<Arrow />
				</button>
			</div>
		</form>
	</section>
</main>

{#if showDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
	>
		<div class="relative min-w-[300px] rounded-xl bg-white p-6 shadow-lg">
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-black"
				onclick={() => (showDialog = false)}
				>&times;
			</button>
			<h2 class="mb-2 text-xl font-bold">Settings</h2>

			<!-- providers -->
			<div class="flex flex-col gap-2">
				<span class="text-sm text-gray-500">API keys</span>
				{#each PROVIDERS as provider}
					<div class="grid grid-cols-4 items-center gap-2">
						<label for={`apiKey-${provider}`}>{provider}</label>
						<input
							type="text"
							name={`apiKey-${provider}`}
							id={`apiKey-${provider}`}
							placeholder={`${provider} API key`}
							class="col-span-3 rounded-lg border border-gray-200 bg-white p-2 aria-disabled:border-rose-500 dark:bg-slate-100 dark:text-slate-800"
							aria-disabled={!isValidApiKey(provider, db.apiKeys[provider])}
							value={db.apiKeys[provider] || ''}
							oninput={({ currentTarget: { value } }) => {
								db.apiKeys = { ...db.apiKeys, [provider]: value }
							}}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else if showSearch}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
	>
		<div class="relative min-w-[60ch] rounded-xl bg-white shadow-lg">
			<div class="mx-2 flex items-center gap-2 border-b border-gray-200">
				<p class="flex items-center gap-2 text-lg text-gray-500">
					<Search />
					<span class="text-gray-200">/</span>
					<Plus />
				</p>
				<button
					class="absolute top-2 right-2 text-gray-500 hover:text-black"
					style="transform: rotate(45deg)"
					onclick={() => (showSearch = false)}
				>
					<Plus />
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
{/if}

<svelte:window
	onkeydown={e => {
		if (e.key === 'Escape') {
			showDialog = showSearch = false
		} else if (e.key === 'b' && e.metaKey) {
			showSidebar = !showSidebar
		} else if (e.key === 'k' && e.metaKey) {
			showSearch = !showSearch
		} else if (e.key === ',' && e.metaKey && e.shiftKey) {
			showDialog = !showDialog
		}
	}}
/>

<style>
	:global(body) {
		font-family: 'IBM Plex Sans', sans-serif;
	}
	[aria-invalid='true'] {
		border-color: red;
		background-color: red;
	}
</style>
