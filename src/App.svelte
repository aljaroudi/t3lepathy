<script lang="ts">
	import { Marked } from 'marked'
	import { markedHighlight } from 'marked-highlight'
	import hljs from 'highlight.js'
	import 'highlight.js/styles/github.css'
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
	import Plus from './lib/icons/Plus.svelte'
	import Gear from './lib/icons/Gear.svelte'

	initDB()

	let currentModel = $state<Model['name']>('gemini-1.5-flash')

	let showDialog = $state(false)

	async function sendMessage(message: string) {
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
				content: message,
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

<main class="grid h-dvh w-full" style="grid-template-columns: 200px 1fr">
	<aside class="flex flex-col gap-2 border-r border-gray-200 bg-gray-100 p-4">
		<h1 class="text-2xl font-bold">T3lepathy</h1>
		<button
			class="flex cursor-pointer items-center justify-center rounded-xl border bg-blue-500 p-2 text-white hover:bg-blue-600"
			onclick={() => createChat('New chat')}
		>
			<Plus />
		</button>
		<div class="flex flex-col gap-2 overflow-y-auto">
			{#each db.chats as chat}
				<button
					class="flex truncate rounded-xl p-2 text-left aria-pressed:bg-gray-200 aria-pressed:shadow-xs"
					aria-pressed={db.currentChatId === chat.id}
					onclick={() => setCurrentChat(chat.id)}
				>
					{chat.title}
				</button>
			{/each}
		</div>
		<button
			class="mt-auto w-fit cursor-pointer rounded-xl bg-gray-200 p-2 shadow-xs hover:bg-gray-300"
			aria-label="Settings"
			title="Settings"
			aria-pressed={showDialog}
			style="border-radius: 50%"
			aria-busy={Object.keys(db.apiKeys).length === 0}
			onclick={() => (showDialog = true)}
		>
			<Gear />
		</button>
	</aside>
	<section
		class="mx-auto flex h-dvh flex-col gap-2 px-4 py-2"
		style="max-width: 100ch"
	>
		<div class="flex flex-col gap-2 overflow-y-auto">
			{#each db.messages as message}
				{#if message.role === 'user'}
					<p
						class="ml-auto rounded-2xl rounded-br-none bg-gray-100 px-4 py-2"
						style="max-width: 80ch"
					>
						{@html marked.parse(message.content)}
					</p>
				{:else}
					<p style="max-width: 80ch">
						{@html marked.parse(message.content)}
					</p>
				{/if}
			{/each}
		</div>
		<form
			class="mt-auto flex gap-2"
			onsubmit={e => {
				e.preventDefault()
				const formData = new FormData(e.currentTarget)
				const message = formData.get('message') as string
				sendMessage(message.trim())
				const messageInput = e.currentTarget.querySelector('input')
				if (messageInput) messageInput.value = ''
			}}
		>
			<select name="model" id="model" required bind:value={currentModel}>
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
			<input
				name="message"
				type="text"
				class="flex-1 rounded-xl border p-2"
				placeholder="Type your message..."
				minLength={1}
				required
			/>
			<button type="submit" class="rounded-xl border p-2"> Send </button>
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
{/if}

<svelte:window
	onkeydown={e => e.key === 'Escape' && showDialog && (showDialog = false)}
/>
