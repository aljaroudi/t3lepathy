<script lang="ts">
	import { Marked } from 'marked'
	import { markedHighlight } from 'marked-highlight'
	import hljs from 'highlight.js'
	import 'highlight.js/styles/atom-one-dark.min.css'
	import { MODELS, PROVIDERS } from './lib/ai'
	import {
		addMessage,
		createChat,
		state as db,
		deleteApiKey,
		initDB,
		setApiKey,
		setCurrentChat,
	} from './lib/db.svelte'
	import type { Model, Provider } from './lib/types'
	import Trash from './lib/icons/Trash.svelte'
	import Panel from './lib/icons/Panel.svelte'
	import Search from './lib/icons/Search.svelte'
	import { convertFileToBase64 } from './lib/storage'
	import Sidebar from './lib/ui/Sidebar.svelte'
	import Plus from './lib/icons/Plus.svelte'
	import Arrow from './lib/icons/Arrow.svelte'

	initDB()

	let currentModel = $state<Model['name']>('gemini-1.5-flash')
	let showDialog = $state(false)
	let showSidebar = $state(true)
	let showSearch = $state(false)
	let searchQuery = $state('')

	async function sendMessage(message: string, files: File[]) {
		const chatId = db.currentChatId || (await createChat('New chat'))

		const model = MODELS.find(m => m.name === currentModel)
		if (!model) return alert('Invalid model')
		const apiKey = db.apiKeys[model.provider]
		if (!apiKey) return alert('No API key found for this model')
		// User
		addMessage(
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
			apiKey
		)
	}

	const marked = new Marked(
		markedHighlight({
			emptyLangClass: 'hljs',
			langPrefix: 'hljs language-',
			highlight(code, lang) {
				const language = hljs.getLanguage(lang) ? lang : 'plaintext'
				return hljs.highlight(code, { language }).value
			},
		})
	).setOptions({ pedantic: false, gfm: true, breaks: false })
</script>

<main
	class="grid h-dvh w-full transition-all duration-300 ease-in-out dark:bg-slate-800 dark:text-slate-100"
	style="grid-template-columns: {showSidebar ? '240px' : '0px'} 1fr"
>
	{#if showSidebar}
		<Sidebar
			onClose={() => (showSidebar = false)}
			onCreateChat={() => createChat('New chat')}
			onSelectChat={chatId => setCurrentChat(chatId)}
			{showDialog}
			onShowDialog={() => (showDialog = true)}
		/>
	{:else}
		<div
			class="mx-3 my-4 flex h-fit w-fit items-center gap-2 rounded-lg bg-slate-200/50 p-1 backdrop-blur-sm"
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
				onclick={() => createChat('New chat')}
			>
				<Plus />
			</button>
		</div>
	{/if}
	<section
		class="relative mx-auto flex h-dvh w-full flex-col gap-2 px-4"
		style="max-width: 80ch"
	>
		<div
			class="flex flex-1 flex-col gap-2 overflow-y-auto"
			style="scroll-padding-bottom: 120px; padding-bottom: calc(120px + 1rem);"
		>
			{#each db.messages as message}
				{#if message.role === 'user'}
					<div
						class="my-2 ml-auto rounded-2xl rounded-br-none bg-zinc-100 px-4 py-2 text-slate-800 shadow-xs"
						style="max-width: 60ch"
					>
						{#each message.content.filter(part => part.type === 'text') as part}
							{@html marked.parse(part.text)}
						{/each}
						{#if message.content.some(part => part.type !== 'text')}
							{@const images = message.content.filter(
								part => part.type === 'image'
							)}
							{@const files = message.content.filter(
								part => part.type === 'file'
							)}
							<div class="flex gap-2">
								{#each images as image}
									<img
										src={image.image}
										alt="Message attachment"
										class="size-20 rounded-lg object-cover"
									/>
								{/each}
								{#each files as file}
									<p
										class="rounded-full bg-cyan-700 px-3 py-1 text-sm text-white"
									>
										{file.filename || `${file.mimeType} file`}
									</p>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<p style="max-width: 80ch">
						{@html marked.parse(message.content)}
					</p>
				{/if}
			{/each}
		</div>
		<!-- Floating input form -->
		<form
			class="absolute right-2 bottom-2 left-2 z-20 mx-auto flex w-full max-w-[60ch] flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-2 shadow-xs backdrop-blur dark:border-slate-200/20 dark:bg-slate-800/80"
			style="height: 120px; max-width: calc(100% - 1rem)"
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
				<select
					name="model"
					id="model"
					required
					bind:value={currentModel}
					class="w-fit rounded-lg border border-gray-200 bg-white p-2 dark:bg-slate-100 dark:text-slate-800"
				>
					{#each PROVIDERS as provider}
						{@const keyIsSet = db.apiKeys[provider]?.length}
						<optgroup label={keyIsSet ? provider : `${provider} (no key)`}>
							{#each MODELS.filter(model => model.provider === provider) as model}
								<option value={model.name} disabled={!keyIsSet}>
									{model.title}
								</option>
							{/each}
						</optgroup>
					{/each}
				</select>
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
			<p>This is a simple dialog popup. You can put any content here.</p>
			<form
				class="grid items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 p-2 shadow-xs"
				style="grid-template-columns: 12ch 2fr 1fr"
				onsubmit={e => {
					e.preventDefault()
					const formData = new FormData(e.currentTarget)
					const provider = formData.get('provider') as Provider
					const apiKey = formData.get('apiKey') as string
					if (!apiKey) return alert('Please enter an API key')
					if (!PROVIDERS.includes(provider)) return alert('Invalid provider')
					setApiKey(provider, apiKey)
				}}
			>
				<!-- provider selection -->
				<select
					name="provider"
					id="provider"
					required
					class="w-fit overflow-hidden rounded-xl border border-gray-200 bg-white p-2"
				>
					{#each PROVIDERS as provider}
						<option value={provider}>{provider}</option>
					{/each}
				</select>

				<!-- api key input -->
				<input
					type="text"
					name="apiKey"
					id="apiKey"
					required
					class="flex-1 rounded bg-white"
					placeholder="Enter your API key"
				/>

				<!-- save button -->
				<button
					type="submit"
					class="ml-auto w-fit rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					<Plus />
				</button>
			</form>
			<!-- saved keys -->
			<div class="my-4 flex flex-col gap-2">
				{#if Object.keys(db.apiKeys).length > 0}
					{#each Object.entries(db.apiKeys) as [provider, key]}
						<div
							class="grid items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2"
							style="grid-template-columns: 12ch 2fr 1fr"
						>
							<label for={`apiKey-${provider}`}>{provider}</label>
							<p class="group truncate text-sm text-gray-500">
								<span class="group-hover:hidden">
									••••••••••••••••••••••••••
								</span>
								<button
									class="hidden cursor-pointer group-hover:inline"
									onclick={() => navigator.clipboard.writeText(key)}
								>
									Copy to clipboard
								</button>
							</p>
							<button
								class="ml-auto w-fit cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
								onclick={() => deleteApiKey(provider as Provider)}
							>
								<Trash />
							</button>
						</div>
					{/each}
				{:else}
					<p class="p-4 text-center text-gray-500">
						No API keys saved. Please enter your API keys below.
					</p>
				{/if}
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
					class="w-full p-2 outline-none"
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
									setCurrentChat(chat.id)
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
								setCurrentChat(chat.id)
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
